import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const defaultMarketCode = "BG";

type StepResult = {
  ok: boolean;
  status: number;
  payload: unknown;
};

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const ingestionToken = process.env.INGESTION_API_TOKEN;

  if (!cronSecret || !ingestionToken) {
    return NextResponse.json(
      { error: "Daily brief cron is not configured." },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const origin = readPublicOrigin(request);
  const ingestion = await callProtectedPost(
    `${origin}/api/ingestion/rss`,
    ingestionToken,
  );

  if (!ingestion.ok) {
    console.error("Daily ingestion failed.", {
      status: ingestion.status,
      payload: ingestion.payload,
    });

    return NextResponse.json(
      { error: "Daily ingestion failed.", ingestion },
      { status: 502 },
    );
  }

  const stories = await callProtectedPost(
    `${origin}/api/ai/stories`,
    ingestionToken,
    { marketCode: defaultMarketCode },
  );

  if (!stories.ok) {
    console.error("Daily story generation failed.", {
      status: stories.status,
      payload: stories.payload,
    });

    return NextResponse.json(
      { error: "Daily story generation failed.", ingestion, stories },
      { status: 502 },
    );
  }

  const instagram =
    process.env.INSTAGRAM_AUTO_PUBLISH === "true"
      ? await callProtectedPost(
          `${origin}/api/social/instagram/publish-top-stories`,
          cronSecret,
          { marketCode: defaultMarketCode },
        )
      : {
          ok: true,
          status: 200,
          payload: {
            skipped: true,
            reason: "Instagram auto-publishing is not enabled.",
          },
        };

  if (!instagram.ok) {
    console.error("Instagram publishing failed.", {
      status: instagram.status,
      payload: instagram.payload,
    });
  }

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    marketCode: defaultMarketCode,
    ingestion: ingestion.payload,
    stories: stories.payload,
    instagram: instagram.payload,
  });
}

function readPublicOrigin(request: Request) {
  const publicSiteUrl = process.env.PUBLIC_SITE_URL?.trim();

  return publicSiteUrl
    ? publicSiteUrl.replace(/\/$/, "")
    : new URL(request.url).origin;
}

async function callProtectedPost(
  url: string,
  token: string,
  body?: Record<string, unknown>,
): Promise<StepResult> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      ...automationBypassHeaders(),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const payload = await readPayload(response);

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

async function readPayload(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

function automationBypassHeaders(): Record<string, string> {
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

  return bypassSecret
    ? {
        "x-vercel-protection-bypass": bypassSecret,
      }
    : {};
}
