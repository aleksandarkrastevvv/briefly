-- Expand Bulgarian sources for Briefly ingestion and source tracking.
-- Checked on 2026-07-25.
--
-- Active = true only for verified RSS/XML feeds or configured HTML parsers.
-- Important pages without a clean feed remain inactive until a parser is added.

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
  ('BG', 'Capital', 'https://www.capital.bg', 'https://www.capital.bg/rss/', 'rss', 'Bulgarian', 'business', false, true, 'verified_feed'),
  ('BG', 'Dnevnik', 'https://www.dnevnik.bg', 'https://www.dnevnik.bg/rss/', 'rss', 'Bulgarian', 'general', false, true, 'verified_feed'),
  ('BG', 'Novinite.com', 'https://www.novinite.com', 'https://www.novinite.com/services/news_rdf.php', 'rss', 'English', 'general', false, false, 'candidate_feed_blocked_403_live'),
  ('BG', 'Actualno', 'https://www.actualno.com', 'https://www.actualno.com/rss', 'rss', 'Bulgarian', 'general', false, true, 'verified_feed'),
  ('BG', 'Mediapool', 'https://www.mediapool.bg', 'https://www.mediapool.bg/rss', 'rss', 'Bulgarian', 'politics', false, true, 'verified_feed'),
  ('BG', 'Sega', 'https://www.segabg.com', 'https://www.segabg.com/rss/rss20.xml', 'rss', 'Bulgarian', 'general', false, true, 'verified_feed'),
  ('BG', '24 Chasa', 'https://www.24chasa.bg', 'https://www.24chasa.bg/rss', 'rss', 'Bulgarian', 'general', false, true, 'verified_feed'),
  ('BG', 'Svobodna Evropa', 'https://www.svobodnaevropa.bg', 'https://www.svobodnaevropa.bg/api/', 'rss', 'Bulgarian', 'politics', false, true, 'verified_feed'),
  ('BG', 'OFFNews', 'https://offnews.bg', 'https://offnews.bg/rss', 'rss', 'Bulgarian', 'general', false, false, 'candidate_feed_blocked_403'),
  ('BG', 'bTV Novinite', 'https://btvnovinite.bg', 'https://btvnovinite.bg', 'html', 'Bulgarian', 'public_media', false, false, 'verified_page'),
  ('BG', 'NOVA News', 'https://nova.bg', 'https://nova.bg/news', 'html', 'Bulgarian', 'public_media', false, false, 'verified_page'),
  ('BG', 'Darik News', 'https://dariknews.bg', 'https://dariknews.bg', 'html', 'Bulgarian', 'general', false, false, 'verified_page'),
  ('BG', 'Dnes.bg', 'https://www.dnes.bg', 'https://www.dnes.bg', 'html', 'Bulgarian', 'general', false, false, 'verified_page'),
  ('BG', 'News.bg', 'https://news.bg', 'https://news.bg', 'html', 'Bulgarian', 'general', false, false, 'verified_page'),
  ('BG', 'President of Bulgaria', 'https://www.president.bg', 'https://www.president.bg', 'official', 'Bulgarian', 'government', true, false, 'verified_page'),
  ('BG', 'Ministry of Foreign Affairs', 'https://www.mfa.bg', 'https://www.mfa.bg/bg/rss', 'rss', 'Bulgarian', 'government', true, true, 'verified_feed'),
  ('BG', 'Ministry of Finance', 'https://www.minfin.bg', 'https://www.minfin.bg/bg/news', 'official', 'Bulgarian', 'government', true, false, 'verified_page'),
  ('BG', 'Ministry of Interior', 'https://www.mvr.bg', 'https://www.mvr.bg', 'official', 'Bulgarian', 'government', true, false, 'verified_page'),
  ('BG', 'Ministry of Health', 'https://www.mh.government.bg', 'https://www.mh.government.bg/bg/novini/', 'official', 'Bulgarian', 'health', true, false, 'verified_page'),
  ('BG', 'Ministry of Education and Science', 'https://www.mon.bg', 'https://www.mon.bg', 'official', 'Bulgarian', 'education', true, false, 'verified_page'),
  ('BG', 'Ministry of Tourism', 'https://www.tourism.government.bg', 'https://www.tourism.government.bg/bg/rss', 'official', 'Bulgarian', 'tourism', true, false, 'verified_rss_page'),
  ('BG', 'Ministry of Agriculture and Food', 'https://www.mzh.government.bg', 'https://www.mzh.government.bg/bg/rss/', 'official', 'Bulgarian', 'agriculture', true, false, 'verified_rss_page'),
  ('BG', 'National Revenue Agency', 'https://nra.bg', 'https://nra.bg/wps/portal/nra/actualno', 'official', 'Bulgarian', 'government', true, false, 'verified_page'),
  ('BG', 'National Social Security Institute', 'https://www.nssi.bg', 'https://www.nssi.bg', 'official', 'Bulgarian', 'social_security', true, false, 'verified_page'),
  ('BG', 'National Health Insurance Fund', 'https://www.nhif.bg', 'https://www.nhif.bg/rss', 'rss', 'Bulgarian', 'health', true, true, 'verified_feed'),
  ('BG', 'National Statistical Institute', 'https://www.nsi.bg', 'https://www.nsi.bg', 'official', 'Bulgarian', 'statistics', true, false, 'candidate_page_blocked_403_live'),
  ('BG', 'Bulgarian National Bank', 'https://www.bnb.bg', 'https://www.bnb.bg/AboutUs/PressOffice/PORSS/index.htm', 'official', 'Bulgarian', 'government', true, false, 'verified_rss_index'),
  ('BG', 'Ministry of Electronic Governance', 'https://egov.bg', 'https://egov.bg/wps/portal/egov', 'official', 'Bulgarian', 'e_government', true, false, 'candidate_timeout_live'),
  ('BG', 'Registry Agency', 'https://portal.registryagency.bg', 'https://portal.registryagency.bg', 'official', 'Bulgarian', 'business_registers', true, false, 'verified_page'),
  ('BG', 'Public Procurement Agency', 'https://www2.aop.bg', 'https://www2.aop.bg', 'official', 'Bulgarian', 'procurement', true, false, 'candidate_page_blocked_403_live'),
  ('BG', 'Commission for Consumer Protection', 'https://kzp.bg', 'https://kzp.bg', 'official', 'Bulgarian', 'consumer_protection', true, false, 'verified_page'),
  ('BG', 'Financial Supervision Commission', 'https://www.fsc.bg', 'https://www.fsc.bg', 'official', 'Bulgarian', 'finance', true, false, 'verified_page'),
  ('BG', 'Commission on Protection of Competition', 'https://www.cpc.bg', 'https://www.cpc.bg', 'official', 'Bulgarian', 'competition', true, false, 'verified_page'),
  ('BG', 'Ombudsman of Bulgaria', 'https://www.ombudsman.bg', 'https://www.ombudsman.bg', 'official', 'Bulgarian', 'rights', true, false, 'candidate_parser_weak_zero'),
  ('BG', 'Road Infrastructure Agency', 'https://www.api.bg', 'https://www.api.bg', 'official', 'Bulgarian', 'transport', true, false, 'candidate_timeout_live'),
  ('BG', 'Sofia Municipality', 'https://www.sofia.bg', 'https://www.sofia.bg', 'official', 'Bulgarian', 'local', true, false, 'verified_page'),
  ('BG', 'Plovdiv Municipality', 'https://www.plovdiv.bg', 'https://www.plovdiv.bg/feed/', 'rss', 'Bulgarian', 'local', true, false, 'candidate_feed_blocked_403_live'),
  ('BG', 'Varna Municipality', 'https://www.varna.bg', 'https://www.varna.bg/bg/rss', 'rss', 'Bulgarian', 'local', true, true, 'verified_feed'),
  ('BG', 'Burgas Municipality', 'https://www.burgas.bg', 'https://www.burgas.bg/bg/rss', 'official', 'Bulgarian', 'local', true, false, 'verified_empty_feed'),
  ('BG', 'Ruse Municipality', 'https://obshtinaruse.bg', 'https://obshtinaruse.bg', 'official', 'Bulgarian', 'local', true, false, 'verified_page'),
  ('BG', 'Stara Zagora Municipality', 'https://www.starazagora.bg', 'https://www.starazagora.bg/bg/rss', 'official', 'Bulgarian', 'local', true, false, 'verified_empty_feed'),
  ('BG', 'Veliko Tarnovo Municipality', 'https://www.veliko-tarnovo.bg', 'https://www.veliko-tarnovo.bg/bg/rss', 'official', 'Bulgarian', 'local', true, false, 'verified_empty_feed'),
  ('BG', 'Pleven Municipality', 'https://www.pleven.bg', 'https://www.pleven.bg/bg/rss', 'official', 'Bulgarian', 'local', true, false, 'verified_empty_feed'),
  ('BG', 'Dobrich Municipality', 'https://www.dobrich.bg', 'https://www.dobrich.bg/bg/rss', 'official', 'Bulgarian', 'local', true, false, 'verified_empty_feed'),
  ('BG', 'Blagoevgrad Municipality', 'https://www.blagoevgrad.bg', 'https://www.blagoevgrad.bg', 'official', 'Bulgarian', 'local', true, false, 'verified_page'),
  ('BG', 'Sliven Municipality', 'https://www.sliven.bg', 'https://www.sliven.bg', 'official', 'Bulgarian', 'local', true, false, 'candidate_parser_weak_zero'),
  ('BG', 'Shumen Municipality', 'https://www.shumen.bg', 'https://www.shumen.bg', 'official', 'Bulgarian', 'local', true, false, 'verified_page')
on conflict (market_code, name) do update set
  website_url = excluded.website_url,
  feed_or_page_url = excluded.feed_or_page_url,
  source_type = excluded.source_type,
  language = excluded.language,
  category = excluded.category,
  official = excluded.official,
  active = excluded.active,
  verification_status = excluded.verification_status,
  updated_at = now();

-- First HTML parser batch for official and high-value Bulgarian pages.
-- These pages are imported by extracting same-site article links from a known news page.
update sources
set
  active = true,
  verification_status = 'configured_html_parser',
  parser_config = configured.parser_config::jsonb,
  updated_at = now()
from (
  values
    ('BG', 'Council of Ministers', '{"allowedPathPrefixes":["/bg/prestsentar/novini"],"includeKeywords":["novini"],"maxLinks":15}'),
    ('BG', 'President of Bulgaria', '{"allowedPathPrefixes":["/news"],"includeKeywords":["news"],"maxLinks":15}'),
    ('BG', 'Ministry of Health', '{"allowedPathPrefixes":["/bg/novini"],"includeKeywords":["novini"],"maxLinks":15}'),
    ('BG', 'Registry Agency', '{"includeKeywords":["novini","news"],"maxLinks":15}'),
    ('BG', 'Commission for Consumer Protection', '{"includeKeywords":["novini","news"],"maxLinks":15}'),
    ('BG', 'Financial Supervision Commission', '{"includeKeywords":["novini","news"],"maxLinks":15}'),
    ('BG', 'Commission on Protection of Competition', '{"includeKeywords":["novini","news"],"maxLinks":15}'),
    ('BG', 'Sofia Municipality', '{"allowedPathPrefixes":["/w/"],"maxLinks":15}'),
    ('BG', 'Ruse Municipality', '{"includeKeywords":["novini","news"],"maxLinks":15}'),
    ('BG', 'Blagoevgrad Municipality', '{"includeKeywords":["novini","news"],"maxLinks":15}'),
    ('BG', 'Shumen Municipality', '{"includeKeywords":["novini","news"],"maxLinks":15}')
) as configured(market_code, name, parser_config)
where sources.market_code = configured.market_code
  and sources.name = configured.name;

update sources
set active = false,
    updated_at = now()
where market_code = 'BG'
  and name in (
    'Novinite.com',
    'National Statistical Institute',
    'Ministry of Electronic Governance',
    'Public Procurement Agency',
    'Ombudsman of Bulgaria',
    'Road Infrastructure Agency',
    'Plovdiv Municipality',
    'Ministry of Finance',
    'Ministry of Interior',
    'Ministry of Education and Science',
    'National Revenue Agency',
    'Sliven Municipality'
  );
