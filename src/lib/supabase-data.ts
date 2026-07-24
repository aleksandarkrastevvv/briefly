import type { BrieflySource, MarketCode } from "./briefly";
import { getSourcesForMarket } from "./briefly";
import { createServerSupabaseClient } from "./supabase-server";

export type HomepageData = {
  sources: BrieflySource[];
  importedArticles: ImportedArticle[];
  ingestionLogs: IngestionLog[];
  source: "supabase" | "seed";
};

export type ImportedArticle = {
  id: string;
  market: MarketCode;
  sourceId: string;
  sourceName: string;
  title: string;
  originalUrl: string;
  publicationDate: string | null;
  excerpt: string | null;
  category: string | null;
  importedAt: string;
};

export type IngestionLog = {
  id: string;
  market: MarketCode;
  sourceId: string | null;
  sourceName: string;
  status: string;
  recordsFound: number;
  recordsImported: number;
  error: string | null;
  createdAt: string;
};

type SupabaseSourceRow = {
  id: string;
  market_code: string;
  name: string;
  website_url: string;
  feed_or_page_url: string | null;
  source_type: string;
  language: string;
  category: string;
  official: boolean;
  active: boolean;
  verification_status: string;
};

type SupabaseArticleRow = {
  id: string;
  market_code: string;
  source_id: string;
  title: string;
  original_url: string;
  publication_date: string | null;
  excerpt: string | null;
  category: string | null;
  imported_at: string;
};

type SupabaseIngestionLogRow = {
  id: string;
  market_code: string;
  source_id: string | null;
  status: string;
  records_found: number;
  records_imported: number;
  error: string | null;
  created_at: string;
};

function isMarketCode(value: string): value is MarketCode {
  return value === "BG" || value === "RS";
}

export async function getHomepageData(): Promise<HomepageData> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      sources: [...getSourcesForMarket("BG"), ...getSourcesForMarket("RS")],
      importedArticles: [],
      ingestionLogs: [],
      source: "seed",
    };
  }

  const { data, error } = await supabase
    .from("sources")
    .select(
      "id,market_code,name,website_url,feed_or_page_url,source_type,language,category,official,active,verification_status",
    )
    .order("market_code", { ascending: true })
    .order("official", { ascending: false })
    .order("name", { ascending: true });

  if (error || !data?.length) {
    return {
      sources: [...getSourcesForMarket("BG"), ...getSourcesForMarket("RS")],
      importedArticles: [],
      ingestionLogs: [],
      source: "seed",
    };
  }

  const rows = data as SupabaseSourceRow[];
  const sourceNames = new Map(rows.map((source) => [source.id, source.name]));

  const [{ data: articleData }, { data: logData }] = await Promise.all([
    supabase
      .from("raw_articles")
      .select(
        "id,market_code,source_id,title,original_url,publication_date,excerpt,category,imported_at",
      )
      .order("imported_at", { ascending: false })
      .limit(40),
    supabase
      .from("ingestion_logs")
      .select(
        "id,market_code,source_id,status,records_found,records_imported,error,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    sources: rows.flatMap((source) => {
      if (!isMarketCode(source.market_code)) return [];

      return {
        market: source.market_code,
        name: source.name,
        websiteUrl: source.website_url,
        feedUrl: source.feed_or_page_url,
        type: source.source_type,
        language: source.language,
        category: source.category,
        active: source.active,
        official: source.official,
        verificationStatus: source.verification_status,
      };
    }),
    importedArticles: ((articleData ?? []) as SupabaseArticleRow[]).flatMap(
      (article) => {
        if (!isMarketCode(article.market_code)) return [];

        return {
          id: article.id,
          market: article.market_code,
          sourceId: article.source_id,
          sourceName: sourceNames.get(article.source_id) ?? "Unknown source",
          title: article.title,
          originalUrl: article.original_url,
          publicationDate: article.publication_date,
          excerpt: article.excerpt,
          category: article.category,
          importedAt: article.imported_at,
        };
      },
    ),
    ingestionLogs: ((logData ?? []) as SupabaseIngestionLogRow[]).flatMap((log) => {
      if (!isMarketCode(log.market_code)) return [];

      return {
        id: log.id,
        market: log.market_code,
        sourceId: log.source_id,
        sourceName: log.source_id
          ? sourceNames.get(log.source_id) ?? "Unknown source"
          : "System",
        status: log.status,
        recordsFound: log.records_found,
        recordsImported: log.records_imported,
        error: log.error,
        createdAt: log.created_at,
      };
    }),
    source: "supabase",
  };
}
