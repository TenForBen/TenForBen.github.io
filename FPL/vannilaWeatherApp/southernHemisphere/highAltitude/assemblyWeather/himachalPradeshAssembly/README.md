# Himachal Pradesh Assembly

All 68 seats of the **Himachal Pradesh Legislative Assembly**, in official
constituency-number order (Churah = 1 to Kinnaur = 68), each with
its 2022 winner and its current weather. Same page as [Kerala
Assembly](../keralaAssembly/README.md), built from the shared files in
[`../shared/`](../shared/).

Open it at [`himachalPradeshAssembly.html`](./himachalPradeshAssembly.html).

## Where the data came from

- **Seats, districts, winners, parties:** Wikipedia's [2022 Himachal Pradesh Legislative Assembly election](https://en.wikipedia.org/wiki/2022_Himachal_Pradesh_Legislative_Assembly_election#Results_by_constituency)
  article, "Results by constituency" table, as of 2026-11-17. INC 40, BJP 25, independents 3.
  This is the latest Himachal Pradesh assembly election.
- **Alliances:** by party: **INC** 40, **BJP** 25, **Others** (independents) 3.
- **Locations:** approximate. The coordinates on each constituency's own
  Wikipedia article (57 of 68), cross-checked against
  OpenStreetMap (Nominatim) and against the median of each district's
  other seats. Where the two disagreed by more than 20 km, the one in the
  right place was kept. Fatehpur, Dharampur and Bhoranj were corrected that way. Several hill seats were set by hand at their main town: Dehra, Nagrota Bagwan, Lahaul and Spiti (Keylong), Kinnaur (Reckong Peo), Darang (Padhar), Rampur (Rampur Bushahr), Sri Naina Deviji and Doon (Baddi). Good enough for "what's the weather
  like there," not for drawing boundaries.
- **Altitude:** Open-Meteo's elevation API at those coordinates.

## Files

- **`seats.json`**: the static list (`no`, `constituency`, `district`,
  `winner`, `party`, `alliance`, `lat`, `lon`, `altitudeMeters`).
- **`weatherData.json`**: generated snapshot, `{ generatedAt, byNo }`.
  Refresh it from the `assemblyWeather` folder (about 1.3 minutes):
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/assemblyWeather
  node shared/scrapeWeather.js himachalPradeshAssembly
  ```
- **`himachalPradeshAssembly.html`**: thin shell. Sets `window.ASSEMBLY` (storage key
  `himachalPradeshAssemblyWeather`, alliance colours) and loads the shared CSS and
  `../shared/assembly.js`.

Everything else (columns, Get current weather, the per-row ↻ with its
▲/▼ change, Compare, filters, phone sorting and cards) works exactly as on
the Kerala page; see its README.
