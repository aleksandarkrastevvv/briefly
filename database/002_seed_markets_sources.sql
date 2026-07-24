-- Seed configuration for Briefly markets and initial source records.
-- Feed URLs stay null and sources stay inactive until each source is verified.

insert into markets (code, locale, language, default_script, timezone, active)
values
  ('BG', 'bg-BG', 'Bulgarian', null, 'Europe/Sofia', true),
  ('RS', 'sr-RS', 'Serbian', 'Latin', 'Europe/Belgrade', true)
on conflict (code) do update set
  locale = excluded.locale,
  language = excluded.language,
  default_script = excluded.default_script,
  timezone = excluded.timezone,
  active = excluded.active;

insert into sources (
  market_code,
  name,
  website_url,
  feed_or_page_url,
  source_type,
  language,
  category,
  official,
  active,
  verification_status
)
values
  ('BG', 'BTA', 'https://www.bta.bg', null, 'rss', 'Bulgarian', 'general', false, false, 'requires_verification'),
  ('BG', 'Capital', 'https://www.capital.bg', null, 'rss', 'Bulgarian', 'business', false, false, 'requires_verification'),
  ('BG', 'Dnevnik', 'https://www.dnevnik.bg', null, 'rss', 'Bulgarian', 'general', false, false, 'requires_verification'),
  ('BG', 'BNT', 'https://bntnews.bg', null, 'rss', 'Bulgarian', 'public_media', false, false, 'requires_verification'),
  ('BG', 'BBC World', 'https://www.bbc.com/news/world', null, 'rss', 'English', 'world', false, false, 'requires_verification'),
  ('BG', 'National Assembly', 'https://www.parliament.bg', null, 'official', 'Bulgarian', 'government', true, false, 'requires_verification'),
  ('BG', 'Council of Ministers', 'https://www.gov.bg', null, 'official', 'Bulgarian', 'government', true, false, 'requires_verification'),
  ('BG', 'National Revenue Agency', 'https://nra.bg', null, 'official', 'Bulgarian', 'government', true, false, 'requires_verification'),
  ('BG', 'Bulgarian National Bank', 'https://www.bnb.bg', null, 'official', 'Bulgarian', 'government', true, false, 'requires_verification'),
  ('RS', 'Tanjug', 'https://www.tanjug.rs', null, 'rss', 'Serbian', 'general', false, false, 'requires_verification'),
  ('RS', 'RTS', 'https://www.rts.rs', null, 'rss', 'Serbian', 'public_media', false, false, 'requires_verification'),
  ('RS', 'B92', 'https://www.b92.net', null, 'rss', 'Serbian', 'general', false, false, 'requires_verification'),
  ('RS', 'Blic', 'https://www.blic.rs', null, 'rss', 'Serbian', 'general', false, false, 'requires_verification'),
  ('RS', 'Danas', 'https://www.danas.rs', null, 'rss', 'Serbian', 'general', false, false, 'requires_verification'),
  ('RS', 'Kurir', 'https://www.kurir.rs', null, 'rss', 'Serbian', 'general', false, false, 'requires_verification'),
  ('RS', 'Mondo', 'https://mondo.rs', null, 'rss', 'Serbian', 'general', false, false, 'requires_verification'),
  ('RS', 'N1 Srbija', 'https://n1info.rs', null, 'rss', 'Serbian', 'general', false, false, 'requires_verification'),
  ('RS', 'Nova.rs', 'https://nova.rs', null, 'rss', 'Serbian', 'general', false, false, 'requires_verification'),
  ('RS', 'Politika', 'https://www.politika.rs', null, 'rss', 'Serbian', 'general', false, false, 'requires_verification'),
  ('RS', 'Telegraf.rs', 'https://www.telegraf.rs', null, 'rss', 'Serbian', 'general', false, false, 'requires_verification'),
  ('RS', 'Južne Vesti', 'https://www.juznevesti.com', null, 'rss', 'Serbian', 'regional', false, false, 'requires_verification'),
  ('RS', 'Vreme', 'https://www.vreme.com', null, 'rss', 'Serbian', 'analysis', false, false, 'requires_verification'),
  ('RS', 'RTV Vojvodina', 'https://www.rtv.rs', null, 'rss', 'Serbian', 'public_media', false, false, 'requires_verification')
on conflict (market_code, name) do update set
  website_url = excluded.website_url,
  feed_or_page_url = excluded.feed_or_page_url,
  source_type = excluded.source_type,
  language = excluded.language,
  category = excluded.category,
  official = excluded.official,
  active = excluded.active,
  verification_status = excluded.verification_status;
