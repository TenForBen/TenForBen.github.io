# Telangana Assembly

All 119 seats of the **Telangana Legislative Assembly**, in official
constituency-number order (Sirpur = 1 to Bhadrachalam = 119), each with
its 2023 winner and its current weather. Same page as [Kerala
Assembly](../keralaAssembly/README.md), built from the shared files in
[`../shared/`](../shared/).

Open it at [`telanganaAssembly.html`](./telanganaAssembly.html).

## Where the data came from

- **Seats, districts, winners, parties:** Wikipedia's [2023 Telangana Legislative Assembly election](https://en.wikipedia.org/wiki/2023_Telangana_Legislative_Assembly_election#Results_by_constituency)
  article, "Results by constituency" table, as of 2026-11-16. INC 64, BRS 39, BJP 8, AIMIM 7, CPI 1.
  This is the latest Telangana assembly election.
- **Alliances:** pre-poll, from the same article. **INC+** (INC with CPI) 65; **BRS** 39; **NDA** (BJP with Janasena, which won none) 8; **AIMIM** 7.
- **Locations:** approximate. The coordinates on each constituency's own
  Wikipedia article (113 of 119), cross-checked against
  OpenStreetMap (Nominatim) and against the median of each district's
  other seats. Where the two disagreed by more than 20 km, the one in the
  right place was kept. Sirpur, Adilabad, Peddapalli and Pinapaka were corrected that way. Good enough for "what's the weather
  like there," not for drawing boundaries.
- **Altitude:** Open-Meteo's elevation API at those coordinates.

## Files

- **`seats.json`**: the static list (`no`, `constituency`, `district`,
  `winner`, `party`, `alliance`, `lat`, `lon`, `altitudeMeters`).
- **`weatherData.json`**: generated snapshot, `{ generatedAt, byNo }`.
  Refresh it from the `assemblyWeather` folder (about 2.2 minutes):
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/assemblyWeather
  node shared/scrapeWeather.js telanganaAssembly
  ```
- **`telanganaAssembly.html`**: thin shell. Sets `window.ASSEMBLY` (storage key
  `telanganaAssemblyWeather`, alliance colours) and loads the shared CSS and
  `../shared/assembly.js`.

Everything else (columns, Get current weather, the per-row ↻, Compare,
filters, mobile cards) works exactly as on the Kerala page; see its README.
