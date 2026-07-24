# Bulgarian Source Verification

Last checked: 2026-07-24

This note records the first Bulgarian source verification pass. Sources remain
inactive until ingestion parsers are implemented and reviewed.

| Source | Result | Feed or page |
| --- | --- | --- |
| BTA | Verified RSS feed | https://www.bta.bg/bg/rss/free |
| Capital | Candidate RSS exists, but direct server request returned 403 | https://www.capital.bg/rss |
| Dnevnik | Candidate RSS exists, but direct server request returned 402 | https://www.dnevnik.bg/rss/?rubrid= |
| BNT | Verified RSS feed | https://news.bnt.bg/bg/rss/news.xml |
| BBC World | Verified RSS feed | https://www.bbc.com/news/world/rss.xml |
| National Assembly | Verified official RSS index page | https://www.parliament.bg/bg/rss |
| Council of Ministers | Verified official news page | https://www.gov.bg/bg/prestsentar/novini |
| National Revenue Agency | Verified official news page candidate | https://nra.bg/wps/portal/nra/actualno |
| Bulgarian National Bank | Verified official RSS index page | https://www.bnb.bg/AboutUs/PressOffice/PORSS/index.htm |

## Follow-up

- Recheck Capital and Dnevnik with a browser-like request during ingestion work.
- Parse National Assembly and BNB RSS index pages before choosing a final feed.
- Keep all sources inactive until the ingestion pipeline can log imports and errors.
