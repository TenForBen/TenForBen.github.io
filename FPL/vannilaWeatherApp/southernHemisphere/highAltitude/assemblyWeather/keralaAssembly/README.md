# Kerala Assembly

All 140 seats of the **Kerala Legislative Assembly**, in official
constituency-number order (1 Manjeshwaram, in the far north, to 140
Neyyattinkara, in the far south), each with its 2026 winner and its
current weather. Same idea and same table/card machinery as [Mangala
Lakshadweep Express](../../mangalaExpress/README.md), two folders up.

Open it at [`keralaAssembly.html`](./keralaAssembly.html).

## Where the data came from

- **Seats, districts, winners, parties, alliances:** Wikipedia's [2026
  Kerala Legislative Assembly
  election](https://en.wikipedia.org/wiki/2026_Kerala_Legislative_Assembly_election#Results_by_constituency)
  article, "Results by constituency" table, as of 2026-10-26. UDF 102,
  LDF 35, NDA 3.
- **Locations:** approximate, the town or area each seat is named
  after, not the seat's geographic centre. 20 come from the
  constituency's own Wikipedia article, about 70 from the namesake town's
  article, and the remaining 50 from OpenStreetMap (Nominatim, limited to
  Kerala). Each one was checked against the median of its district's
  other seats. The three that sit more than 40 km out (Thrithala,
  Thodupuzha, Aroor) really are at the edge of their district. Good
  enough for "what's the weather like there," not for drawing
  boundaries.
- **Altitude:** Open-Meteo's elevation API at those coordinates.

## Files

This folder holds only Kerala's data and page. The script, styles and
scraper are shared with the other states in [`../shared/`](../shared/)
(see the Assembly Weather section of [`../../README.md`](../../README.md)).

- **`seats.json`**: the static list. Each seat has `no`, `constituency`,
  `district`, `winner`, `party`, `alliance`, `lat`, `lon` and
  `altitudeMeters`.
- **`weatherData.json`**: generated snapshot, `{ generatedAt, byNo }`.
  Refresh it from the `assemblyWeather` folder (about 2.5 minutes,
  throttled to the free-tier 60 calls a minute):
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/assemblyWeather
  node shared/scrapeWeather.js keralaAssembly
  ```
- **`keralaAssembly.html`**: thin shell. Sets `window.ASSEMBLY` (storage
  key and the UDF / LDF / NDA colours), loads `../../../style.css`,
  `../../style.css` (High Altitude's table/cards) and
  `../shared/assembly.css`, then `../shared/assembly.js`, which joins the
  two JSON files on `no` and renders the table and mobile cards.

There's no scheduled workflow for this page, unlike Mangala and
Coromandel. The snapshot only changes when someone runs the scraper.

## Using the page

- **Columns:** No., Constituency, Current Temp, Altitude, Reading
  Taken At, District, MLA, Alliance (with party), Map, Sunrise, Sunset,
  Day Length. Reading Taken At is OpenWeather's own time for that seat's
  reading (`readingAt` in weatherData.json, IST); a snapshot saved before
  that field existed shows the snapshot's time instead (hover says so).
  Hover the temperature for the conditions ("light rain"). Every column
  sorts. There's no Local Time column, because every seat is IST: the
  clock sits once above the table instead.
- **Get current weather** re-fetches all 140 seats live in the
  browser, with a progress count. It always fetches every seat, whatever
  the filters show. The result is cached in localStorage
  (`keralaAssemblyWeather_lastRun` / `_previousRun`). On load the page
  shows whichever is newer, that cache or the committed snapshot.
- **Compare to last run** shows each seat's temperature and day-length
  change since the previous fetch, as on the other pages.
- **Filters:** alliance chips (All / UDF / LDF / NDA, with seat counts)
  and a district picker (districts listed north to south). The two
  combine.
- **Mobile:** below 720 px the table becomes a card per seat showing the
  number, constituency, district, alliance and temperature. Tap a card
  for the rest.
