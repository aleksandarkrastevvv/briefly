import { NextResponse } from "next/server";
import {
  dedupeFeedItems,
  normalizeFeedItem,
  parseFeedItems,
  planRssIngestion,
  toRawArticleInsert,
} from "@/lib/ingestion/rss";
import { createAdminSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const maxItemsPerSource = 30;
const fetchTimeoutMs = 10_000;

export async function POST(request: Request) {
  const expectedToken = process.env.INGESTION_API_TOKEN;

  if (!expectedToken) {
    return NextResponse.json(
      { error: "Ingestion endpoint is not configured." },
      { status: 503 },
    );
  }

  if (readBearerToken(request) !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }

  const { data: sources, error: sourceError } = await supabase
    .from("sources")
    .select("*")
    .eq("active", true);

  if (sourceError) {
    return NextResponse.json(
      { error: "Could not load sources.", detail: sourceError.message },
      { status: 500 },
    );
  }

  const runs = planRssIngestion(sources ?? []);
  const results = [];

  for (const run of runs) {
    const checkedAt = new Date().toISOString();

    try {
      const xml = await fetchWithTimeout(run.feedUrl);
      const parsedItems = dedupeFeedItems(
        parseFeedItems(xml).map((item) =>
          normalizeFeedItem(item, run.sourceCategory),
        ),
      )
        .filter((item) => item.title && item.originalUrl)
        .slice(0, maxItemsPerSource);

      const inserts = parsedItems.map((item) =>
        toRawArticleInsert(
          {
            id: run.sourceId,
            market_code: run.marketCode,
            category: run.sourceCategory,
          },
          item,
        ),
      );

      if (inserts.length > 0) {
        const { error: upsertError } = await writeTo(supabase, "raw_articles").upsert(
          inserts,
          { onConflict: "source_id,original_url" },
        );

        if (upsertError) throw upsertError;
      }

      await writeTo(supabase, "ingestion_logs").insert({
        market_code: run.marketCode,
        source_id: run.sourceId,
        status: "success",
        records_found: parsedItems.length,
        records_imported: inserts.length,
      });

      await writeTo(supabase, "sources")
        .update({
          last_checked_at: checkedAt,
          last_successful_import_at: checkedAt,
          last_error: null,
        })
        .eq("id", run.sourceId);

      results.push({
        source: run.sourceName,
        status: "success",
        recordsFound: parsedItems.length,
        recordsImported: inserts.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await writeTo(supabase, "ingestion_logs").insert({
        market_code: run.marketCode,
        source_id: run.sourceId,
        status: "error",
        records_found: 0,
        records_imported: 0,
        error: message,
      });

      await writeTo(supabase, "sources")
        .update({
          last_checked_at: checkedAt,
          last_error: message,
        })
        .eq("id", run.sourceId);

      results.push({
        source: run.sourceName,
        status: "error",
        error: message,
      });
    }
  }

  return NextResponse.json({
    plannedSources: runs.length,
    results,
  });
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  return scheme.toLowerCase() === "bearer" ? token : null;
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "user-agent": "Briefly ingestion/0.1",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function writeTo(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  table: "raw_articles" | "ingestion_logs" | "sources",
) {
  if (!supabase) {
    throw new Error("Supabase admin client is not configured.");
  }

  return supabase.from(table) as any;
}
