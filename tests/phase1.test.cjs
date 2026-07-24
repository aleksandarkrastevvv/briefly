const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const dataSource = fs.readFileSync(path.join(root, "src/lib/seed-data.ts"), "utf8");
const pageSource = fs.readFileSync(path.join(root, "src/app/page.tsx"), "utf8");
const appSource = fs.readFileSync(path.join(root, "src/app/briefly-app.tsx"), "utf8");
const supabaseDataSource = fs.readFileSync(path.join(root, "src/lib/supabase-data.ts"), "utf8");
const supabaseSource = fs.readFileSync(path.join(root, "src/lib/supabase.ts"), "utf8");
const supabaseServerSource = fs.readFileSync(path.join(root, "src/lib/supabase-server.ts"), "utf8");
const rssIngestionSource = fs.readFileSync(path.join(root, "src/lib/ingestion/rss.ts"), "utf8");
const storyGenerationSource = fs.readFileSync(path.join(root, "src/lib/ai/story-generation.ts"), "utf8");
const rssIngestionRoute = fs.readFileSync(path.join(root, "src/app/api/ingestion/rss/route.ts"), "utf8");
const storyGenerationRoute = fs.readFileSync(path.join(root, "src/app/api/ai/stories/route.ts"), "utf8");
const ingestionDoc = fs.readFileSync(path.join(root, "docs/engineering/ingestion.md"), "utf8");
const aiPipelineDoc = fs.readFileSync(path.join(root, "docs/ai/ai-pipeline.md"), "utf8");
const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");
const seedSql = fs.readFileSync(path.join(root, "database/002_seed_markets_sources.sql"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const vercelConfig = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
const sql = fs.readFileSync(path.join(root, "database/001_foundation.sql"), "utf8");

const sandbox = {};
const executableDataSource = dataSource
  .replace("export const brieflySeed =", "brieflySeed =")
  .replace(/\s+as const;\s*$/, ";");
vm.runInNewContext(executableDataSource, sandbox);

const data = sandbox.brieflySeed;

assert.equal(data.markets.length, 2, "Phase 1 should ship BG and RS markets");
assert.equal(
  data.markets.map((market) => market.code).join(","),
  "BG,RS",
  "Markets should stay configuration-driven"
);

for (const market of data.markets) {
  const brief = data.dailyBriefs[market.code];
  assert.ok(brief, `Missing daily brief for ${market.code}`);
  assert.ok(
    brief.stories.length >= 5 && brief.stories.length <= 8,
    `${market.code} should have 5-8 stories`
  );

  for (const story of brief.stories) {
    assert.equal(story.keyPoints.length, 3, `${story.id} should have 3 key points`);
    assert.ok(
      story.description.split(/\s+/).length <= 60,
      `${story.id} description should be 60 words or fewer`
    );
    assert.ok(story.image && story.image.endsWith(".png"), `${story.id} needs a bitmap image`);
    assert.ok(story.sources.length > 0, `${story.id} should preserve source names`);
    assert.equal(story.sample, true, `${story.id} should be clearly marked as seed data`);
  }
}

for (const source of data.sources) {
  assert.ok(source.market, `${source.name} needs a market`);
  assert.ok(source.name, "Source needs a name");
  assert.equal(
    source.active && !source.feedUrl,
    false,
    `${source.name} cannot be active without a verified feed URL`
  );
  assert.notEqual(source.verificationStatus, "verified", `${source.name} is not verified yet`);
  if (source.active) {
    assert.equal(
      source.verificationStatus,
      "verified_feed",
      `${source.name} must be a verified direct feed before activation`
    );
    assert.ok(
      ["BTA", "BNT", "BBC World"].includes(source.name),
      `${source.name} should not be in the first active source set`
    );
  }
}

const activeBulgarianSources = data.sources
  .filter((source) => source.market === "BG" && source.active)
  .map((source) => source.name)
  .sort();
assert.equal(
  activeBulgarianSources.join(","),
  "BBC World,BNT,BTA",
  "Only the first verified Bulgarian RSS feeds should be active"
);

[
  "next",
  "react",
  "react-dom",
  "@supabase/supabase-js",
].forEach((id) => {
  assert.ok(packageJson.dependencies[id], `Missing dependency: ${id}`);
});

[
  "function StoryCard",
  "function StudioOutput",
  "filteredSourceRows.map",
  "sourceStats",
  "runIngestion",
  "ingestionToken",
  "Run RSS ingestion",
  "type=\"password\"",
  "/api/ingestion/rss",
  "Authorization",
  "source-filter",
  "source-dashboard",
  "importedRows",
  "Imported articles",
  "article-list",
  "ingestionLogRows",
  "operator-panel",
  "profileOptions.map",
  "navigator.share",
].forEach((needle) => {
  assert.ok(appSource.includes(needle), `Missing Next.js app marker: ${needle}`);
});

[
  "getHomepageData",
  "force-dynamic",
  "<BrieflyApp homepageData={homepageData} />",
].forEach((needle) => {
  assert.ok(pageSource.includes(needle), `Homepage missing Supabase wrapper marker: ${needle}`);
});

[
  ".from(\"sources\")",
  ".from(\"raw_articles\")",
  ".from(\"ingestion_logs\")",
  "importedArticles",
  "ingestionLogs",
  "verification_status",
  "source: \"supabase\"",
  "source: \"seed\"",
].forEach((needle) => {
  assert.ok(supabaseDataSource.includes(needle), `Supabase data loader missing: ${needle}`);
});

[
  "planRssIngestion",
  "parseFeedItems",
  "normalizeFeedItem",
  "dedupeFeedItems",
  "normalizeUrl",
  "trackingParams",
  "toRawArticleInsert",
  "verification_status !== \"verified_feed\"",
].forEach((needle) => {
  assert.ok(rssIngestionSource.includes(needle), `RSS ingestion skeleton missing: ${needle}`);
});

[
  "INGESTION_API_TOKEN",
  "createAdminSupabaseClient",
  "normalizeFeedItem(item, run.sourceCategory)",
  "dedupeFeedItems",
  "writeTo(supabase, \"raw_articles\")",
  "writeTo(supabase, \"ingestion_logs\")",
  "readBearerToken",
].forEach((needle) => {
  assert.ok(rssIngestionRoute.includes(needle), `RSS ingestion route missing: ${needle}`);
});

[
  "StoryGenerationInput",
  "GeneratedStoryDraft",
  "StoryGenerationOutput",
  "storyGenerationOutputSchema",
  "getStoryGenerationSystemPrompt",
  "buildStoryGenerationUserPrompt",
  "selectStoryGenerationCandidates",
  "parseStoryGenerationOutput",
  "insufficient_support",
  "sourceArticleIds",
].forEach((needle) => {
  assert.ok(storyGenerationSource.includes(needle), `Story generation contract missing: ${needle}`);
});

[
  "OPENAI_API_KEY",
  "STORY_GENERATION_MODEL",
  "https://api.openai.com/v1/responses",
  "storyGenerationOutputSchema",
  "parseStoryGenerationOutput",
  "\"story_clusters\"",
  "writeTo(supabase, \"story_sources\")",
  "editorial_status: \"draft\"",
  "readBearerToken",
].forEach((needle) => {
  assert.ok(storyGenerationRoute.includes(needle), `Story generation route missing: ${needle}`);
});

[
  "RSS Ingestion Skeleton",
  "Article Normalization",
  "removing common tracking parameters",
  "active = true",
  "Operator Control",
  "POST /api/ingestion/rss",
  "Writes one `ingestion_logs` row",
  "not saved",
].forEach((needle) => {
  assert.ok(ingestionDoc.includes(needle), `Ingestion plan missing: ${needle}`);
});

[
  "Story Generation Flow",
  "storyGenerationOutputSchema",
  "editorial_status = draft",
  "POST /api/ai/stories",
  "Generated stories are never published directly",
  "OPENAI_API_KEY",
].forEach((needle) => {
  assert.ok(aiPipelineDoc.includes(needle), `AI pipeline plan missing: ${needle}`);
});

assert.ok(envExample.includes("INGESTION_API_TOKEN"), "Env example needs ingestion token");
assert.ok(envExample.includes("OPENAI_API_KEY"), "Env example needs OpenAI key");
assert.ok(envExample.includes("STORY_GENERATION_MODEL"), "Env example needs story model override");

[
  "create table if not exists markets",
  "create table if not exists sources",
  "create table if not exists raw_articles",
  "create table if not exists story_clusters",
  "create table if not exists story_sources",
  "create table if not exists daily_briefs",
  "create table if not exists ingestion_logs",
  "create table if not exists generated_social_content",
  "alter table saved_stories enable row level security",
].forEach((needle) => {
  assert.ok(sql.includes(needle), `Migration missing: ${needle}`);
});

[
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "createClient<Database>",
].forEach((needle) => {
  assert.ok(supabaseSource.includes(needle), `Supabase browser client missing: ${needle}`);
});

[
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "persistSession: false",
].forEach((needle) => {
  assert.ok(supabaseServerSource.includes(needle), `Supabase server client missing: ${needle}`);
});

[
  "insert into markets",
  "('BG', 'bg-BG'",
  "('RS', 'sr-RS'",
  "https://www.bta.bg/bg/rss/free",
  "https://news.bnt.bg/bg/rss/news.xml",
  "('BG', 'BTA', 'https://www.bta.bg', 'https://www.bta.bg/bg/rss/free', 'rss', 'Bulgarian', 'general', false, true, 'verified_feed')",
  "('BG', 'BNT', 'https://bntnews.bg', 'https://news.bnt.bg/bg/rss/news.xml', 'rss', 'Bulgarian', 'public_media', false, true, 'verified_feed')",
  "('BG', 'BBC World', 'https://www.bbc.com/news/world', 'https://www.bbc.com/news/world/rss.xml', 'rss', 'English', 'world', false, true, 'verified_feed')",
  "verified_feed",
  "candidate_feed_blocked_403",
  "requires_verification",
].forEach((needle) => {
  assert.ok(seedSql.includes(needle), `Seed SQL missing: ${needle}`);
});

assert.equal(vercelConfig.framework, "nextjs", "Vercel should use Next.js");
assert.equal(vercelConfig.installCommand, "pnpm install", "Vercel install command should use pnpm");
assert.equal(vercelConfig.buildCommand, "pnpm build", "Vercel build command should use pnpm");

console.log("Phase 1 validation passed");
