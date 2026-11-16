# Gujarat Assembly

All 182 seats of the **Gujarat Legislative Assembly**, in official
constituency-number order (Abdasa = 1 to Umbergaon = 182), each with
its 2022 winner and its current weather. Same page as [Kerala
Assembly](../keralaAssembly/README.md), built from the shared files in
[`../shared/`](../shared/).

Open it at [`gujaratAssembly.html`](./gujaratAssembly.html).

## Where the data came from

- **Seats, districts, winners, parties:** Wikipedia's [2022 Gujarat Legislative Assembly election](https://en.wikipedia.org/wiki/2022_Gujarat_Legislative_Assembly_election#Results_by_constituency)
  article, "Results by constituency" table, as of 2026-11-17. BJP 156, INC 17, AAP 5, independents 3, SP 1.
  This is the latest Gujarat assembly election.
- **Alliances:** no significant pre-poll alliances, so the Alliance column is the party: **BJP** 156, **INC** 17, **AAP** 5, **Others** 4 (three independents, SP).
- **Locations:** approximate. The coordinates on each constituency's own
  Wikipedia article (174 of 182), cross-checked against
  OpenStreetMap (Nominatim) and against the median of each district's
  other seats. Where the two disagreed by more than 20 km, the one in the
  right place was kept. Kadi, Limbdi, Dhrangadhra, Junagadh (the article's point was in Madhya Pradesh), Mehmedabad, Varachha Road and Dharampur were corrected that way; Karanj was set by hand. Good enough for "what's the weather
  like there," not for drawing boundaries.
- **Altitude:** Open-Meteo's elevation API at those coordinates.

## Files

- **`seats.json`**: the static list (`no`, `constituency`, `district`,
  `winner`, `party`, `alliance`, `lat`, `lon`, `altitudeMeters`).
- **`weatherData.json`**: generated snapshot, `{ generatedAt, byNo }`.
  Refresh it from the `assemblyWeather` folder (about 3.4 minutes):
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/assemblyWeather
  node shared/scrapeWeather.js gujaratAssembly
  ```
- **`gujaratAssembly.html`**: thin shell. Sets `window.ASSEMBLY` (storage key
  `gujaratAssemblyWeather`, alliance colours) and loads the shared CSS and
  `../shared/assembly.js`.

Everything else (columns, Get current weather, the per-row ↻ with its
▲/▼ change, Compare, filters, phone sorting and cards) works exactly as on
the Kerala page; see its README.
