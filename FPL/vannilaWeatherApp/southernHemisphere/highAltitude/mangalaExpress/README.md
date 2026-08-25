# Mangala Lakshadweep Express

Every stop of trains 12617/12618 **Mangala Lakshadweep Express**
(Hazrat Nizamuddin, Delhi &harr; Ernakulam Junction, Kochi), in route
order, each with its current weather — same idea as [High Altitude
Cities](../highAltitude.html), one folder up, with City/Country renamed
Station/State (every row here is India) and the default sort flipped to
route order instead of a ranking. Linked from that page's header.

Play it at [`mangalaExpress.html`](./mangalaExpress.html).

## Where the stop list came from

Wikipedia's [Mangala Lakshadweep
Express](https://en.wikipedia.org/wiki/Mangala_Lakshadweep_Express)
article — all 39 stations it lists, Nizamuddin to Ernakulam. Coordinates
and altitude are approximate (the station's town/city centre, to the
nearest few metres of elevation), not surveyed platform-level GPS — good
enough for "what's the weather like there right now," not for anything
more precise.

## Files

Same shape as `../` (High Altitude Cities), one level in:

- **`stops.json`** — the static list: `order`, `station`, `state`,
  `iso2`, `lat`, `lon`, `altitudeMeters` for 39 stops. One entry
  (Koyilandi) also has a `watch` field — see below. Edit this to
  add/remove a stop; `order` just needs to stay unique, it doesn't have
  to stay contiguous.
- **`scrapeWeather.js`** — hand-run (or workflow-run) Node script,
  fetches current weather for every stop from the same OpenWeatherMap
  endpoint/key every other `scrapeWeather.js` in this app uses, writes
  `weatherData.json`.
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/mangalaExpress
  node scrapeWeather.js
  ```
- **`weatherData.json`** — generated output, `{ generatedAt, byOrder }`.
- **`app.js`** — fetches `stops.json` + `weatherData.json`, joins on
  `order`, and renders both a desktop table and a mobile card list.
  Duplicated rather than shared with `../app.js` — same reasoning as
  there, no build step to import from another file with.
- **`mangalaExpress.html`** — thin shell. Loads `../../style.css` (the
  shared dark "station console" look), then `../style.css` (High
  Altitude's table/card layout — reused as-is, unchanged), then this
  folder's own `style.css` for the one new thing: the Koyilandi watch
  highlight.

## Columns

Flag, Station, State, Altitude, Map, Current Temp, Local Time, Sunrise,
Sunset, Day Length — the same ten as High Altitude Cities (City renamed
Station, Country renamed State, since every row is India). Sorting,
Refresh, and Compare all work exactly as described in
[`../README.md`](../README.md) and [the parent
`../../README.md`](../../README.md) — same buttons, same localStorage
keys pattern (`mangalaExpressWeather_lastRun` / `_previousRun`).

Default sort is **route order** (Delhi first), not altitude — unlike High
Altitude Cities, this page isn't a ranking, it's a journey, so reading it
top to bottom should mean travelling it.

## Koyilandi watch

One stop, Koyilandi, carries a `watch: { aboveC: 29 }` field in
`stops.json`. Whenever a reading meets or beats that threshold, its Temp
cell turns gold with a ⚠ badge (`watchHit()` in `app.js`) and its whole
row gets a subtle highlight — same "call out a threshold, don't just log
a number" idea as GeoStreak History's [temp-closeness
coloring](../../../weatherGame/README.md).

The scheduled workflow (`.github/workflows/scrape-mangala-express-weather.yml`)
runs **every hour** — deliberately the tightest interval any workflow in
this repo uses — specifically so this threshold doesn't sit unnoticed for
half a day the way a 12-hourly scrape would. `scrapeWeather.js` also
prints a loud `>>> WATCH HIT <<<` line to the run's log the moment it's
crossed, so you don't even have to open the page to know.

**Why hourly-always instead of "hourly only once it's close, otherwise
less often":** a GitHub Actions `schedule:` trigger is a fixed cron
baked into the workflow file — a run can't reach back in time and change
its *own* schedule for next time, only a human (or a separate commit)
editing the workflow file can. Actually doing that automatically would
mean a workflow committing changes to itself mid-run, which is exactly
the kind of self-modifying-CI cleverness that's fragile and confusing to
debug later. Running hourly unconditionally is the honest version of
"keep a close eye on this" — same tradeoff `../../scrapeWeather.js`
already makes at 12-hourly (see its own workflow's comment).

## Mobile layout

Identical mechanism to [High Altitude Cities'](../README.md#mobile-layout)
— below 720px wide, the table becomes a card per stop, same breakpoint,
same CSS, same `openCards` survive-a-re-render behaviour, just keyed by
`order` instead of `rank`.
