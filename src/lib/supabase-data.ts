import type { BrieflySource, MarketCode } from "./briefly";
import { getSourcesForMarket } from "./briefly";
import { createServerSupabaseClient } from "./supabase-server";

export type HomepageData = {
  sources: BrieflySource[];
  importedArticles: ImportedArticle[];
  ingestionLogs: IngestionLog[];
  generatedStories: GeneratedBrieflyStory[];
  source: "supabase" | "seed";
};

export type GeneratedBrieflyStory = {
  id: string;
  market: MarketCode;
  category: string;
  headline: string;
  description: string;
  keyPoints: [string, string, string];
  whyItMatters: string;
  next: string;
  meansForMe: Record<string, string>;
  sources: string[];
  sourceCount: number;
  updatedAt: string;
  image: string;
  visualImages: string[];
  sample: false;
  official?: boolean;
  confidenceStatus: string;
  editorialStatus: string;
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

type SupabaseStoryClusterRow = {
  id: string;
  market_code: string;
  canonical_headline: string;
  summary: string;
  key_points: unknown;
  why_it_matters: string;
  what_happens_next: string | null;
  affected_audiences: string[] | null;
  category: string;
  confidence_status: string;
  editorial_status: string;
  earliest_publication_at: string | null;
  latest_update_at: string | null;
  created_at: string;
  story_sources?: Array<{
    raw_articles?: {
      original_url: string;
      image_url: string | null;
      sources?: {
        name: string;
        official: boolean;
      } | null;
    } | null;
  }>;
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
      generatedStories: [],
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
      generatedStories: [],
      source: "seed",
    };
  }

  const rows = data as SupabaseSourceRow[];
  const sourceNames = new Map(rows.map((source) => [source.id, source.name]));

  const [{ data: articleData }, { data: logData }, { data: storyData }] = await Promise.all([
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
    supabase
      .from("story_clusters")
      .select(
        "id,market_code,canonical_headline,summary,key_points,why_it_matters,what_happens_next,affected_audiences,category,confidence_status,editorial_status,earliest_publication_at,latest_update_at,created_at,story_sources(raw_articles(original_url,image_url,sources(name,official)))",
      )
      .order("latest_update_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(24),
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
    generatedStories: ((storyData ?? []) as SupabaseStoryClusterRow[]).flatMap(
      (story) => {
        if (!isMarketCode(story.market_code)) return [];

        const keyPoints = readThreeKeyPoints(story.key_points);
        const sourceRows = story.story_sources ?? [];
        const sourceNames = Array.from(
          new Set(
            sourceRows
              .map((source) => source.raw_articles?.sources?.name)
              .filter((name): name is string => Boolean(name)),
          ),
        );
        const official = sourceRows.some(
          (source) => source.raw_articles?.sources?.official,
        );
        const visualImages = Array.from(
          new Set(
            sourceRows
              .map((source) => source.raw_articles?.image_url)
              .filter((url): url is string => Boolean(url)),
          ),
        ).slice(0, 4);
        const fallbackImage = imageForCategory(story.market_code, story.category);
        const affectedAudiences = Array.isArray(story.affected_audiences)
          ? story.affected_audiences
          : [];

        return {
          id: story.id,
          market: story.market_code,
          category: story.category,
          headline: story.canonical_headline,
          description: story.summary,
          keyPoints,
          whyItMatters: story.why_it_matters,
          next:
            story.what_happens_next ??
            (story.market_code === "RS"
              ? "Pratimo nove informacije iz povezanih izvora."
              : "Следим новите данни от свързаните източници."),
          meansForMe: {
            default:
              affectedAudiences.length > 0
                ? affectedAudiences.join(", ")
                : story.market_code === "RS"
                  ? "Ovo je generisana priča iz uvezenih izvora. Proveri povezane izvore za detalje."
                  : "Това е генерирана история от внесени източници. Провери свързаните източници за детайли.",
          },
          sources: sourceNames.length > 0 ? sourceNames : ["Imported sources"],
          sourceCount: Math.max(sourceRows.length, sourceNames.length, 1),
          updatedAt:
            story.latest_update_at ?? story.earliest_publication_at ?? story.created_at,
          image: visualImages[0] ?? fallbackImage,
          visualImages: visualImages.length > 0 ? visualImages : [],
          sample: false,
          official,
          confidenceStatus: story.confidence_status,
          editorialStatus: story.editorial_status,
        };
      },
    ),
    source: "supabase",
  };
}

function readThreeKeyPoints(value: unknown): [string, string, string] {
  if (Array.isArray(value)) {
    const points = value
      .filter((point): point is string => typeof point === "string")
      .map((point) => point.trim())
      .filter(Boolean);

    if (points.length >= 3) {
      return [points[0], points[1], points[2]];
    }
  }

  return [
    "Историята е генерирана от внесени статии.",
    "Източниците остават видими за проверка.",
    "Briefly показва само наличната подкрепена информация.",
  ];
}

function imageForCategory(marketCode: MarketCode, category: string) {
  void marketCode;
  void category;

  return "";
}
