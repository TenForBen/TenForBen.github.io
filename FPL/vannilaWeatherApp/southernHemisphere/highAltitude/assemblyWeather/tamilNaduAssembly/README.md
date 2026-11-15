# Tamil Nadu Assembly

All 234 seats of the **Tamil Nadu Legislative Assembly**, in official
constituency-number order (Gummidipoondi = 1 to Killiyoor = 234), each with
its 2026 winner and its current weather. Same page as [Kerala
Assembly](../keralaAssembly/README.md), built from the shared files in
[`../shared/`](../shared/).

Open it at [`tamilNaduAssembly.html`](./tamilNaduAssembly.html).

## Where the data came from

- **Seats, districts, winners, parties:** Wikipedia's [2026 Tamil Nadu Legislative Assembly election](https://en.wikipedia.org/wiki/2026_Tamil_Nadu_Legislative_Assembly_election#Results_by_constituency)
  article, "Results by constituency" table, as of 2026-11-15. TVK 108, DMK 59, AIADMK 47, INC 5, PMK 4, IUML / CPI / VCK / CPI(M) 2 each, BJP / DMDK / AMMK 1 each.
- **Alliances:** pre-poll alliances, from the same article. **TVK** (contested alone) 108; **SPA**, the DMK-led Secular Progressive Alliance (DMK, INC, IUML, CPI, VCK, CPI(M), DMDK) 73; **AIADMK+** (AIADMK, PMK, BJP, AMMK) 53. MDMK candidates stood on the DMK symbol and are recorded as DMK.
- **Locations:** approximate. Mostly the coordinates on each
  constituency's own Wikipedia article (223 of 234), each
  cross-checked against OpenStreetMap (Nominatim) and against the median
  of its district's other seats. Where the two sources disagreed by more
  than 20 km, the one that's actually in the right district was kept;
  Kolathur, Thiyagarayanagar (T. Nagar), Sholinganallur, Chepauk-Thiruvallikeni, Cheyyur, Attur, Kavundampalayam, Kulithalai, Papanasam and Alangudi were corrected that way or set by hand. Good enough for "what's the weather like there," not for
  drawing boundaries.
- **Altitude:** Open-Meteo's elevation API at those coordinates.

## Files

- **`seats.json`**: the static list (`no`, `constituency`, `district`,
  `winner`, `party`, `alliance`, `lat`, `lon`, `altitudeMeters`).
- **`weatherData.json`**: generated snapshot, `{ generatedAt, byNo }`.
  Refresh it from the `assemblyWeather` folder (about 4.5 minutes):
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/assemblyWeather
  node shared/scrapeWeather.js tamilNaduAssembly
  ```
- **`tamilNaduAssembly.html`**: thin shell. Sets `window.ASSEMBLY` (storage key
  `tamilNaduAssemblyWeather`, alliance colours) and loads the shared CSS and
  `../shared/assembly.js`.

Everything else (columns, Get current weather, Compare, filters, mobile
cards) works exactly as on the Kerala page; see its README.
