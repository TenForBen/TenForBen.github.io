# Punjab Assembly

All 117 seats of the **Punjab Legislative Assembly**, in official
constituency-number order (Sujanpur = 1 to Shutrana = 117), each with
its 2022 winner and its current weather. Same page as [Kerala
Assembly](../keralaAssembly/README.md), built from the shared files in
[`../shared/`](../shared/).

Open it at [`punjabAssembly.html`](./punjabAssembly.html).

## Where the data came from

- **Seats, districts, winners, parties:** Wikipedia's [2022 Punjab Legislative Assembly election](https://en.wikipedia.org/wiki/2022_Punjab_Legislative_Assembly_election#Results_by_constituency)
  article, "Results by constituency" table, as of 2026-11-17. AAP 92, INC 18, SAD 3, BJP 2, BSP 1, independent 1.
  This is the latest Punjab assembly election.
- **Alliances:** **AAP** 92; **INC** 18; **SAD+** (Shiromani Akali Dal with BSP) 4; **BJP** 2; **Others** (one independent) 1.
- **Locations:** approximate. The coordinates on each constituency's own
  Wikipedia article (113 of 117), cross-checked against
  OpenStreetMap (Nominatim) and against the median of each district's
  other seats. Where the two disagreed by more than 20 km, the one in the
  right place was kept. Sujanpur (the article's point was in Madhya Pradesh), Batala, Jandiala and Balluana were corrected that way. Good enough for "what's the weather
  like there," not for drawing boundaries.
- **Altitude:** Open-Meteo's elevation API at those coordinates.

## Files

- **`seats.json`**: the static list (`no`, `constituency`, `district`,
  `winner`, `party`, `alliance`, `lat`, `lon`, `altitudeMeters`).
- **`weatherData.json`**: generated snapshot, `{ generatedAt, byNo }`.
  Refresh it from the `assemblyWeather` folder (about 2.2 minutes):
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/assemblyWeather
  node shared/scrapeWeather.js punjabAssembly
  ```
- **`punjabAssembly.html`**: thin shell. Sets `window.ASSEMBLY` (storage key
  `punjabAssemblyWeather`, alliance colours) and loads the shared CSS and
  `../shared/assembly.js`.

Everything else (columns, Get current weather, the per-row ↻ with its
▲/▼ change, Compare, filters, phone sorting and cards) works exactly as on
the Kerala page; see its README.
