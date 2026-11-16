# Andhra Pradesh Assembly

All 175 seats of the **Andhra Pradesh Legislative Assembly**, in official
constituency-number order (Ichchapuram = 1 to Kuppam = 175), each with
its 2024 winner and its current weather. Same page as [Kerala
Assembly](../keralaAssembly/README.md), built from the shared files in
[`../shared/`](../shared/).

Open it at [`andhraPradeshAssembly.html`](./andhraPradeshAssembly.html).

## Where the data came from

- **Seats, districts, winners, parties:** Wikipedia's [2024 Andhra Pradesh Legislative Assembly election](https://en.wikipedia.org/wiki/2024_Andhra_Pradesh_Legislative_Assembly_election#Results_by_constituency)
  article, "Results by constituency" table, as of 2026-11-16. TDP 135, JSP 21, YSRCP 11, BJP 8.
  This is the latest Andhra Pradesh assembly election.
- **Alliances:** **NDA** (TDP, Janasena, BJP; the "Kutami") 164; **YSRCP** 11.
- **Locations:** approximate. The coordinates on each constituency's own
  Wikipedia article (169 of 175), cross-checked against
  OpenStreetMap (Nominatim) and against the median of each district's
  other seats. Where the two disagreed by more than 20 km, the one in the
  right place was kept. Palasa (its article's longitude was 4° off), Amadalavalasa, Pithapuram, Narasapuram, Atmakur (the article pointed at the Kurnool Atmakur, not Nellore's) and Sathyavedu were corrected that way. Good enough for "what's the weather
  like there," not for drawing boundaries.
- **Altitude:** Open-Meteo's elevation API at those coordinates.

## Files

- **`seats.json`**: the static list (`no`, `constituency`, `district`,
  `winner`, `party`, `alliance`, `lat`, `lon`, `altitudeMeters`).
- **`weatherData.json`**: generated snapshot, `{ generatedAt, byNo }`.
  Refresh it from the `assemblyWeather` folder (about 3.2 minutes):
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/assemblyWeather
  node shared/scrapeWeather.js andhraPradeshAssembly
  ```
- **`andhraPradeshAssembly.html`**: thin shell. Sets `window.ASSEMBLY` (storage key
  `andhraPradeshAssemblyWeather`, alliance colours) and loads the shared CSS and
  `../shared/assembly.js`.

Everything else (columns, Get current weather, the per-row ↻, Compare,
filters, mobile cards) works exactly as on the Kerala page; see its README.
