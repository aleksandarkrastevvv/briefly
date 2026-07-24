-- Briefly Phase 1 foundation schema for Supabase PostgreSQL.
-- This migration defines the target architecture; hosted services are not wired yet.

create extension if not exists pgcrypto;

create table if not exists markets (
  code text primary key,
  locale text not null,
  language text not null,
  default_script text,
  timezone text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists user_profiles (
  user_id uuid primary key,
  market_code text references markets(code),
  professional_situation text,
  family_situation text,
  financial_context text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists interests (
  id uuid primary key default gen_random_uuid(),
  market_code text references markets(code),
  name text not null,
  slug text not null,
  unique (market_code, slug)
);

create table if not exists user_interests (
  user_id uuid not null,
  interest_id uuid not null references interests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, interest_id)
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  market_code text not null references markets(code),
  name text not null,
  website_url text not null,
  feed_or_page_url text,
  source_type text not null check (source_type in ('rss', 'atom', 'xml', 'html', 'api', 'official')),
  language text not null,
  category text not null,
  official boolean not null default false,
  active boolean not null default false,
  parser_config jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  last_successful_import_at timestamptz,
  last_error text,
  verification_status text not null default 'requires_verification',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_code, name)
);

create table if not exists raw_articles (
  id uuid primary key default gen_random_uuid(),
  market_code text not null references markets(code),
  source_id uuid not null references sources(id),
  title text not null,
  original_url text not null,
  publication_date timestamptz,
  excerpt text,
  author text,
  category text,
  image_url text,
  guid text,
  imported_at timestamptz not null default now(),
  unique (source_id, original_url),
  unique (source_id, guid)
);

create table if not exists story_clusters (
  id uuid primary key default gen_random_uuid(),
  market_code text not null references markets(code),
  canonical_headline text not null,
  summary text not null,
  key_points jsonb not null,
  why_it_matters text not null,
  what_happens_next text,
  affected_audiences text[] not null default '{}',
  category text not null,
  confidence_status text not null default 'needs_review',
  editorial_status text not null default 'draft',
  earliest_publication_at timestamptz,
  latest_update_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists story_sources (
  story_cluster_id uuid not null references story_clusters(id) on delete cascade,
  raw_article_id uuid not null references raw_articles(id) on delete cascade,
  primary key (story_cluster_id, raw_article_id)
);

create table if not exists daily_briefs (
  id uuid primary key default gen_random_uuid(),
  market_code text not null references markets(code),
  brief_date date not null,
  status text not null default 'draft',
  estimated_minutes integer not null default 5,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (market_code, brief_date)
);

create table if not exists daily_brief_stories (
  daily_brief_id uuid not null references daily_briefs(id) on delete cascade,
  story_cluster_id uuid not null references story_clusters(id),
  rank integer not null,
  editorial_reason text,
  primary key (daily_brief_id, story_cluster_id),
  unique (daily_brief_id, rank)
);

create table if not exists saved_stories (
  user_id uuid not null,
  story_cluster_id uuid not null references story_clusters(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, story_cluster_id)
);

create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  story_cluster_id uuid not null references story_clusters(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  source_article_ids uuid[] not null default '{}',
  helpful boolean,
  created_at timestamptz not null default now()
);

create table if not exists generated_social_content (
  id uuid primary key default gen_random_uuid(),
  market_code text not null references markets(code),
  story_cluster_id uuid references story_clusters(id) on delete cascade,
  daily_brief_id uuid references daily_briefs(id) on delete cascade,
  platform text not null,
  format text not null,
  payload jsonb not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists publishing_queue (
  id uuid primary key default gen_random_uuid(),
  generated_social_content_id uuid not null references generated_social_content(id) on delete cascade,
  platform text not null,
  status text not null default 'queued',
  scheduled_for timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists ingestion_logs (
  id uuid primary key default gen_random_uuid(),
  market_code text not null references markets(code),
  source_id uuid references sources(id),
  status text not null,
  records_found integer not null default 0,
  records_imported integer not null default 0,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists ranking_logs (
  id uuid primary key default gen_random_uuid(),
  market_code text not null references markets(code),
  daily_brief_id uuid references daily_briefs(id) on delete cascade,
  candidate_count integer not null,
  selected_count integer not null,
  model text,
  structured_request jsonb,
  structured_response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_sources_market_active on sources (market_code, active);
create index if not exists idx_raw_articles_market_date on raw_articles (market_code, publication_date desc);
create index if not exists idx_raw_articles_guid on raw_articles (guid);
create index if not exists idx_story_clusters_market_status on story_clusters (market_code, editorial_status, latest_update_at desc);
create index if not exists idx_daily_briefs_market_date on daily_briefs (market_code, brief_date desc);
create index if not exists idx_generated_social_market on generated_social_content (market_code, platform, status);
create index if not exists idx_ingestion_logs_source_created on ingestion_logs (source_id, created_at desc);

alter table user_profiles enable row level security;
alter table user_interests enable row level security;
alter table saved_stories enable row level security;
alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;

-- Public read policies and editor/service policies should be added once auth
-- roles are confirmed. No permissive write policy is added in Phase 1.
