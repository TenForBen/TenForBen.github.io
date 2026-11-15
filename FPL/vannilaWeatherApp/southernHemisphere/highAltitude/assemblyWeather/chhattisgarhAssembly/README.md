# Chhattisgarh Assembly

All 90 seats of the **Chhattisgarh Legislative Assembly**, in official
constituency-number order (Bharatpur-Sonhat = 1 to Konta = 90), each with
its 2023 winner and its current weather. Same page as [Kerala
Assembly](../keralaAssembly/README.md), built from the shared files in
[`../shared/`](../shared/).

Open it at [`chhattisgarhAssembly.html`](./chhattisgarhAssembly.html).

## Where the data came from

- **Seats, districts, winners, parties:** Wikipedia's [2023 Chhattisgarh Legislative Assembly election](https://en.wikipedia.org/wiki/2023_Chhattisgarh_Legislative_Assembly_election#Results_by_constituency)
  article, "Results by constituency" table, as of 2026-11-15. BJP 54, INC 35, GGP 1. This is the latest Chhattisgarh election; the next is due in 2028.
- **Alliances:** none of note in 2023, so the Alliance column (and its filter chips) is simply the party: **BJP**, **INC**, **GGP** (Gondwana Ganatantra Party).
- **Locations:** approximate. Mostly the coordinates on each
  constituency's own Wikipedia article (85 of 90), each
  cross-checked against OpenStreetMap (Nominatim) and against the median
  of its district's other seats. Where the two sources disagreed by more
  than 20 km, the one that's actually in the right district was kept;
  Bhatgaon, Premnagar, Jashpur, Kanker and Narayanpur were corrected that way or set by hand. Good enough for "what's the weather like there," not for
  drawing boundaries.
- **Altitude:** Open-Meteo's elevation API at those coordinates.

## Files

- **`seats.json`**: the static list (`no`, `constituency`, `district`,
  `winner`, `party`, `alliance`, `lat`, `lon`, `altitudeMeters`).
- **`weatherData.json`**: generated snapshot, `{ generatedAt, byNo }`.
  Refresh it from the `assemblyWeather` folder (about 1.7 minutes):
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/assemblyWeather
  node shared/scrapeWeather.js chhattisgarhAssembly
  ```
- **`chhattisgarhAssembly.html`**: thin shell. Sets `window.ASSEMBLY` (storage key
  `chhattisgarhAssemblyWeather`, alliance colours) and loads the shared CSS and
  `../shared/assembly.js`.

Everything else (columns, Get current weather, Compare, filters, mobile
cards) works exactly as on the Kerala page; see its README.
