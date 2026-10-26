# Stadiums Visited

An interactive map of every football stadium visited, in the style of
[filmtourismus.de/weltkarte](https://www.filmtourismus.de/weltkarte/):
countries with at least one visited stadium are shaded and clickable for a
list, and — since a stadium is a specific point, not just a country-level
fact — every stadium also gets its own pin with details. Built on
[Leaflet](https://leafletjs.com/), no framework, no build step.

Play it at [`stadiumMap.html`](./stadiumMap.html), linked from the site's
[root page](../../index.html) ("← Home").

## Stadium Surfer

[`stadiumSurfer.html`](./stadiumSurfer.html) is the same 110 stadiums as a
card grid in the style of [uNoGS](https://unogs.com): a Wikipedia photo
on the left, then name, club and opening year, a two-sentence description,
capacity, city and flag. Each card's photo and name link to the full
Wikipedia article. There's a search box (stadium, club or city), a country
filter, and four sort orders: visit order, biggest first, oldest first, and
A–Z. Linked from the map's header and back. The page itself is
`stadiumSurfer.html` / `.css` / `.js`, reading the same `stadiums.json`.

## Files

- **`stadiums.json`** — the data. One object per stadium: `name`, `club`,
  `city`, `region` (optional — used for the UK's home nations, since they
  aren't separate polygons in `countries.geo.json`), `country`, `iso2`,
  `lat`, `lon`, `note`, plus the Stadium Surfer fields: `wikiTitle` (the
  English Wikipedia article), `image` (its thumbnail URL), `blurb` (the
  article's first two sentences, pronunciation guides removed),
  `capacity` and `opened` (from Wikidata). This is the only file you need
  to touch to add, remove, or correct a stadium.
- **`countries.geo.json`** — world country boundaries (Natural Earth data
  via [johan/world.geo.json](https://github.com/johan/world.geo.json)),
  used only for the shading layer. A handful of microstates aren't present
  in this dataset (Liechtenstein, Andorra, Monaco among them) — their
  stadiums still get pins, they just don't get a shaded country outline.
- **`app.js`** — loads both JSON files, groups stadiums by `country`,
  renders the shading layer (click a shaded country for its stadium list)
  and a clustered pin layer (click a pin for that stadium's details) on
  top of OpenStreetMap tiles.
- **`stadiumMap.html`** / **`style.css`** — thin shell + Leaflet/marker-
  cluster from CDN (with SRI hashes pinned on the Leaflet core files).

## A note on data accuracy

`stadiums.json` was compiled from a plain list of 108 stadium names (110
since 2026-10-27, with Bournemouth's Vitality Stadium and Catania's Stadio
Angelo Massimino) — most
coordinates are placed from general knowledge of each ground's city/area,
**not** geocoded against an authoritative source. Confidence is high for
major, well-documented grounds (the Emirates, Camp Nou, Anfield, San Siro,
and so on) and lower for smaller or less-documented ones — a few lower-
league English grounds, the Maltese, Nepali and Indian entries in
particular are best-effort estimates. If a pin looks off when you zoom in,
just correct its `lat`/`lon` in `stadiums.json` (right-click the real
location on Google Maps → the coordinates are the first thing in the
context menu).

A few entries also have blank `club` (national teams / stadiums not tied
to one specific club) or came from an ambiguous line in the original list
(e.g. several different Madrid clubs) — worth a pass to double-check names
and spellings match what you actually intended.

## Why country shading uses `country`, not `region`

`region` exists so a popup can say "Glasgow, Scotland, United Kingdom"
instead of just "Glasgow, United Kingdom" — but the shading layer keys off
`country` only, because `countries.geo.json` has one polygon for the whole
United Kingdom, not separate ones for England/Scotland/Wales/Northern
Ireland. A stadium in Belfast and one in London both count toward the same
shaded "United Kingdom" polygon.

## Not in this version

- No search/filter box, no list/table view alongside the map — just the
  map itself, matching the reference site's scope.
- No automatic geocoding pipeline — `lat`/`lon` are hand-maintained in
  `stadiums.json`, the same static-data-file pattern `countries.json` uses
  for the Southern Hemisphere page.

## Where the Stadium Surfer data came from

Fetched once on 2026-10-27, not live. Each stadium was matched by hand to
its English Wikipedia article (`wikiTitle`), so names like "Veltins-Arena"
point at the right page ("Arena AufSchalke"). The photo is the article's
lead image. Three articles have none (Clarence Park, The Hawthorns,
Vallecas), so theirs comes from the Wikidata image (P18) via Commons.
Capacity is Wikidata P1083; the opening year is P1619, or P571 when that's
missing. Centenary Stadium has no capacity on Wikidata, so its card leaves
it out. Entry #1 was renamed from "Jane Paul Stadion" to its real name,
Paul-Janes-Stadion (Fortuna Düsseldorf), and Stadio Druso got its club
(FC Südtirol).
