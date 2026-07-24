import type { BrieflySource, MarketCode } from "./briefly";
import { getSourcesForMarket } from "./briefly";
import { createServerSupabaseClient } from "./supabase-server";

export type HomepageData = {
  sources: BrieflySource[];
  source: "supabase" | "seed";
};

type SupabaseSourceRow = {
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

function isMarketCode(value: string): value is MarketCode {
  return value === "BG" || value === "RS";
}

export async function getHomepageData(): Promise<HomepageData> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      sources: [...getSourcesForMarket("BG"), ...getSourcesForMarket("RS")],
      source: "seed",
    };
  }

  const { data, error } = await supabase
    .from("sources")
    .select(
      "market_code,name,website_url,feed_or_page_url,source_type,language,category,official,active,verification_status",
    )
    .order("market_code", { ascending: true })
    .order("official", { ascending: false })
    .order("name", { ascending: true });

  if (error || !data?.length) {
    return {
      sources: [...getSourcesForMarket("BG"), ...getSourcesForMarket("RS")],
      source: "seed",
    };
  }

  const rows = data as SupabaseSourceRow[];

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
    source: "supabase",
  };
}
