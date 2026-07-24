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
}

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
  "source-filter",
  "source-dashboard",
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
  "verification_status",
  "source: \"supabase\"",
  "source: \"seed\"",
].forEach((needle) => {
  assert.ok(supabaseDataSource.includes(needle), `Supabase data loader missing: ${needle}`);
});

[
  "create table if not exists markets",
  "create table if not exists sources",
  "create table if not exists raw_articles",
  "create table if not exists story_clusters",
  "create table if not exists daily_briefs",
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
  "requires_verification",
].forEach((needle) => {
  assert.ok(seedSql.includes(needle), `Seed SQL missing: ${needle}`);
});

assert.equal(vercelConfig.framework, "nextjs", "Vercel should use Next.js");
assert.equal(vercelConfig.installCommand, "pnpm install", "Vercel install command should use pnpm");
assert.equal(vercelConfig.buildCommand, "pnpm build", "Vercel build command should use pnpm");

console.log("Phase 1 validation passed");
