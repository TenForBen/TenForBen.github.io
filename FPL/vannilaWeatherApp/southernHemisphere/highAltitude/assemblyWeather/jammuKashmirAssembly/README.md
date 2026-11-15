# Jammu & Kashmir Assembly

All 90 seats of the **Jammu and Kashmir Legislative Assembly**, in official
constituency-number order (Karnah = 1 to Mendhar = 90), each with its 2024
winner and its current weather. Same page as [Kerala
Assembly](../keralaAssembly/README.md), built from the shared files in
[`../shared/`](../shared/).

Open it at [`jammuKashmirAssembly.html`](./jammuKashmirAssembly.html).

## Where the data came from

- **Seats, districts, winners, parties:** Wikipedia's [2024 Jammu and
  Kashmir Legislative Assembly
  election](https://en.wikipedia.org/wiki/2024_Jammu_and_Kashmir_Legislative_Assembly_election#Results_by_constituency)
  article, "Results by constituency" table, as of 2026-11-16. JKNC 42,
  BJP 29, independents 7, INC 6, JKPDP 3, and one each for JKPC, CPI(M)
  and AAP. This is the latest J&K assembly election, the first since the
  2019 reorganisation into a union territory.
- **Alliances:** pre-poll, from the same article. **INDIA** (JKNC, INC,
  CPI(M)) 49; **BJP** 29; **PDP** 3; **Others** (independents, JKPC,
  AAP) 9.
- **Locations:** approximate. Mostly the coordinates on each
  constituency's own Wikipedia article (68 of 90), cross-checked against
  OpenStreetMap (Nominatim) and the median of each district's other
  seats. Where they disagreed, the one in the right place was kept:
  Gulabgarh's article points at the Padder Gulabgarh in Kishtwar rather
  than the Reasi seat, and Dooru's and Eidgah's were off too. Eight seats
  with no usable coordinates were set by hand (Wagoora–Kreeri, DH Pora,
  Anantnag West, Padder–Nagseni, Shri Mata Vaishno Devi at Katra,
  Udhampur West/East, Jammu North). Doda West shares Doda's point. Good
  enough for "what's the weather like there," not for drawing boundaries.
- **Altitude:** Open-Meteo's elevation API at those coordinates. Gurez
  uses a valley point (about 2,470 m); Wikipedia's put it on a slope.

## Files

- **`seats.json`**: the static list (`no`, `constituency`, `district`,
  `winner`, `party`, `alliance`, `lat`, `lon`, `altitudeMeters`).
- **`weatherData.json`**: generated snapshot, `{ generatedAt, byNo }`.
  Refresh it from the `assemblyWeather` folder (about 1.7 minutes):
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/assemblyWeather
  node shared/scrapeWeather.js jammuKashmirAssembly
  ```
- **`jammuKashmirAssembly.html`**: thin shell. Sets `window.ASSEMBLY`
  (storage key `jammuKashmirAssemblyWeather`, alliance colours) and loads
  the shared CSS and `../shared/assembly.js`.

Everything else (columns, Get current weather, the per-row ↻, Compare,
filters, mobile cards) works exactly as on the Kerala page; see its README.
