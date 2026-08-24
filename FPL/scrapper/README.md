# FPL Scrapper

A from-scratch JS rewrite of [`FPLscrapper`](https://github.com/TenForBenJamin/FPLscrapper)'s
`Program.cs` (the `airline-scrapper` branch) — same goal (walk a league's
members, pull each manager's team for a gameweek), completely different
approach.

## Why not Selenium like the old one

The old scrapper drove headless Chrome against
`fantasy.premierleague.com/leagues/{id}/standings/...` — a real rendered
page — and pulled data out with XPath, `Thread.Sleep(3000)` between every
single manager to let the page settle. That's the fallback you reach for
when there's no API. There is one here: `fantasy.premierleague.com/api/...`
is a plain public JSON API, no key, no auth, no rendering needed. Cost of
switching: it has no CORS headers, so it can't be called from a browser
page (confirmed live — an `Origin` header gets no
`Access-Control-Allow-Origin` back) — this has to run as a Node script,
not a page on the site. Upside: scraping both pilot leagues (60 managers
combined, including full 15-player picks for each) took **~2 seconds**,
not minutes.

## What it does

```
node scrape.js
```

For each league in `LEAGUES` (`scrape.js` — `478151`/`"R2G"`,
`232737`/`"VivaLosFlamingos"`, `1130674`/`"KVKeKhiladi"`; the `slug` is
just the short name used for its output filenames, see below):

1. Fetches that league's standings (`fplApi.js#getLeague`) — tries the
   **classic** endpoint first, falls back to **head-to-head** on a 404,
   since FPL has two unrelated league types at two different endpoints
   with no way to know which one an ID is ahead of time. Paginates
   through every page of standings either way.
2. For every manager in it, in parallel (`concurrency.js`, capped at 6 at
   once — polite to FPL's API, not the old approach's one-at-a-time-with-
   a-3-second-wait): fetches their profile (`getEntry` — real name, team
   name, country, points, rank) and their picks for the current gameweek
   (`getEntryPicks` — 15 player ids, captain/vice-captain, bench vs
   starting via `multiplier`).
3. Resolves those player ids to names (`bootstrap-static`'s `elements`)
   and that gameweek's individual score per player (`event/{id}/live`'s
   `elements` — bootstrap-static only has season-to-date totals, this is
   the only endpoint with one gameweek's own numbers).
4. Prints a rank-sorted summary table per league, then the full record
   (profile + every pick) for each league's #1 manager as a concrete
   sample of the shape.

Two things get written after that, per run:

- **Firestore** (`firestoreClient.js#writeLeague`) — one document per
  league, one document per manager per gameweek underneath it
  (`leagues/{leagueId}/gameweeks/{gw}/managers/{managerId}`), so a page
  can query "this league, this gameweek" directly. Skipped
  (console-only) if `serviceAccountKey.json` isn't present — see
  Firebase setup below.
- **A legacy-format `punkte.html` + `var s = [...]` data file**
  (`legacyOutput.js`) — see the next section.

## Legacy `punkte.html` output

The old scraper's output was one `.js` "DB" file per league per gameweek
(`FPL/GW/GW{n}/DB/new/{League}.js`, a `var s = [...]` array), loaded by a
static `punkte.html` page (`<script src="...">` + `FPL/js/tableMake.js`'s
`loader4mgw()`) that renders it into a sortable, colour-coded table —
team, manager, all 15 picks with that gameweek's points, colour-coded by
score. `legacyOutput.js` reproduces that exact shape (`manager_Name`,
`Teams`, `SXL`, `Latp`, `Player_1`..`Player_15`) from the clean scraped
manager record, so the existing front-end code (`tableMake.js`,
`bekal.css`) renders it with no changes needed there.

Output goes to `FPL/GW/GW{n}/{season}/` — a **season-named** sibling of
the legacy `GW{n}/new/` folder (`season` auto-derived from today's date,
e.g. `2026-27`; PL seasons start in August) — not into `GW{n}/new/`
itself, so a fresh run never overwrites a previous season's archived
data sitting at the same gameweek number:

```
FPL/GW/GW{n}/{season}/
  DB/{slug}.js          — one per league, the var s = [...] data
  punkte.html            — first league in LEAGUES
  punkte_{slug}.html      — every league after the first
```

The generated `punkte.html` reuses the same CSS/JS asset paths as the
legacy template (`bootstrap.min.css`, `lawrence.css`, `tableMake.js`,
`bekal.css`) since `GW{n}/{season}/` sits at the same folder depth as
`GW{n}/new/` — every relative path resolves identically. The one
exception is `tableMake.js`'s `newButtons()` (the Previous/Next-gameweek
buttons), which hardcodes `.../GW{n}/new/{fileName}`; the generated page
overrides that function inline with `{season}` swapped in for `new`,
rather than changing the shared file every other legacy page still
depends on.

The generated page also overrides `sortTable_col19()` the same way —
clicking any header cell is supposed to sort by "Latest points"
(`loader4mgw()` wires that up), but the shared version compares cells
with `Number()`, which is `NaN` for `"80\nTotal Points"` (every "Latest
points" cell's actual text), so the click silently did nothing. The
override just swaps in `parseInt()`. Matters most for an h2h league —
its row order comes from match wins, not points, so unlike a classic
league it doesn't already happen to read top-to-bottom by score.

## Refresh button (live-ish points during a gameweek)

Every generated `punkte.html` has a **Refresh** button. FPL's API has no
CORS headers (see above), so it re-reads this league's current Firestore
snapshot instead of re-scraping FPL directly from the browser — "fresh as
of the last CI cron tick," not an instant live re-scrape.

- **`.github/workflows/scrape-fpl-leagues.yml`** runs `node scrape.js`
  every 10 minutes (`workflow_dispatch` too, for a manual trigger from
  the Actions tab), writing to Firestore via the
  `FPL_SCRAPPER_SERVICE_ACCOUNT` repo secret (the same JSON key
  `serviceAccountKey.json` holds locally — GitHub Actions has no
  filesystem to persist that file between runs, so it's written fresh
  from the secret each time). Unlike the weather scraper's workflow, it
  never commits anything back — the legacy `punkte.html`/`DB/*.js` files
  it also regenerates as a side effect are thrown away with the runner;
  only Firestore is what this workflow is for.
- **`firebaseConfig.js`** — the client-side (public) Firebase config for
  the same `fpl-scrapper` project, loaded by every `punkte.html` via the
  compat CDN build (`firebase-app-compat.js` + `firebase-firestore-compat.js`,
  matching `weatherGame/geoStreakGame.html`'s pattern — no
  `firebase-auth-compat.js`, this is public read-only data).
- **`firestore.rules`** — public `read`, `write: false` on
  `leagues/**` — paste-into-console documentation, same non-deploying
  role as `weatherGame/firestore.rules`. Every write comes from the
  Admin SDK (a local run or the CI workflow), which bypasses these rules
  entirely; a browser only ever reads.
- The refresh logic itself lives inline in `legacyOutput.js`'s generated
  `<script>` — `managerToLegacyRow()` is a client-side port of
  `toLegacyRow()` (a Firestore manager doc is exactly the manager record
  `scrape.js` wrote, so it's a straight port, not a reinterpretation),
  then it clears every row past the header (`table.deleteRow(1)` in a
  loop — `table.rows` doesn't care which section a row is actually in,
  see the `<thead>`/`<tbody>` note below) and re-runs `tableMake.js`'s
  own `prepareTableCell3mgw()` + `colorCoder()` for each fresh row, so
  rendering stays identical to the initial page load.

One unrelated bug this surfaced: `AufWiedersehen/css/lawrence.css` (
shared by every legacy page) has a bare `div { display: none; }` rule —
pre-existing, not something this introduced, but it silently hid the
Previous/Next-gameweek buttons (and would have hidden the Refresh
button) on every page this script generates. Rather than edit a
stylesheet ~100 other legacy pages depend on, the generated page's own
`<div>`s carry an inline `style="display:block"` — inline style always
wins over any stylesheet rule, so this fixes it locally without
touching `lawrence.css` itself.

## `FPL/scrapper/index.html`

A landing page for this folder's output, regenerated every run
(`legacyOutput.js#writeHomePage`) so it always points at the gameweek
that run just scraped: a button per league straight to its freshest
`punkte.html`, plus a header link over to `FPL/vannilaWeatherApp/`, the
site's other generated-from-a-script app living alongside this one under
`FPL/`. Named `index.html` rather than `home.html` so a static server
(`npx serve`, GitHub Pages, ...) serves it as this folder's default page.
Every generated `punkte.html`/`punkte_{slug}.html` links back to it via a
"Home" button.

## Shape

Cleaner and more literal than the old output — no `manager_Name` field
holding a rank string, no `Latp: "91\nTotal Points"` with the label
baked into the value, no `SXL: "countryCode"` (a literal placeholder
string the old scrapper's country-flag scrape apparently never actually
replaced). Each manager:

```js
{
  managerId: 1677773,
  leagueRank: 1,
  playerName: "VibhutiHang Subba",
  teamName: "Sound of Da Tzolis",
  countryCode: "IN",
  countryName: "India",
  gwPoints: 80,
  overallPoints: 80,
  overallRank: 1891,
  gameweek: 1,
  picks: [
    { name: "Kinsky", gwPoints: 2, multiplier: 1, isCaptain: false, isViceCaptain: false },
    // ...15 total, multiplier 0 = benched, 2 (or 3 w/ triple captain) = captain
  ],
}
```

## Firebase

This is a **server-side script**, not a browser page, so GeoStreak's
pattern (Firestore + Anonymous Auth, security rules as the only real
gate) doesn't apply — there's no "player" to anonymously sign in as, just
a script that should be trusted to write. This uses the **Firebase Admin
SDK** with a service account key instead, in its own project
(`fpl-scrapper` — separate from GeoStreak's `weathergame-bda93`, since
it's a different domain with its own quotas).

`firestoreClient.js` handles it: if `serviceAccountKey.json` (see Setup
below) exists next to it, it initializes the Admin SDK and every
`writeLeague()` call actually writes; if it doesn't, `configured` is
`false` and `scrape.js` skips writing and just prints — same
graceful-degradation shape as GeoStreak's `firebaseConfig.js` placeholder
check, so cloning this repo without the key doesn't crash, it just runs
console-only.

### Setup (already done for `fpl-scrapper`, for reference / re-doing elsewhere)

1. [Firebase console](https://console.firebase.google.com/) → **Add
   project** → Firestore Database enabled (**Databases & Storage** in the
   sidebar → **Create database** → production mode).
2. ⚙️ **Project settings → Service accounts** tab → **Generate new
   private key** → downloads a JSON credentials file. This grants full
   read/write to the project — treat it like a password, not a config
   value. Save it as `serviceAccountKey.json` in this folder; it's
   already in `.gitignore` and must never be committed.
3. `npm install firebase-admin` in this folder (the only dependency —
   everything else here is Node's built-in `fetch`).

### What actually gets written

One document per league, one document per manager per gameweek
underneath it — the direct replacement for one `.js` file per league per
gameweek:

```
leagues/{leagueId}                                  { name, kind, lastScrapedAt }
leagues/{leagueId}/gameweeks/{gw}                    { gameweek }
leagues/{leagueId}/gameweeks/{gw}/managers/{managerId}   ← the manager shape above
```

So a page can query "this league, this gameweek" directly — e.g. every
manager in league 478151's gameweek 1 — instead of loading and parsing a
whole generated file. Confirmed live: both pilot leagues' full rosters
(38 + 22 managers, all picks included) round-tripped through Firestore
and were read back successfully.
