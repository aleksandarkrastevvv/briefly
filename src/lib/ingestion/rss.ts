import type { Database } from "@/lib/database.types";

type SourceRow = Database["public"]["Tables"]["sources"]["Row"];
type RawArticleInsert = Database["public"]["Tables"]["raw_articles"]["Insert"];

export type FeedKind = "rss" | "atom" | "xml";

export type ParsedFeedItem = {
  title: string;
  originalUrl: string;
  publicationDate: string | null;
  excerpt: string | null;
  author: string | null;
  category: string | null;
  guid: string | null;
};

const trackingParams = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
]);

export type PlannedIngestionRun = {
  sourceId: string;
  sourceName: string;
  marketCode: string;
  sourceCategory: string;
  feedUrl: string;
  feedKind: FeedKind;
};

export function planRssIngestion(sources: SourceRow[]): PlannedIngestionRun[] {
  return sources.flatMap((source) => {
    const feedKind = source.source_type as FeedKind;
    const hasSupportedFeed =
      feedKind === "rss" || feedKind === "atom" || feedKind === "xml";

    if (
      !source.active ||
      !source.feed_or_page_url ||
      !hasSupportedFeed ||
      source.verification_status !== "verified_feed"
    ) {
      return [];
    }

    return {
      sourceId: source.id,
      sourceName: source.name,
      marketCode: source.market_code,
      sourceCategory: source.category,
      feedUrl: source.feed_or_page_url,
      feedKind,
    };
  });
}

export function parseFeedItems(xml: string): ParsedFeedItem[] {
  const rssItems = matchBlocks(xml, "item").map(parseRssItem);
  if (rssItems.length > 0) return rssItems;

  return matchBlocks(xml, "entry").map(parseAtomEntry);
}

export function normalizeFeedItem(
  item: ParsedFeedItem,
  sourceCategory: string,
): ParsedFeedItem {
  const title = cleanText(item.title);
  const originalUrl = normalizeUrl(item.originalUrl);
  const excerpt = cleanText(item.excerpt);
  const author = cleanText(item.author);
  const category = normalizeCategory(item.category) ?? normalizeCategory(sourceCategory);
  const guid = cleanText(item.guid);

  return {
    title: title || "Untitled",
    originalUrl,
    publicationDate: normalizeDate(item.publicationDate),
    excerpt,
    author,
    category,
    guid,
  };
}

export function dedupeFeedItems(items: ParsedFeedItem[]): ParsedFeedItem[] {
  const seen = new Set<string>();
  const uniqueItems: ParsedFeedItem[] = [];

  for (const item of items) {
    const key = item.originalUrl || item.guid || item.title;
    if (!key || seen.has(key)) continue;

    seen.add(key);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

export function toRawArticleInsert(
  source: Pick<SourceRow, "id" | "market_code" | "category">,
  item: ParsedFeedItem,
): RawArticleInsert {
  return {
    market_code: source.market_code,
    source_id: source.id,
    title: cleanText(item.title) || "Untitled",
    original_url: normalizeUrl(item.originalUrl),
    publication_date: item.publicationDate,
    excerpt: cleanText(item.excerpt),
    author: cleanText(item.author),
    category: normalizeCategory(item.category) ?? normalizeCategory(source.category),
    guid: cleanText(item.guid),
  };
}

function parseRssItem(xml: string): ParsedFeedItem {
  return {
    title: readTag(xml, "title") ?? "Untitled",
    originalUrl: readTag(xml, "link") ?? "",
    publicationDate: normalizeDate(readTag(xml, "pubDate")),
    excerpt: readTag(xml, "description"),
    author: readTag(xml, "author") ?? readTag(xml, "dc:creator"),
    category: readTag(xml, "category"),
    guid: readTag(xml, "guid"),
  };
}

function parseAtomEntry(xml: string): ParsedFeedItem {
  return {
    title: readTag(xml, "title") ?? "Untitled",
    originalUrl: readAtomLink(xml) ?? "",
    publicationDate: normalizeDate(readTag(xml, "updated") ?? readTag(xml, "published")),
    excerpt: readTag(xml, "summary") ?? readTag(xml, "content"),
    author: readTag(readBlock(xml, "author") ?? "", "name"),
    category: readAtomCategory(xml),
    guid: readTag(xml, "id"),
  };
}

function matchBlocks(xml: string, tagName: string): string[] {
  return [...xml.matchAll(new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, "gi"))].map(
    ([match]) => match,
  );
}

function readBlock(xml: string, tagName: string): string | null {
  return (
    xml.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"))?.[1] ??
    null
  );
}

function readTag(xml: string, tagName: string): string | null {
  const value = readBlock(xml, tagName);
  if (!value) return null;

  return cleanText(
    decodeXml(value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "")),
  );
}

function readAtomLink(xml: string): string | null {
  return (
    xml.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/i)?.[1] ??
    readTag(xml, "link")
  );
}

function readAtomCategory(xml: string): string | null {
  return xml.match(/<category\b[^>]*\bterm=["']([^"']+)["'][^>]*>/i)?.[1] ?? null;
}

function normalizeDate(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function normalizeUrl(value: string): string {
  const trimmed = cleanText(value) ?? "";
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    url.hash = "";

    for (const param of [...url.searchParams.keys()]) {
      if (trackingParams.has(param.toLowerCase())) {
        url.searchParams.delete(param);
      }
    }

    url.hostname = url.hostname.toLowerCase();
    return url.toString();
  } catch {
    return trimmed;
  }
}

function normalizeCategory(value: string | null): string | null {
  const cleaned = cleanText(value);
  if (!cleaned) return null;

  return cleaned.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "_").replace(/^_+|_+$/g, "");
}

function cleanText(value: string | null): string | null {
  if (!value) return null;

  const cleaned = decodeXml(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || null;
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
