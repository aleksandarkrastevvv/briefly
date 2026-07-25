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

export type StoryGenerationOutput = {
  stories: GeneratedStoryDraft[];
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
            minItems: 2,
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
        "Every story must be supported by at least two source articles.",
        "Prioritize stories with the highest number of supporting sources.",
        "Use three key points exactly.",
        "Keep each summary short enough for a daily brief.",
        "Return no story if articles are too weak or unrelated.",
        "Every story must include at least two sourceArticleIds values.",
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

export function parseStoryGenerationOutput(value: unknown): StoryGenerationOutput {
  if (!isRecord(value) || !Array.isArray(value.stories)) {
    throw new Error("Story generation output must include a stories array.");
  }

  return {
    stories: value.stories.map((story, index) => parseGeneratedStoryDraft(story, index)),
  };
}

function parseGeneratedStoryDraft(value: unknown, index: number): GeneratedStoryDraft {
  if (!isRecord(value)) {
    throw new Error(`Story ${index + 1} must be an object.`);
  }

  const keyPoints = readStringArray(value.keyPoints, `Story ${index + 1} keyPoints`);
  if (keyPoints.length !== 3) {
    throw new Error(`Story ${index + 1} must include exactly three key points.`);
  }

  const confidenceStatus = readString(value.confidenceStatus, `Story ${index + 1} confidenceStatus`);
  if (confidenceStatus !== "needs_review" && confidenceStatus !== "insufficient_support") {
    throw new Error(`Story ${index + 1} has an unsupported confidence status.`);
  }

  const sourceArticleIds = readStringArray(
    value.sourceArticleIds,
    `Story ${index + 1} sourceArticleIds`,
  );
  if (sourceArticleIds.length < 1) {
    throw new Error(`Story ${index + 1} must preserve source article ids.`);
  }
  if (sourceArticleIds.length < 2) {
    throw new Error(`Story ${index + 1} must include at least two source article ids.`);
  }

  return {
    canonicalHeadline: readString(value.canonicalHeadline, `Story ${index + 1} headline`),
    summary: readString(value.summary, `Story ${index + 1} summary`),
    keyPoints: [keyPoints[0], keyPoints[1], keyPoints[2]],
    whyItMatters: readString(value.whyItMatters, `Story ${index + 1} whyItMatters`),
    whatHappensNext:
      value.whatHappensNext === null
        ? null
        : readString(value.whatHappensNext, `Story ${index + 1} whatHappensNext`),
    affectedAudiences: readStringArray(
      value.affectedAudiences,
      `Story ${index + 1} affectedAudiences`,
    ),
    category: readString(value.category, `Story ${index + 1} category`),
    confidenceStatus,
    sourceArticleIds,
  };
}

function readString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value.trim();
}

function readStringArray(value: unknown, label: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value.map((item, index) => readString(item, `${label}[${index}]`));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
