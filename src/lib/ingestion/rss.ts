import type { Database } from "@/lib/database.types";

type SourceRow = Database["public"]["Tables"]["sources"]["Row"];
type RawArticleInsert = Database["public"]["Tables"]["raw_articles"]["Insert"];

export type FeedKind = "rss" | "atom" | "xml";
export type HtmlSourceKind = "html" | "official";
export type IngestionKind = FeedKind | HtmlSourceKind;

export type ParsedFeedItem = {
  title: string;
  originalUrl: string;
  publicationDate: string | null;
  excerpt: string | null;
  author: string | null;
  category: string | null;
  guid: string | null;
};

export type HtmlParserConfig = {
  allowedPathPrefixes?: string[];
  includeKeywords?: string[];
  excludeKeywords?: string[];
  maxLinks?: number;
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
  sourceUrl: string;
  sourceKind: IngestionKind;
  parserConfig: HtmlParserConfig;
};

export function planRssIngestion(sources: SourceRow[]): PlannedIngestionRun[] {
  return planContentIngestion(sources).filter((run) =>
    isFeedKind(run.sourceKind),
  );
}

export function planContentIngestion(sources: SourceRow[]): PlannedIngestionRun[] {
  return sources.flatMap((source) => {
    const sourceKind = source.source_type as IngestionKind;
    const hasSupportedFeed = isFeedKind(sourceKind);
    const hasSupportedHtmlParser = isHtmlSourceKind(sourceKind);

    if (
      !source.active ||
      !source.feed_or_page_url ||
      (!hasSupportedFeed && !hasSupportedHtmlParser)
    ) {
      return [];
    }

    if (hasSupportedFeed && source.verification_status !== "verified_feed") {
      return [];
    }

    if (
      hasSupportedHtmlParser &&
      source.verification_status !== "configured_html_parser"
    ) {
      return [];
    }

    return {
      sourceId: source.id,
      sourceName: source.name,
      marketCode: source.market_code,
      sourceCategory: source.category,
      sourceUrl: source.feed_or_page_url,
      sourceKind,
      parserConfig: readHtmlParserConfig(source.parser_config),
    };
  });
}

export function parseFeedItems(xml: string): ParsedFeedItem[] {
  const rssItems = matchBlocks(xml, "item").map(parseRssItem);
  if (rssItems.length > 0) return rssItems;

  return matchBlocks(xml, "entry").map(parseAtomEntry);
}

export function parseHtmlItems(
  html: string,
  pageUrl: string,
  config: HtmlParserConfig = {},
): ParsedFeedItem[] {
  const baseUrl = new URL(pageUrl);
  const titleCandidates = new Map<string, ParsedFeedItem>();
  const maxLinks = config.maxLinks ?? 20;

  for (const anchor of matchAnchors(html)) {
    const originalUrl = normalizeHtmlUrl(anchor.href, baseUrl);
    const title = cleanText(stripHtml(anchor.label));

    if (!originalUrl || !title || !looksLikeArticle(title, originalUrl, config)) {
      continue;
    }

    if (!titleCandidates.has(originalUrl)) {
      titleCandidates.set(originalUrl, {
        title,
        originalUrl,
        publicationDate: readNearbyDate(html, anchor.index),
        excerpt: null,
        author: null,
        category: null,
        guid: originalUrl,
      });
    }

    if (titleCandidates.size >= maxLinks) break;
  }

  return [...titleCandidates.values()];
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

function matchAnchors(html: string): Array<{ href: string; label: string; index: number }> {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
    .map((match) => {
      const href = match[1]?.match(/\bhref=["']([^"']+)["']/i)?.[1] ?? "";

      return {
        href,
        label: match[2] ?? "",
        index: match.index ?? 0,
      };
    })
    .filter((anchor) => anchor.href);
}

function normalizeHtmlUrl(value: string, baseUrl: URL): string {
  const trimmed = cleanText(decodeXml(value)) ?? "";
  if (
    !trimmed ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("javascript:")
  ) {
    return "";
  }

  try {
    const url = new URL(trimmed, baseUrl);
    if (url.hostname.replace(/^www\./, "") !== baseUrl.hostname.replace(/^www\./, "")) {
      return "";
    }

    return normalizeUrl(url.toString());
  } catch {
    return "";
  }
}

function looksLikeArticle(
  title: string,
  originalUrl: string,
  config: HtmlParserConfig,
): boolean {
  const lowerTitle = title.toLowerCase();
  const url = new URL(originalUrl);
  const path = url.pathname.toLowerCase();
  const allowedPathPrefixes = config.allowedPathPrefixes ?? [];
  const includeKeywords = config.includeKeywords ?? [];
  const excludeKeywords = [
    "facebook",
    "instagram",
    "youtube",
    "rss",
    "абонамент",
    "контакти",
    "карта",
    "начало",
    "login",
    "register",
    ...(config.excludeKeywords ?? []),
  ];

  if (title.length < 12 || title.length > 180) return false;
  if (allowedPathPrefixes.length > 0 && !allowedPathPrefixes.some((prefix) => path.startsWith(prefix))) {
    return false;
  }

  if (
    includeKeywords.length > 0 &&
    !includeKeywords.some((keyword) => path.includes(keyword.toLowerCase()))
  ) {
    return false;
  }

  return !excludeKeywords.some((keyword) => lowerTitle.includes(keyword.toLowerCase()));
}

function readNearbyDate(html: string, anchorIndex: number): string | null {
  const window = html.slice(Math.max(0, anchorIndex - 400), anchorIndex + 400);
  const datetime =
    window.match(/<time\b[^>]*\bdatetime=["']([^"']+)["'][^>]*>/i)?.[1] ??
    window.match(/\b(\d{4}-\d{2}-\d{2})(?:[t\s]\d{2}:\d{2}(?::\d{2})?)?/i)?.[0] ??
    null;

  return normalizeDate(datetime);
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

function readHtmlParserConfig(value: SourceRow["parser_config"]): HtmlParserConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const config = value as Record<string, unknown>;

  return {
    allowedPathPrefixes: readStringArray(config.allowedPathPrefixes),
    includeKeywords: readStringArray(config.includeKeywords),
    excludeKeywords: readStringArray(config.excludeKeywords),
    maxLinks: typeof config.maxLinks === "number" ? config.maxLinks : undefined,
  };
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const strings = value.filter((item): item is string => typeof item === "string");
  return strings.length > 0 ? strings : undefined;
}

function isFeedKind(value: string): value is FeedKind {
  return value === "rss" || value === "atom" || value === "xml";
}

function isHtmlSourceKind(value: string): value is HtmlSourceKind {
  return value === "html" || value === "official";
}

function cleanText(value: string | null): string | null {
  if (!value) return null;

  const cleaned = decodeXml(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || null;
}

function stripHtml(value: string): string {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ");
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
