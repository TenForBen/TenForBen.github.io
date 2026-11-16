# Maharashtra Assembly

All 288 seats of the **Maharashtra Legislative Assembly**, in official
constituency-number order (Akkalkuwa = 1 to Jath = 288), each with
its 2024 winner and its current weather. Same page as [Kerala
Assembly](../keralaAssembly/README.md), built from the shared files in
[`../shared/`](../shared/).

Open it at [`maharashtraAssembly.html`](./maharashtraAssembly.html).

## Where the data came from

- **Seats, districts, winners, parties:** Wikipedia's [2024 Maharashtra Legislative Assembly election](https://en.wikipedia.org/wiki/2024_Maharashtra_Legislative_Assembly_election#Results_by_constituency)
  article, "Results by constituency" table, as of 2026-11-17. BJP 132, Shiv Sena (SHS) 57, NCP 41, Shiv Sena (UBT) 20, INC 16, NCP (SP) 10, SP 2, JSS 2, independents 2, and one each for RSPS, RVSP, RSVA, AIMIM, CPI(M) and PWPI.
  This is the latest Maharashtra assembly election.
- **Alliances:** **Mahayuti** (BJP, SHS, NCP, JSS, RSPS, and the allied RVSP and RSVA) 235; **MVA**, the Maha Vikas Aghadi (SS(UBT), INC, NCP(SP), SP, CPI(M), PWPI) 50; **Others** (AIMIM, two independents) 3. Matches the article's alliance totals.
- **Locations:** approximate. The coordinates on each constituency's own
  Wikipedia article (272 of 288), cross-checked against
  OpenStreetMap (Nominatim) and against the median of each district's
  other seats. Where the two disagreed by more than 20 km, the one in the
  right place was kept. Akot, Arvi, Belapur (the article pointed at the Ahmednagar Belapur, not Navi Mumbai's), Ghatkopar West, Mumbadevi, Ambegaon and Pandharpur were corrected that way; Shivadi (Sewri) and Khed Alandi (at Rajgurunagar) were set by hand. Good enough for "what's the weather
  like there," not for drawing boundaries.
- **Altitude:** Open-Meteo's elevation API at those coordinates.

## Files

- **`seats.json`**: the static list (`no`, `constituency`, `district`,
  `winner`, `party`, `alliance`, `lat`, `lon`, `altitudeMeters`).
- **`weatherData.json`**: generated snapshot, `{ generatedAt, byNo }`.
  Refresh it from the `assemblyWeather` folder (about 5.3 minutes):
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/assemblyWeather
  node shared/scrapeWeather.js maharashtraAssembly
  ```
- **`maharashtraAssembly.html`**: thin shell. Sets `window.ASSEMBLY` (storage key
  `maharashtraAssemblyWeather`, alliance colours) and loads the shared CSS and
  `../shared/assembly.js`.

Everything else (columns, Get current weather, the per-row ↻ with its
▲/▼ change, Compare, filters, phone sorting and cards) works exactly as on
the Kerala page; see its README.
