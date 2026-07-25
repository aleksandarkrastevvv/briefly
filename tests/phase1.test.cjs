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
const projectIndexDoc = fs.readFileSync(path.join(root, "docs/project-index.md"), "utf8");
const agentsReadme = fs.readFileSync(path.join(root, "agents/README.md"), "utf8");
const productAgentDoc = fs.readFileSync(path.join(root, "agents/product-agent.md"), "utf8");
const designAgentDoc = fs.readFileSync(path.join(root, "agents/design-agent.md"), "utf8");
const engineeringAgentDoc = fs.readFileSync(path.join(root, "agents/engineering-agent.md"), "utf8");
const testingAgentDoc = fs.readFileSync(path.join(root, "agents/testing-agent.md"), "utf8");
const editorialTrustAgentDoc = fs.readFileSync(path.join(root, "agents/editorial-trust-agent.md"), "utf8");
const agentOperatingModelDoc = fs.readFileSync(
  path.join(root, "docs/operations/codex-agent-operating-model.md"),
  "utf8"
);
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
    assert.ok(
      ["verified_feed", "configured_html_parser"].includes(source.verificationStatus),
      `${source.name} must have either a verified direct feed or configured HTML parser before activation`
    );
    assert.ok(
      [
        "BTA",
        "Capital",
        "Dnevnik",
        "BNT",
        "BBC World",
        "Actualno",
        "Mediapool",
        "Sega",
        "24 Chasa",
        "Svobodna Evropa",
        "Ministry of Foreign Affairs",
        "National Health Insurance Fund",
        "Varna Municipality",
        "Council of Ministers",
        "President of Bulgaria",
        "Ministry of Health",
        "Registry Agency",
        "Commission for Consumer Protection",
        "Financial Supervision Commission",
        "Commission on Protection of Competition",
        "Sofia Municipality",
        "Ruse Municipality",
        "Blagoevgrad Municipality",
        "Shumen Municipality",
      ].includes(source.name),
      `${source.name} should not be in the active ingestion source set`
    );
  }
}

const activeBulgarianSources = data.sources
  .filter((source) => source.market === "BG" && source.active)
  .map((source) => source.name)
  .sort();
assert.equal(
  activeBulgarianSources.join(","),
  "24 Chasa,Actualno,BBC World,BNT,BTA,Blagoevgrad Municipality,Capital,Commission for Consumer Protection,Commission on Protection of Competition,Council of Ministers,Dnevnik,Financial Supervision Commission,Mediapool,Ministry of Foreign Affairs,Ministry of Health,National Health Insurance Fund,President of Bulgaria,Registry Agency,Ruse Municipality,Sega,Shumen Municipality,Sofia Municipality,Svobodna Evropa,Varna Municipality",
  "Only verified Bulgarian RSS feeds and configured HTML parsers should be active"
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
  "generatedStories",
  "Generate daily stories",
  "/api/ai/stories",
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
  ".from(\"story_clusters\")",
  ".from(\"ingestion_logs\")",
  "importedArticles",
  "generatedStories",
  "story_sources(raw_articles",
  "ingestionLogs",
  "verification_status",
  "source: \"supabase\"",
  "source: \"seed\"",
].forEach((needle) => {
  assert.ok(supabaseDataSource.includes(needle), `Supabase data loader missing: ${needle}`);
});

[
  "planRssIngestion",
  "planContentIngestion",
  "parseHtmlItems",
  "parseFeedItems",
  "normalizeFeedItem",
  "dedupeFeedItems",
  "normalizeUrl",
  "trackingParams",
  "toRawArticleInsert",
  "verification_status !== \"verified_feed\"",
  "configured_html_parser",
].forEach((needle) => {
  assert.ok(rssIngestionSource.includes(needle), `RSS ingestion skeleton missing: ${needle}`);
});

[
  "INGESTION_API_TOKEN",
  "createAdminSupabaseClient",
  "parseHtmlItems(content, run.sourceUrl, run.parserConfig)",
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
  "Ingestion Skeleton",
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
  "Reader Display",
  "POST /api/ai/stories",
  "Generated stories can appear",
  "OPENAI_API_KEY",
].forEach((needle) => {
  assert.ok(aiPipelineDoc.includes(needle), `AI pipeline plan missing: ${needle}`);
});

[
  "Operating Model",
  "When To Use Each Agent",
  "Definition Of Done",
  "Human Override",
].forEach((needle) => {
  assert.ok(agentsReadme.includes(needle), `Agents README missing: ${needle}`);
});

[
  productAgentDoc,
  designAgentDoc,
  engineeringAgentDoc,
  testingAgentDoc,
  editorialTrustAgentDoc,
].forEach((agentDoc) => {
  assert.ok(agentDoc.includes("## Mission"), "Agent doc needs a mission");
  assert.ok(agentDoc.includes("## Use For"), "Agent doc needs use cases");
  assert.ok(agentDoc.includes("## Definition Of Done"), "Agent doc needs done criteria");
  assert.ok(agentDoc.includes("Goal:"), "Agent doc needs shared handoff format");
});

[
  "Product Agent",
  "Design Agent",
  "Engineering Agent",
  "Testing Agent",
  "Editorial And Trust Agent",
  "GitHub Issues",
  "Handoff Template",
  "Do not invent sources",
  "combine imported articles into Briefly-style",
].forEach((needle) => {
  assert.ok(agentOperatingModelDoc.includes(needle), `Agent operating model missing: ${needle}`);
});

[
  "agents/README.md",
  "docs/operations/codex-agent-operating-model.md",
].forEach((needle) => {
  assert.ok(projectIndexDoc.includes(needle), `Project index missing: ${needle}`);
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
  "('BG', 'Capital', 'https://www.capital.bg', 'https://www.capital.bg/rss/', 'rss', 'Bulgarian', 'business', false, true, 'verified_feed')",
  "('BG', 'Dnevnik', 'https://www.dnevnik.bg', 'https://www.dnevnik.bg/rss/', 'rss', 'Bulgarian', 'general', false, true, 'verified_feed')",
  "('BG', 'Actualno', 'https://www.actualno.com', 'https://www.actualno.com/rss', 'rss', 'Bulgarian', 'general', false, true, 'verified_feed')",
  "('BG', 'Ministry of Foreign Affairs', 'https://www.mfa.bg', 'https://www.mfa.bg/bg/rss', 'rss', 'Bulgarian', 'government', true, true, 'verified_feed')",
  "('BG', 'Plovdiv Municipality', 'https://www.plovdiv.bg', 'https://www.plovdiv.bg/feed/', 'rss', 'Bulgarian', 'local', true, false, 'candidate_feed_blocked_403_live')",
  "('BG', 'BNT', 'https://bntnews.bg', 'https://news.bnt.bg/bg/rss/news.xml', 'rss', 'Bulgarian', 'public_media', false, true, 'verified_feed')",
  "('BG', 'BBC World', 'https://www.bbc.com/news/world', 'https://www.bbc.com/news/world/rss.xml', 'rss', 'English', 'world', false, true, 'verified_feed')",
  "verified_feed",
  "requires_verification",
].forEach((needle) => {
  assert.ok(seedSql.includes(needle), `Seed SQL missing: ${needle}`);
});

assert.equal(vercelConfig.framework, "nextjs", "Vercel should use Next.js");
assert.equal(vercelConfig.installCommand, "pnpm install", "Vercel install command should use pnpm");
assert.equal(vercelConfig.buildCommand, "pnpm build", "Vercel build command should use pnpm");

console.log("Phase 1 validation passed");
