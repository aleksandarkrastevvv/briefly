import { ImageResponse } from "next/og";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const runtime = "edge";

type StoryRow = {
  id: string;
  category: string;
  canonical_headline: string;
  summary: string;
  key_points: unknown;
  story_sources?: Array<{
    raw_articles?: {
      sources?: {
        name: string;
      } | null;
    } | null;
  }>;
};

export async function GET(request: Request) {
  const storyId = new URL(request.url).searchParams.get("storyId");

  if (!storyId) {
    return new Response("Missing storyId.", { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return new Response("Supabase is not configured.", { status: 503 });
  }

  const { data, error } = await supabase
    .from("story_clusters")
    .select(
      "id,category,canonical_headline,summary,key_points,story_sources(raw_articles(sources(name)))",
    )
    .eq("id", storyId)
    .single();

  if (error || !data) {
    return new Response("Story not found.", { status: 404 });
  }

  const story = data as StoryRow;
  const keyPoints = readKeyPoints(story.key_points);
  const sourceNames = Array.from(
    new Set(
      (story.story_sources ?? [])
        .map((source) => source.raw_articles?.sources?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1920px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f3ea",
          color: "#151515",
          padding: "86px 72px",
          fontFamily: "Georgia",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "52px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#6f6a60",
              fontSize: 34,
              letterSpacing: 8,
              textTransform: "uppercase",
            }}
          >
            <span>{story.category}</span>
            <span>Briefly</span>
          </div>

          <div
            style={{
              display: "flex",
              minHeight: "540px",
              border: "3px solid #ded6c6",
              borderRadius: 34,
              background:
                "linear-gradient(145deg, #f9f7f0 0%, #dce9e4 45%, #0d7168 100%)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -160,
                top: 120,
                width: 920,
                height: 920,
                border: "34px solid rgba(194, 55, 11, 0.62)",
                borderRadius: 999,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: -220,
                top: -130,
                width: 760,
                height: 760,
                border: "34px solid rgba(15, 101, 93, 0.5)",
                borderRadius: 999,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 58,
                bottom: 56,
                color: "rgba(255,255,255,0.94)",
                fontSize: 42,
                fontWeight: 700,
              }}
            >
              {sourceNames.length} източника
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "34px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: 86,
                lineHeight: 0.94,
                letterSpacing: -2,
              }}
            >
              {story.canonical_headline}
            </h1>
            <p
              style={{
                margin: 0,
                color: "#3d3931",
                fontSize: 38,
                lineHeight: 1.28,
              }}
            >
              {story.summary}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            {keyPoints.map((point, index) => (
              <div
                key={point}
                style={{
                  display: "flex",
                  gap: "22px",
                  color: "#2d2923",
                  fontSize: 31,
                  lineHeight: 1.24,
                }}
              >
                <span style={{ color: "#8a8376" }}>{index + 1}.</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#6f6a60",
            fontSize: 28,
          }}
        >
          <span>everything-important-briefly.today</span>
          <span>{sourceNames.slice(0, 3).join(" · ")}</span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
    },
  );
}

function readKeyPoints(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((point): point is string => typeof point === "string")
    .map((point) => point.trim())
    .filter(Boolean)
    .slice(0, 3);
}
