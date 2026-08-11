# Southern Hemisphere Weather

A table of every sovereign country whose **capital** sits south of the
equator (latitude < 0), with each capital's current weather. Bolted onto
the Weather.JS site, no build step, no framework.

Play it at [`southernHemisphere.html`](./southernHemisphere.html), linked
from both the main [Weather.JS](../index.html) page and
[GeoStreak](../weatherGame/geoStreakGame.html).

## Why "capital is south of the equator" and not "country is in the south"

A handful of countries straddle the equator (Indonesia, Kenya's neighbours,
etc.), so "is this country in the southern hemisphere" is genuinely
ambiguous for some of them. Since the whole point of this page is a
per-city weather reading, the unambiguous and directly useful rule is: does
*the capital itself* sit south of the equator. That's why Indonesia
(capital Jakarta, ~6°S) is in the list even though the country's northern
islands cross into the northern hemisphere.

## Files

- **`countries.json`** — the static list: `country`, `iso2`, `capital`,
  `lat`, `lon` for 38 countries. The source of truth for which countries
  appear; edit this to add/remove one.
- **`scrapeWeather.js`** — a **Node script you run by hand**, not code the
  browser ever loads. Fetches current weather for every country in
  `countries.json` from the same OpenWeatherMap endpoint/key `../fetch.js`
  uses, keyed by lat/lon (not the capital's name — a name OpenWeather can't
  resolve cleanly, e.g. "Nuku'alofa", can't silently 404 that way), and
  writes the result to `weatherData.json`.
  ```
  cd FPL/vannilaWeatherApp/southernHemisphere
  node scrapeWeather.js
  ```
  Requests are spaced 1.1s apart to stay under OpenWeather's free-tier
  60-calls/minute limit — a full run takes about 45 seconds. If a
  particular country's request fails, that country keeps its data from the
  previous run rather than the row going blank.
- **`weatherData.json`** — generated output, `{ generatedAt, byIso2 }`.
  Stores raw numbers (UTC epoch seconds for sunrise/sunset, a timezone
  offset, day-length in seconds) rather than pre-formatted strings —
  `app.js` does the formatting, the same way `ui.js` formats raw API data
  for the main app. Not committed by a hook or CI job; someone re-runs the
  scraper and commits the refreshed file by hand. This means the weather
  columns are a **snapshot**, stale by however long it's been since the
  last run — the page says how stale via the "Weather snapshot from …
  ago" line.
- **`app.js`** — fetches `countries.json` and `weatherData.json`, joins
  them on `iso2`, and renders the table (Country, Capital, Flag, Map,
  Current Temp, Local Time, Sunrise, Sunset, Day Length). If
  `weatherData.json` is missing entirely (scraper never run) the weather
  columns render as "—" rather than failing the page.
- **`southernHemisphere.html`** / **`style.css`** — thin shell + the same
  dark "station console" look GeoStreak uses, for visual consistency
  across the site.

## Map column

Each row's Map cell links straight to a Google Maps search for that
capital's coordinates (`lat, lon`), the same `?api=1&query=lat,lon` pattern
`ui.js` uses for the main app's coordinates link.

## Sorting

Every column except Flag is sortable — click a header to sort by it
ascending, click again for descending (an ▲/▼ marks the active column).
Rows with no weather on record yet always sort to the bottom, in either
direction, rather than colliding with real zero values. Local Time,
Sunrise and Sunset sort as plain `HH:MM:SS` local-clock-face strings (each
row is a different timezone, so this answers "whose local clock reads
earliest right now/at sunrise/at sunset", not a UTC-normalised sort).

## Local Time is the one live column

Every other weather column is a snapshot from the last scrape, but
**Local Time** ticks for real: it's derived from the browser's own clock
plus each country's stored timezone offset (`nowAtLocation()`, same trick
`ui.js`'s live clock uses for the main app), refreshed every second by one
shared `setInterval` for all 38 rows — not 38 separate timers. It survives
re-sorting, refreshing and toggling Compare because the interval re-queries
the DOM fresh on every tick instead of holding onto element references.

## Refresh button (client-side re-scrape)

A page running in the browser can't invoke `scrapeWeather.js` — that's a
Node script with filesystem access, and a browser has no way to shell out
to one. The **Refresh** button is the client-side equivalent instead: it
calls the same OpenWeatherMap endpoint/key directly from `app.js`, once per
country, spaced 1.1s apart like the Node script. A status line tracks
progress ("Refreshing… 14/38 (Kenya)"); a country whose request fails
during the run keeps whatever value it already had rather than the row
blanking out.

Refresh **never touches `weatherData.json`** — that file only changes when
someone hand-runs `scrapeWeather.js` and commits the result. What Refresh
*does* change is `localStorage`, in two keys:

| Key | Holds |
| --- | --- |
| `southernHemisphereWeather_lastRun` | The data currently on screen |
| `southernHemisphereWeather_previousRun` | Whatever was on screen right before the most recent Refresh |

On page load, `lastRun` (if present) is preferred over `weatherData.json`
as the starting snapshot, since a Refresh in this browser is newer than
whatever was last committed.

## Compare button

Toggles a diff view on the **Current Temp** and **Day Length** columns —
the two figures actually worth comparing run-to-run (Sunrise/Sunset drift
by seconds a day and aren't very interesting; Local Time is already live).
Each cell gets a ▲/▼ chip with the signed difference from
`previousRun` — colour marks direction only (green = increased, red =
decreased), not "good" vs "bad", since a longer day isn't better than a
shorter one, just different.

Disabled until a `previousRun` exists — i.e. until Refresh has been
clicked at least once in this browser, since that's what creates something
to compare the current snapshot against.

## Not in this version

- No automatic re-scraping (no cron/CI job, no serverless function) — the
  free OpenWeather key is meant for occasional manual runs, not scheduled
  ones, and this project has no backend to run a scheduler on anyway.
  `scrapeWeather.js` updates the committed baseline; the Refresh button
  updates what one visitor sees, in their own browser only.
- No polar-day/polar-night handling for sunrise/sunset — none of the 38
  capitals here are anywhere near the polar circles, so the edge case
  `ui.js`'s `describeDaylight()` handles for the main app can't come up.
