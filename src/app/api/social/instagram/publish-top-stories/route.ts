import { NextResponse } from "next/server";
import type { Json } from "@/lib/database.types";
import { createAdminSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const defaultMarketCode = "BG";
const topStoryLimit = 5;
const freshnessWindowHours = 36;

type StoryRow = {
  id: string;
  market_code: string;
  category: string;
  canonical_headline: string;
  summary: string;
  key_points: unknown;
  latest_update_at: string | null;
  created_at: string;
  story_sources?: Array<{ raw_article_id: string }>;
};

type SocialContentRow = {
  id: string;
  story_cluster_id: string | null;
  status: string;
};

type PublishResult = {
  storyId: string;
  headline: string;
  status: "published" | "queued" | "skipped" | "failed";
  socialContentId?: string;
  instagramMediaId?: string;
  error?: string;
};

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "Instagram publishing is not configured." },
      { status: 503 },
    );
  }

  if (readBearerToken(request) !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const dryRun = body.dryRun === true;
  const origin = process.env.PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const cutoff = new Date(
    Date.now() - freshnessWindowHours * 60 * 60 * 1000,
  ).toISOString();

  const { data: storyData, error: storyError } = await supabase
    .from("story_clusters")
    .select(
      "id,market_code,category,canonical_headline,summary,key_points,latest_update_at,created_at,story_sources(raw_article_id)",
    )
    .eq("market_code", defaultMarketCode)
    .gte("latest_update_at", cutoff)
    .order("latest_update_at", { ascending: false, nullsFirst: false })
    .limit(40);

  if (storyError) {
    return NextResponse.json(
      { error: "Could not load story candidates.", detail: storyError.message },
      { status: 500 },
    );
  }

  const { data: existingData, error: existingError } = await supabase
    .from("generated_social_content")
    .select("id,story_cluster_id,status")
    .eq("platform", "instagram")
    .eq("format", "story")
    .in("status", ["queued", "published"]);

  if (existingError) {
    return NextResponse.json(
      { error: "Could not check existing Instagram publications.", detail: existingError.message },
      { status: 500 },
    );
  }

  const publishedStoryIds = new Set(
    ((existingData ?? []) as SocialContentRow[])
      .map((row) => row.story_cluster_id)
      .filter((id): id is string => Boolean(id)),
  );
  const selectedStories = ((storyData ?? []) as StoryRow[])
    .filter((story) => !publishedStoryIds.has(story.id))
    .sort((left, right) => {
      const sourceDelta = sourceCount(right) - sourceCount(left);
      if (sourceDelta !== 0) return sourceDelta;

      return storyTime(right) - storyTime(left);
    })
    .slice(0, topStoryLimit);

  const results: PublishResult[] = [];

  for (const [index, story] of selectedStories.entries()) {
    const imageUrl = `${origin}/api/social/instagram/story-image?storyId=${encodeURIComponent(story.id)}`;
    const payload = {
      storyId: story.id,
      position: index + 1,
      imageUrl,
      headline: story.canonical_headline,
      summary: story.summary,
      keyPoints: readKeyPoints(story.key_points),
      category: story.category,
      sourceCount: sourceCount(story),
      generatedAt: new Date().toISOString(),
    };

    const { data: socialContent, error: socialError } = await writeTo(
      supabase,
      "generated_social_content",
    )
      .insert({
        market_code: defaultMarketCode,
        story_cluster_id: story.id,
        platform: "instagram",
        format: "story",
        payload: payload as Json,
        status: dryRun ? "queued" : "draft",
      })
      .select("id")
      .single();

    if (socialError) {
      results.push({
        storyId: story.id,
        headline: story.canonical_headline,
        status: "failed",
        error: socialError.message,
      });
      continue;
    }

    const socialContentId = (socialContent as { id: string }).id;

    if (dryRun || !instagramPublishingConfigured()) {
      await writeTo(supabase, "publishing_queue").insert({
        generated_social_content_id: socialContentId,
        platform: "instagram",
        status: dryRun ? "queued" : "blocked",
        error: dryRun
          ? null
          : "Instagram environment variables are not configured.",
      });
      results.push({
        storyId: story.id,
        headline: story.canonical_headline,
        status: "queued",
        socialContentId,
      });
      continue;
    }

    const published = await publishInstagramStory(imageUrl);

    if (published.ok) {
      await writeTo(supabase, "generated_social_content")
        .update({ status: "published" })
        .eq("id", socialContentId);
      await writeTo(supabase, "publishing_queue").insert({
        generated_social_content_id: socialContentId,
        platform: "instagram",
        status: "published",
        error: null,
      });
      results.push({
        storyId: story.id,
        headline: story.canonical_headline,
        status: "published",
        socialContentId,
        instagramMediaId: published.mediaId,
      });
    } else {
      await writeTo(supabase, "generated_social_content")
        .update({ status: "failed" })
        .eq("id", socialContentId);
      await writeTo(supabase, "publishing_queue").insert({
        generated_social_content_id: socialContentId,
        platform: "instagram",
        status: "failed",
        error: published.error,
      });
      results.push({
        storyId: story.id,
        headline: story.canonical_headline,
        status: "failed",
        socialContentId,
        error: published.error,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    marketCode: defaultMarketCode,
    dryRun,
    selectedCount: selectedStories.length,
    results,
  });
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  return scheme.toLowerCase() === "bearer" ? token : null;
}

function sourceCount(story: StoryRow) {
  return story.story_sources?.length ?? 0;
}

function storyTime(story: StoryRow) {
  return Date.parse(story.latest_update_at ?? story.created_at) || 0;
}

function readKeyPoints(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((point): point is string => typeof point === "string")
    .map((point) => point.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function instagramPublishingConfigured() {
  return Boolean(
    process.env.INSTAGRAM_IG_USER_ID && process.env.INSTAGRAM_ACCESS_TOKEN,
  );
}

async function publishInstagramStory(imageUrl: string) {
  const graphVersion = process.env.META_GRAPH_VERSION ?? "v25.0";
  const igUserId = process.env.INSTAGRAM_IG_USER_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!igUserId || !accessToken) {
    return { ok: false as const, error: "Instagram credentials are missing." };
  }

  const container = await fetch(
    `https://graph.instagram.com/${graphVersion}/${igUserId}/media`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        media_type: "STORIES",
        image_url: imageUrl,
        access_token: accessToken,
      }),
    },
  );
  const containerPayload = await readMetaPayload(container);

  if (!container.ok || !isRecord(containerPayload) || typeof containerPayload.id !== "string") {
    return {
      ok: false as const,
      error: `Instagram container failed: ${JSON.stringify(containerPayload)}`,
    };
  }

  const publish = await fetch(
    `https://graph.instagram.com/${graphVersion}/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        creation_id: containerPayload.id,
        access_token: accessToken,
      }),
    },
  );
  const publishPayload = await readMetaPayload(publish);

  if (!publish.ok || !isRecord(publishPayload) || typeof publishPayload.id !== "string") {
    return {
      ok: false as const,
      error: `Instagram publish failed: ${JSON.stringify(publishPayload)}`,
    };
  }

  return { ok: true as const, mediaId: publishPayload.id };
}

async function readMetaPayload(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function writeTo(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  table: "generated_social_content" | "publishing_queue",
) {
  if (!supabase) {
    throw new Error("Supabase admin client is not configured.");
  }

  return supabase.from(table) as any;
}
