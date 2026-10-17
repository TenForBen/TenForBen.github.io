# Weather.JS search log

Every search on Weather.JS ([`index.html`](../index.html)) is recorded in
Firestore, along with where it was made from. So is every jump through the
recent-searches bar (Newer / dropdown / Older), which shows the distance
from the last place viewed. Master accounts can read the log on
[`searchLog.html`](../searchLog.html), linked from the footer; nobody else
sees the link or can read the data.

## What's recorded

One document per event in the `weatherSearches` collection of the
`weathergame-bda93` project (same project as GeoStreak, Time Quiz and
DistanceLearningQuiz), written by [`searchLog.js`](../searchLog.js):

| Field | What |
|---|---|
| `type` | `search` (typed and submitted) or `history_nav` (a jump through the recent-searches bar) |
| `method` | for `history_nav`: `dropdown`, `newer` or `older` |
| `query` | what was typed (or, for a jump, the place jumped to) |
| `success`, `error` | whether the lookup found a city, and the error if not |
| `result` | the city it resolved to: name, country, lat, lon |
| `tempC`, `conditions` | the weather shown for a search |
| `from`, `fromQuery`, `distanceKm` | for a jump: the place on screen before, and the distance shown between them |
| `ipLocation` | approximate location from the visitor's IP: city, region, country, lat/lon, ISP, timezone |
| `gps`, `gpsStatus` | exact lat/lon and accuracy if the visitor allowed location; status `granted`, `denied`, `unavailable`, `pending` or `not_asked` |
| `uid`, `nickname` | anonymous Firebase uid (same as the games on that browser) and the GeoStreak nickname if set |
| `browserTimezone`, `language`, `screen`, `userAgent` | browser details |
| `createdAt` | server timestamp |

## How location is captured

- **IP-based**, for every record: [ipwho.is](https://ipwho.is/) (free, no
  key) is called once per visit and cached in `sessionStorage`. City-level
  accuracy; shows the VPN's location for VPN users. The raw IP address
  itself isn't stored.
- **GPS**, only with permission: the browser's location prompt appears on
  the visitor's first search or jump, not on page load. Each record waits
  up to 10 s for an answer before saving. If the visitor allowed it on an
  earlier visit, it's read without prompting.

The footer tells visitors that searches are logged with an approximate
location.

Page loads that just restore the last city aren't logged; only searches
and jumps are. Logging never blocks or breaks the weather app: every
failure is caught and logged to the console only. On a `file://` page it's
skipped, since Firebase sign-in doesn't work there.

## Viewing the log

[`searchLog.html`](../searchLog.html) (master accounts only) shows the 200
newest records, with "Load older" for more:

- summary tiles: records loaded, visitors, searches, distance jumps (and
  how many used the dropdown), and how many have GPS;
- a filter for All / Searches / Distance jumps;
- a table with every field, map links for both locations;
- **Export CSV** of every loaded record and field.

## Rules and masters

`weatherSearches` in [`weatherGame/firestore.rules`](../weatherGame/firestore.rules):
any signed-in visitor can create their own records, only `isMaster()` can
read, nothing can be updated or deleted. Publish the whole rules file in
the Firebase console after changing it.

The master allowlist is repeated in `searchLog.js` (footer link) and
`searchLogPage.js` (page), as well as the game pages; keep them in sync
with `isMaster()`.
