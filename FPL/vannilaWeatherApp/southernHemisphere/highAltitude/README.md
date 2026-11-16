# High Altitude Cities

A table of the world's top 35 highest-elevation cities, each with its
current weather — the same idea as [Southern
Hemisphere](../southernHemisphere.html), one folder up, plus an
**Altitude** column. Linked from that page's header.

Play it at [`highAltitude.html`](./highAltitude.html).

## Where the top-35 list came from

Wikipedia's ["List of highest large
cities"](https://en.wikipedia.org/wiki/List_of_highest_large_cities)
(cities with population ≥ 100,000), taken down to the top 35 by
elevation. Several countries show up more than once — Bolivia, Colombia
and China all have multiple cities in the list — which is why rows are
keyed by `rank`, not `iso2` the way Southern Hemisphere's are (one
capital per country there; not true here).

## Files

Same shape as `../southernHemisphere/`, one level in:

- **`cities.json`** — the static list: `rank`, `city`, `country`, `iso2`,
  `lat`, `lon`, `altitudeMeters` for 35 cities. Edit this to add/remove
  one; `rank` just needs to stay unique, it doesn't have to stay
  contiguous or sorted.
- **`scrapeWeather.js`** — hand-run Node script, fetches current weather
  for every city from the same OpenWeatherMap endpoint/key
  `../scrapeWeather.js` uses, writes `weatherData.json`.
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude
  node scrapeWeather.js
  ```
- **`weatherData.json`** — generated output, `{ generatedAt, byRank }`.
  Same staleness model as the parent page: a snapshot from the last
  hand-run, not live per-visitor.
- **`app.js`** — fetches `cities.json` + `weatherData.json`, joins on
  `rank`, and renders both a desktop table and a mobile card list from
  the same row data (see Mobile layout below). Duplicated rather than
  shared with `../app.js` — same reasoning as there, no build step to
  import from another file with.
- **`highAltitude.html`** / **`style.css`** — thin shell. Loads
  `../style.css` first for the shared dark "station console" look, then
  this folder's own `style.css` for the things that differ: this page's
  column order, and the mobile card/accordion layout.

## Columns

Flag, City, Country, Altitude, Map, Current Temp, Local Time, Sunrise,
Sunset, Day Length — the same nine as Southern Hemisphere (Country
renamed City, since not every row here is a capital) plus Altitude.
Sorting, Refresh, and Compare all work exactly as described in
[`../README.md`](../README.md) — same buttons, same localStorage keys
pattern (`highAltitudeWeather_lastRun` / `_previousRun` instead of the
`southernHemisphereWeather_*` ones).

Default sort is **Altitude, highest first** (not alphabetical by
country, unlike the parent page) — the whole point of this table is the
ranking.

## Mobile layout

`../southernHemisphere.html` handles a narrow screen by just letting the
table scroll sideways — fine at nine columns, painful at ten. Below 720px
wide, `style.css` swaps the table for a card per city instead: each card
always shows Flag/City/Country/Altitude/Current Temp, and tapping it
expands an accordion panel with the other five columns (Map, Local Time,
Sunrise, Sunset, Day Length). Both the table rows and the cards are built
from the same sorted row data in `app.js`'s `renderTable()`, so sorting,
Refresh and Compare all stay in sync between the two layouts — only one
is ever visible at a time (CSS media query, not a JS-driven switch), so
there's nothing to keep synchronized on resize.

Which cards are expanded is tracked in a `Set` (`openCards`, keyed by
`rank`) that survives re-renders, so re-sorting or hitting Refresh
doesn't collapse a card you had open.

## Mangala Lakshadweep Express

Linked from this page's header: [`mangalaExpress/`](./mangalaExpress/) —
not a ranking like this page, a single train route's 39 stops in order,
each with its current weather. Same table/card mechanism, reused
wholesale (its `style.css` loads this page's own `style.css` for the
layout, unchanged) — see
[`mangalaExpress/README.md`](./mangalaExpress/README.md).

## Coromandel Express

Also linked from this page's header: [`coromandelExpress/`](./coromandelExpress/)
— the same idea again, Howrah to Chennai's 16 stops, minus Mangala
Lakshadweep Express's Koyilandi temperature watch (not a general feature,
just specific to that route) — see
[`coromandelExpress/README.md`](./coromandelExpress/README.md).

## Assembly Weather

Also linked from this page's header: [`assemblyWeather/`](./assemblyWeather/)
— a home page for state legislative assembly weather pages, one card per
assembly. Each assembly lists every seat with its election winner and the
seat's current weather, filterable by alliance and district, using the
same table/card mechanism as this page:

- [Kerala](./assemblyWeather/keralaAssembly/README.md): 140 seats, 2026 result.
- [Tamil Nadu](./assemblyWeather/tamilNaduAssembly/README.md): 234 seats, 2026 result.
- [Chhattisgarh](./assemblyWeather/chhattisgarhAssembly/README.md): 90 seats, 2023 result.
- [Jammu & Kashmir](./assemblyWeather/jammuKashmirAssembly/README.md): 90 seats, 2024 result.
- [Karnataka](./assemblyWeather/karnatakaAssembly/README.md): 224 seats, 2023 result.
- [Andhra Pradesh](./assemblyWeather/andhraPradeshAssembly/README.md): 175 seats, 2024 result.
- [Telangana](./assemblyWeather/telanganaAssembly/README.md): 119 seats, 2023 result.
- [Maharashtra](./assemblyWeather/maharashtraAssembly/README.md): 288 seats, 2024 result.
- [Gujarat](./assemblyWeather/gujaratAssembly/README.md): 182 seats, 2022 result.
- [Himachal Pradesh](./assemblyWeather/himachalPradeshAssembly/README.md): 68 seats, 2022 result.
- [Punjab](./assemblyWeather/punjabAssembly/README.md): 117 seats, 2022 result.
- [Uttarakhand](./assemblyWeather/uttarakhandAssembly/README.md): 70 seats, 2022 result.

The page script, styles and weather scraper are shared, in
`assemblyWeather/shared/`. Each state folder holds only its `seats.json`,
`weatherData.json` and a thin HTML page that sets `window.ASSEMBLY`
(storage key and alliance colours). The pages load the shared files as
`assembly.js?v=N` / `assembly.css?v=N`: after changing either, bump `N`
in every state's HTML so browsers don't keep running the old copy.

To add another assembly: copy one state folder, replace its `seats.json`
(same fields), edit the HTML's title, intro, source link and
`window.ASSEMBLY`, run `node shared/scrapeWeather.js <folder>` from
`assemblyWeather/`, and add an entry to the `ASSEMBLIES` list in
`assemblyWeather/assemblyWeather.html`.
