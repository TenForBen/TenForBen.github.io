# Kerala Assembly

All 140 seats of the **Kerala Legislative Assembly**, in official
constituency-number order (1 Manjeshwaram, in the far north, to 140
Neyyattinkara, in the far south), each with its 2026 winner and its
current weather. Same idea and same table/card machinery as [Mangala
Lakshadweep Express](../mangalaExpress/README.md), one folder over.

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

- **`seats.json`**: the static list. Each seat has `no`, `constituency`,
  `district`, `winner`, `party`, `alliance`, `lat`, `lon` and
  `altitudeMeters`.
- **`scrapeWeather.js`**: hand-run Node script. It fetches current
  weather for all 140 seats from the same OpenWeatherMap endpoint and key
  every other `scrapeWeather.js` in this app uses, and writes
  `weatherData.json`. Takes about 2.5 minutes (throttled to the
  free-tier 60 calls a minute).
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/keralaAssembly
  node scrapeWeather.js
  ```
- **`weatherData.json`**: generated output, `{ generatedAt, byNo }`.
- **`app.js`**: joins the two on `no` and renders the desktop table and
  the mobile card list.
- **`keralaAssembly.html`**: thin shell. Loads `../../style.css`, then
  `../style.css` (High Altitude's table/cards, unchanged), then this
  folder's `style.css` (wider page, column overrides, alliance badges,
  filters).

There's no scheduled workflow for this page, unlike Mangala and
Coromandel. The snapshot only changes when someone runs `scrapeWeather.js`.

## Using the page

- **Columns:** No., Constituency, District, MLA, Alliance (with
  party), Altitude, Map, Current Temp, Sunrise, Sunset, Day Length.
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
