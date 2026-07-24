import type { MarketCode } from "@/lib/briefly";

export type StoryGenerationArticle = {
  id: string;
  marketCode: MarketCode;
  sourceName: string;
  sourceUrl: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  publicationDate: string | null;
};

export type StoryGenerationInput = {
  marketCode: MarketCode;
  language: string;
  generatedAt: string;
  articles: StoryGenerationArticle[];
};

export type GeneratedStoryDraft = {
  canonicalHeadline: string;
  summary: string;
  keyPoints: [string, string, string];
  whyItMatters: string;
  whatHappensNext: string | null;
  affectedAudiences: string[];
  category: string;
  confidenceStatus: "needs_review" | "insufficient_support";
  sourceArticleIds: string[];
};

export const storyGenerationOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["stories"],
  properties: {
    stories: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "canonicalHeadline",
          "summary",
          "keyPoints",
          "whyItMatters",
          "whatHappensNext",
          "affectedAudiences",
          "category",
          "confidenceStatus",
          "sourceArticleIds",
        ],
        properties: {
          canonicalHeadline: { type: "string", minLength: 1 },
          summary: { type: "string", minLength: 1, maxLength: 520 },
          keyPoints: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: { type: "string", minLength: 1 },
          },
          whyItMatters: { type: "string", minLength: 1, maxLength: 520 },
          whatHappensNext: { type: ["string", "null"], maxLength: 360 },
          affectedAudiences: {
            type: "array",
            items: { type: "string", minLength: 1 },
          },
          category: { type: "string", minLength: 1 },
          confidenceStatus: {
            type: "string",
            enum: ["needs_review", "insufficient_support"],
          },
          sourceArticleIds: {
            type: "array",
            minItems: 1,
            items: { type: "string", minLength: 1 },
          },
        },
      },
    },
  },
} as const;

export function getStoryGenerationSystemPrompt() {
  return [
    "You generate Briefly story drafts from imported news articles.",
    "Use only the supplied articles. Do not add facts from memory.",
    "If support is weak or sources conflict, mark confidenceStatus as insufficient_support.",
    "Write concise neutral language for a general reader.",
    "Do not provide legal, tax, medical, or financial advice.",
    "Preserve sourceArticleIds for every story draft.",
  ].join("\n");
}

export function buildStoryGenerationUserPrompt(input: StoryGenerationInput) {
  const articles = input.articles.map((article, index) => ({
    index: index + 1,
    id: article.id,
    sourceName: article.sourceName,
    sourceUrl: article.sourceUrl,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    publicationDate: article.publicationDate,
  }));

  return JSON.stringify(
    {
      task: "Cluster related articles and draft up to 8 Briefly stories.",
      marketCode: input.marketCode,
      language: input.language,
      generatedAt: input.generatedAt,
      rules: [
        "Group multiple articles about the same event into one story.",
        "Use three key points exactly.",
        "Keep each summary short enough for a daily brief.",
        "Return no story if articles are too weak or unrelated.",
        "Every story must include at least one sourceArticleIds value.",
      ],
      articles,
    },
    null,
    2,
  );
}

export function selectStoryGenerationCandidates(
  articles: StoryGenerationArticle[],
  limit = 80,
) {
  return articles
    .filter((article) => article.title && article.sourceUrl)
    .sort((left, right) => {
      const leftTime = Date.parse(left.publicationDate ?? "");
      const rightTime = Date.parse(right.publicationDate ?? "");

      return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
    })
    .slice(0, limit);
}
