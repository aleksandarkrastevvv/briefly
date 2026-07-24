import { brieflySeed } from "./seed-data";

export type MarketCode = (typeof brieflySeed.markets)[number]["code"];
export type BrieflyMarket = (typeof brieflySeed.markets)[number];
export type BrieflyStory =
  (typeof brieflySeed.dailyBriefs)[MarketCode]["stories"][number];
export type BrieflySource = {
  market: MarketCode;
  name: string;
  websiteUrl: string;
  feedUrl: string | null;
  type: string;
  language: string;
  category: string;
  active: boolean;
  official?: boolean;
  verificationStatus: string;
};
export type UiCopy = (typeof brieflySeed.ui)[MarketCode];

export const markets = brieflySeed.markets;
export const sourceRecords: readonly BrieflySource[] = brieflySeed.sources;
export const architectureNotes = brieflySeed.architecture;
export const setupDecisions = brieflySeed.decisions;
export const schemaTables = brieflySeed.schemaTables;

export function getMarket(code: MarketCode): BrieflyMarket {
  return markets.find((market) => market.code === code) ?? markets[0];
}

export function getUiCopy(code: MarketCode): UiCopy {
  return brieflySeed.ui[code];
}

export function getDailyBrief(code: MarketCode) {
  return brieflySeed.dailyBriefs[code];
}

export function getStories(code: MarketCode): readonly BrieflyStory[] {
  return getDailyBrief(code).stories;
}

export function getSourcesForMarket(code: MarketCode): readonly BrieflySource[] {
  return sourceRecords.filter((source) => source.market === code);
}
