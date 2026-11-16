# Karnataka Assembly

All 224 seats of the **Karnataka Legislative Assembly**, in official
constituency-number order (Nippani = 1 to Gundlupet = 224), each with
its 2023 winner and its current weather. Same page as [Kerala
Assembly](../keralaAssembly/README.md), built from the shared files in
[`../shared/`](../shared/).

Open it at [`karnatakaAssembly.html`](./karnatakaAssembly.html).

## Where the data came from

- **Seats, districts, winners, parties:** Wikipedia's [2023 Karnataka Legislative Assembly election](https://en.wikipedia.org/wiki/2023_Karnataka_Legislative_Assembly_election#Results_by_constituency)
  article, "Results by constituency" table, as of 2026-11-16. INC 135, BJP 66, JD(S) 19, independents 2, and one each for KRPP (Kalyana Rajya Pragathi Paksha) and SKP (Sarvodaya Karnataka Paksha).
  This is the latest Karnataka assembly election.
- **Alliances:** no significant pre-poll alliances in 2023, so the Alliance column is the party: **INC** 135, **BJP** 66, **JD(S)** 19, **Others** 4 (two independents, KRPP, SKP).
- **Locations:** approximate. The coordinates on each constituency's own
  Wikipedia article (223 of 224), cross-checked against
  OpenStreetMap (Nominatim) and against the median of each district's
  other seats. Where the two disagreed by more than 20 km, the one in the
  right place was kept. Only Srinivaspur needed correcting (its article pointed about 100 km west). Where OpenStreetMap disagreed elsewhere, it had matched shops or roads named after the town ("Davanagere Benne Dosa" in Bangalore, "Mangalore Stores"), so Wikipedia's point was kept. Good enough for "what's the weather
  like there," not for drawing boundaries.
- **Altitude:** Open-Meteo's elevation API at those coordinates.

## Files

- **`seats.json`**: the static list (`no`, `constituency`, `district`,
  `winner`, `party`, `alliance`, `lat`, `lon`, `altitudeMeters`).
- **`weatherData.json`**: generated snapshot, `{ generatedAt, byNo }`.
  Refresh it from the `assemblyWeather` folder (about 4.2 minutes):
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/assemblyWeather
  node shared/scrapeWeather.js karnatakaAssembly
  ```
- **`karnatakaAssembly.html`**: thin shell. Sets `window.ASSEMBLY` (storage key
  `karnatakaAssemblyWeather`, alliance colours) and loads the shared CSS and
  `../shared/assembly.js`.

Everything else (columns, Get current weather, the per-row ↻, Compare,
filters, mobile cards) works exactly as on the Kerala page; see its README.
