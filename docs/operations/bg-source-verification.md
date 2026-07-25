# Bulgarian Source Verification

Last checked: 2026-07-25

This note records the Bulgarian source verification pass. Direct verified RSS
feeds and configured HTML parsers are active for ingestion. Blocked feeds,
empty feeds, index pages, and unconfigured plain news pages remain inactive until
a parser or access strategy is reviewed.

| Source | Result | Feed or page |
| --- | --- | --- |
| BTA | Verified RSS feed | https://www.bta.bg/bg/rss/free |
| Capital | Verified RSS feed with browser-style request headers | https://www.capital.bg/rss/ |
| Dnevnik | Verified RSS feed with browser-style request headers | https://www.dnevnik.bg/rss/ |
| BNT | Verified RSS feed | https://news.bnt.bg/bg/rss/news.xml |
| BBC World | Verified RSS feed | https://www.bbc.com/news/world/rss.xml |
| Novinite.com | Paused: live Vercel run returned 403 | https://www.novinite.com/services/news_rdf.php |
| Actualno | Verified RSS feed | https://www.actualno.com/rss |
| Mediapool | Verified RSS feed | https://www.mediapool.bg/rss |
| Sega | Verified RSS feed | https://www.segabg.com/rss/rss20.xml |
| 24 Chasa | Verified RSS feed | https://www.24chasa.bg/rss |
| Svobodna Evropa | Verified RSS feed | https://www.svobodnaevropa.bg/api/ |
| OFFNews | Candidate feed blocked by Cloudflare from server request | https://offnews.bg/rss |
| bTV Novinite | Verified page, no clean RSS activated yet | https://btvnovinite.bg |
| NOVA News | Verified page, no clean RSS activated yet | https://nova.bg/news |
| Darik News | Verified page, no clean RSS activated yet | https://dariknews.bg |
| Dnes.bg | Verified page, no clean RSS activated yet | https://www.dnes.bg |
| News.bg | Verified page, no clean RSS activated yet | https://news.bg |
| National Assembly | Verified official RSS index page | https://www.parliament.bg/bg/rss |
| Council of Ministers | Configured HTML parser | https://www.gov.bg/bg/prestsentar/novini |
| President of Bulgaria | Configured HTML parser | https://www.president.bg |
| Ministry of Foreign Affairs | Verified official RSS feed | https://www.mfa.bg/bg/rss |
| Ministry of Finance | Paused: live Vercel run returned 403 | https://www.minfin.bg/bg/news |
| Ministry of Interior | Paused: live Vercel run returned 403/502 | https://www.mvr.bg |
| Ministry of Health | Configured HTML parser | https://www.mh.government.bg/bg/novini/ |
| Ministry of Education and Science | Paused: live Vercel run returned 403 | https://www.mon.bg |
| Ministry of Tourism | Verified RSS page, not direct XML in ingestion check | https://www.tourism.government.bg/bg/rss |
| Ministry of Agriculture and Food | Verified RSS page, not direct XML in ingestion check | https://www.mzh.government.bg/bg/rss/ |
| National Revenue Agency / НАП | Paused: live Vercel run failed to fetch | https://nra.bg/wps/portal/nra/actualno |
| National Social Security Institute / НОИ | Verified official page; WordPress feed endpoints returned 403 | https://www.nssi.bg |
| National Health Insurance Fund | Verified official RSS feed | https://www.nhif.bg/rss |
| National Statistical Institute | Paused: live Vercel run returned 403 | https://www.nsi.bg |
| Bulgarian National Bank | Verified official RSS index page | https://www.bnb.bg/AboutUs/PressOffice/PORSS/index.htm |
| Ministry of Electronic Governance | Paused: live Vercel run timed out | https://egov.bg/wps/portal/egov |
| Registry Agency | Configured HTML parser | https://portal.registryagency.bg |
| Public Procurement Agency | Paused: live Vercel run returned 403 | https://www2.aop.bg |
| Commission for Consumer Protection | Configured HTML parser | https://kzp.bg |
| Financial Supervision Commission | Configured HTML parser | https://www.fsc.bg |
| Commission on Protection of Competition | Configured HTML parser | https://www.cpc.bg |
| Ombudsman of Bulgaria | Paused: parser found 0 records in live run | https://www.ombudsman.bg |
| Road Infrastructure Agency | Paused: live Vercel run timed out | https://www.api.bg |
| Sofia Municipality | Configured HTML parser tuned to `/w/` article paths | https://www.sofia.bg |
| Plovdiv Municipality | Paused: live Vercel run returned 403 | https://www.plovdiv.bg/feed/ |
| Varna Municipality | Verified local RSS feed | https://www.varna.bg/bg/rss |
| Burgas Municipality | RSS endpoint returned empty content during check | https://www.burgas.bg/bg/rss |
| Ruse Municipality | Configured HTML parser | https://obshtinaruse.bg |
| Stara Zagora Municipality | RSS endpoint returned empty content during check | https://www.starazagora.bg/bg/rss |
| Veliko Tarnovo Municipality | RSS endpoint returned empty content during check | https://www.veliko-tarnovo.bg/bg/rss |
| Pleven Municipality | RSS endpoint returned empty content during check | https://www.pleven.bg/bg/rss |
| Dobrich Municipality | RSS endpoint returned empty content during check | https://www.dobrich.bg/bg/rss |
| Blagoevgrad Municipality | Configured HTML parser | https://www.blagoevgrad.bg |
| Sliven Municipality | Paused: parser found 0 records in live run | https://www.sliven.bg |
| Shumen Municipality | Configured HTML parser | https://www.shumen.bg |

## Active RSS Sources

- BTA
- Capital
- Dnevnik
- BNT
- BBC World
- Actualno
- Mediapool
- Sega
- 24 Chasa
- Svobodna Evropa
- Ministry of Foreign Affairs
- National Health Insurance Fund
- Varna Municipality

These are direct RSS/XML feeds with `verification_status = verified_feed`.

## Active HTML Parser Sources

- Council of Ministers
- President of Bulgaria
- Ministry of Health
- Registry Agency
- Commission for Consumer Protection
- Financial Supervision Commission
- Commission on Protection of Competition
- Sofia Municipality
- Ruse Municipality
- Blagoevgrad Municipality
- Shumen Municipality

These are page-based imports with `verification_status = configured_html_parser`.
The parser imports same-site links that match configured news/path keywords.

## Paused After Live Run

- Novinite.com: 403 from Vercel
- National Statistical Institute: 403 from Vercel
- Ministry of Electronic Governance: timeout
- Plovdiv Municipality: 403 from Vercel
- Public Procurement Agency: 403 from Vercel
- National Revenue Agency / НАП: fetch failed
- Ministry of Finance: 403 from Vercel
- Ministry of Interior: 403/502 from Vercel
- Ministry of Education and Science: 403 from Vercel
- Road Infrastructure Agency: timeout
- Ombudsman of Bulgaria: 0 imported
- Sliven Municipality: 0 imported

## Follow-up

- Parse National Assembly and BNB RSS index pages before choosing a final feed.
- Tune parser support for important HTML-only sources and add source-specific
  configs for bTV, NOVA, Darik, НОИ and harder municipality pages.
- Recheck official feeds periodically because some administrations expose empty
  XML endpoints or block generic feed access.
- Keep blocked, index-page, and unconfigured page candidates inactive until the
  ingestion pipeline can parse them intentionally and log source-specific errors.
