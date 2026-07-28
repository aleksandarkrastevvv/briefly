import { NextResponse } from "next/server";
import {
  buildStoryGenerationUserPrompt,
  getStoryGenerationSystemPrompt,
  parseStoryGenerationOutput,
  selectStoryGenerationCandidates,
  storyGenerationOutputSchema,
  type GeneratedStoryDraft,
  type StoryGenerationArticle,
} from "@/lib/ai/story-generation";
import type { MarketCode } from "@/lib/briefly";
import { createAdminSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const defaultMarketCode: MarketCode = "BG";
const defaultModel = "gpt-5-mini";

type RawArticleRow = {
  id: string;
  market_code: string;
  source_id: string;
  title: string;
  original_url: string;
  publication_date: string | null;
  imported_at: string | null;
  excerpt: string | null;
  category: string | null;
  sources: { name: string; website_url: string } | null;
};

export async function POST(request: Request) {
  const expectedToken = process.env.INGESTION_API_TOKEN;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!expectedToken) {
    return NextResponse.json(
      { error: "AI story endpoint is not configured." },
      { status: 503 },
    );
  }

  if (readBearerToken(request) !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!openAiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured." },
      { status: 503 },
    );
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const marketCode = readMarketCode(body.marketCode);

  const { data: articleData, error: articleError } = await supabase
    .from("raw_articles")
    .select(
      "id,market_code,source_id,title,original_url,publication_date,imported_at,excerpt,category,sources(name,website_url)",
    )
    .eq("market_code", marketCode)
    .order("publication_date", { ascending: false, nullsFirst: false })
    .order("imported_at", { ascending: false })
    .limit(100);

  if (articleError) {
    return NextResponse.json(
      { error: "Could not load raw articles.", detail: articleError.message },
      { status: 500 },
    );
  }

  const candidateArticles = selectStoryGenerationCandidates(
    ((articleData ?? []) as RawArticleRow[]).map(toStoryGenerationArticle),
  );

  if (candidateArticles.length === 0) {
    return NextResponse.json({
      marketCode,
      candidateCount: 0,
      generatedCount: 0,
      stories: [],
    });
  }

  const model = process.env.STORY_GENERATION_MODEL ?? defaultModel;
  const generatedAt = new Date().toISOString();
  let output;
  try {
    output = await generateStoriesWithOpenAI({
      apiKey: openAiKey,
      model,
      marketCode,
      generatedAt,
      articles: candidateArticles,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not generate story drafts.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }

  const savedStories = [];
  for (const story of output.stories) {
    const sourceArticleIds = story.sourceArticleIds.filter((id) =>
      candidateArticles.some((article) => article.id === id),
    );
    if (sourceArticleIds.length < 2) continue;

    const sourceArticles = candidateArticles.filter((article) =>
      sourceArticleIds.includes(article.id),
    );
    const { data: cluster, error: clusterError } = await writeTo(
      supabase,
      "story_clusters",
    )
      .insert(toStoryClusterInsert(marketCode, story, sourceArticles))
      .select("id")
      .single();

    if (clusterError) {
      return NextResponse.json(
        { error: "Could not save generated story draft.", detail: clusterError.message },
        { status: 500 },
      );
    }

    const storyClusterId = (cluster as { id: string }).id;
    const { error: sourceError } = await writeTo(supabase, "story_sources").insert(
      sourceArticleIds.map((rawArticleId) => ({
        story_cluster_id: storyClusterId,
        raw_article_id: rawArticleId,
      })),
    );

    if (sourceError) {
      return NextResponse.json(
        { error: "Could not link generated story sources.", detail: sourceError.message },
        { status: 500 },
      );
    }

    savedStories.push({
      id: storyClusterId,
      headline: story.canonicalHeadline,
      sourceCount: sourceArticleIds.length,
      confidenceStatus: story.confidenceStatus,
    });
  }

  savedStories.sort((left, right) => right.sourceCount - left.sourceCount);

  return NextResponse.json({
    marketCode,
    model,
    candidateCount: candidateArticles.length,
    generatedCount: savedStories.length,
    stories: savedStories,
  });
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  return scheme.toLowerCase() === "bearer" ? token : null;
}

function readMarketCode(value: unknown): MarketCode {
  return value === "RS" ? "RS" : defaultMarketCode;
}

function toStoryGenerationArticle(article: RawArticleRow): StoryGenerationArticle {
  return {
    id: article.id,
    marketCode: readMarketCode(article.market_code),
    sourceName: article.sources?.name ?? "Unknown source",
    sourceUrl: article.original_url || article.sources?.website_url || "",
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    publicationDate: article.publication_date,
    importedAt: article.imported_at,
  };
}

async function generateStoriesWithOpenAI({
  apiKey,
  model,
  marketCode,
  generatedAt,
  articles,
}: {
  apiKey: string;
  model: string;
  marketCode: MarketCode;
  generatedAt: string;
  articles: StoryGenerationArticle[];
}) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: getStoryGenerationSystemPrompt(),
        },
        {
          role: "user",
          content: buildStoryGenerationUserPrompt({
            marketCode,
            language: marketCode === "BG" ? "Bulgarian" : "Serbian",
            generatedAt,
            articles,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "briefly_story_generation",
          strict: true,
          schema: storyGenerationOutputSchema,
        },
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readOpenAiError(payload));
  }

  const text = readResponseText(payload);
  return parseStoryGenerationOutput(JSON.parse(text));
}

function readOpenAiError(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return "OpenAI story generation request failed.";
}

function readResponseText(payload: any) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const content = payload.output?.flatMap((item: any) => item.content ?? []) ?? [];
  const text = content.find((item: any) => item.type === "output_text" && item.text);
  if (typeof text?.text === "string") {
    return text.text;
  }

  throw new Error("OpenAI response did not include text output.");
}

function toStoryClusterInsert(
  marketCode: MarketCode,
  story: GeneratedStoryDraft,
  sourceArticles: StoryGenerationArticle[],
) {
  const publicationDates = sourceArticles
    .map((article) => article.publicationDate)
    .filter((date): date is string => Boolean(date))
    .sort();

  return {
    market_code: marketCode,
    canonical_headline: story.canonicalHeadline,
    summary: story.summary,
    key_points: story.keyPoints,
    why_it_matters: story.whyItMatters,
    what_happens_next: story.whatHappensNext,
    affected_audiences: story.affectedAudiences,
    category: story.category,
    confidence_status: story.confidenceStatus,
    editorial_status: "draft",
    earliest_publication_at: publicationDates[0] ?? null,
    latest_update_at: publicationDates[publicationDates.length - 1] ?? null,
  };
}

function writeTo(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  table: "story_clusters" | "story_sources",
) {
  if (!supabase) {
    throw new Error("Supabase admin client is not configured.");
  }

  return supabase.from(table) as any;
}
