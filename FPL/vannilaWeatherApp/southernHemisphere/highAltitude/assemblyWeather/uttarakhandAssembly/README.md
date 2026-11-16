# Uttarakhand Assembly

All 70 seats of the **Uttarakhand Legislative Assembly**, in official
constituency-number order (Purola = 1 to Khatima = 70), each with
its 2022 winner and its current weather. Same page as [Kerala
Assembly](../keralaAssembly/README.md), built from the shared files in
[`../shared/`](../shared/).

Open it at [`uttarakhandAssembly.html`](./uttarakhandAssembly.html).

## Where the data came from

- **Seats, districts, winners, parties:** Wikipedia's [2022 Uttarakhand Legislative Assembly election](https://en.wikipedia.org/wiki/2022_Uttarakhand_Legislative_Assembly_election#Results_by_constituency)
  article, "Results by constituency" table, as of 2026-11-17. BJP 47, INC 19, BSP 2, independents 2.
  This is the latest Uttarakhand assembly election.
- **Alliances:** by party: **BJP** 47, **INC** 19, **Others** (BSP 2, independents 2) 4.
- **Locations:** approximate. The coordinates on each constituency's own
  Wikipedia article (67 of 70), cross-checked against
  OpenStreetMap (Nominatim) and against the median of each district's
  other seats. Where the two disagreed by more than 20 km, the one in the
  right place was kept. Raipur and Chaubattakhal were corrected that way, and Dharampur (part of Dehradun city) was set by hand. Kedarnath, Gangotri, Yamunotri and Badrinath sit at their temple towns, 3,100–3,600 m up. Good enough for "what's the weather
  like there," not for drawing boundaries.
- **Altitude:** Open-Meteo's elevation API at those coordinates.

## Files

- **`seats.json`**: the static list (`no`, `constituency`, `district`,
  `winner`, `party`, `alliance`, `lat`, `lon`, `altitudeMeters`).
- **`weatherData.json`**: generated snapshot, `{ generatedAt, byNo }`.
  Refresh it from the `assemblyWeather` folder (about 1.3 minutes):
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/assemblyWeather
  node shared/scrapeWeather.js uttarakhandAssembly
  ```
- **`uttarakhandAssembly.html`**: thin shell. Sets `window.ASSEMBLY` (storage key
  `uttarakhandAssemblyWeather`, alliance colours) and loads the shared CSS and
  `../shared/assembly.js`.

Everything else (columns, Get current weather, the per-row ↻ with its
▲/▼ change, Compare, filters, phone sorting and cards) works exactly as on
the Kerala page; see its README.
