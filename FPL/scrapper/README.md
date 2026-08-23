# FPL Scrapper (pilot)

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

For each league ID in `LEAGUE_IDS` (`scrape.js` — currently `478151` and
`232737`, the two given for this pilot):

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

**Nothing is written to disk.** That's deliberate for this pilot — see
below for what replaces the old `.js` "DB" files
(`FPL/GW/GW{n}/DB/new/{League}.js`) once this moves past pilot stage.

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

## Firebase (next step, not built yet)

This is a **server-side script**, not a browser page — GeoStreak's
pattern (Firestore + Anonymous Auth, security rules as the only real
gate) doesn't apply here; there's no "player" to anonymously sign in as,
just a script that should be trusted to write. The right fit is the
**Firebase Admin SDK** with a service account key instead:

1. New Firebase project (separate from GeoStreak's `weathergame-bda93` —
   different domain, own quotas/rules) — Firestore Database enabled,
   same as GeoStreak's setup.
2. **Project Settings → Service Accounts → Generate new private key** —
   downloads a JSON credentials file. This grants full read/write to the
   project, so it's `.gitignore`'d here (`serviceAccountKey.json`) and
   must never be committed — treat it like a password, not a config value.
3. `npm install firebase-admin` in this folder (no dependency needed
   until this step — everything above is Node's built-in `fetch`).
4. `admin.initializeApp({ credential: admin.credential.cert(serviceAccountKey) })`,
   then write each league's managers into Firestore — the natural
   replacement for one `.js` file per league per gameweek is one document
   per manager per gameweek, e.g.
   `leagues/{leagueId}/gameweeks/{gw}/managers/{managerId}`, so a page
   can query "this league, this gameweek" directly instead of loading a
   whole generated file.

Not implemented yet because it needs an actual Firebase project to point
at — say the word once one exists (or ask for a walkthrough creating one,
same as GeoStreak's) and this gets wired in.
