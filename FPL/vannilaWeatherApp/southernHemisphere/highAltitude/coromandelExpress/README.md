# Coromandel Express

Every stop of trains 12841/12842 **Coromandel Express** (Howrah &harr;
MGR Chennai Central), in route order, each with its current weather —
same idea as [Mangala Lakshadweep
Express](../mangalaExpress/mangalaExpress.html), one folder over, minus
the temperature watch (that was specific to Koyilandi on that route, not
a general feature this one needs). Linked from High Altitude's header.

Play it at [`coromandelExpress.html`](./coromandelExpress.html).

## Where the stop list came from

Wikipedia's [Coromandel
Express](https://en.wikipedia.org/wiki/Coromandel_Express) article — all
16 stations it lists, Howrah to Chennai. Coordinates and altitude are
approximate (the station's town/city centre, to the nearest few metres of
elevation), not surveyed platform-level GPS — same caveat as [Mangala
Lakshadweep Express's
README](../mangalaExpress/README.md#where-the-stop-list-came-from).

## Files

Identical shape to `../mangalaExpress/`, minus the watch: `stops.json`
(`order`, `station`, `state`, `iso2`, `lat`, `lon`, `altitudeMeters` for
16 stops — no `watch` field on any of them), `scrapeWeather.js`
(hand-run or workflow-run, writes `weatherData.json` keyed by `order`),
`app.js` (fetches both, renders table + mobile cards), and this thin
`coromandelExpress.html` shell, which loads `../../style.css` then
`../style.css` (High Altitude's table/card layout, reused as-is) — no
extra stylesheet of its own, since there's no watch highlight to style.

```
cd FPL/vannilaWeatherApp/southernHemisphere/highAltitude/coromandelExpress
node scrapeWeather.js
```

## Columns

Flag, Station, State, Altitude, Map, Current Temp, Local Time, Sunrise,
Sunset, Day Length — the same ten as Mangala Lakshadweep Express and
High Altitude Cities. Sorting, Refresh, and Compare work exactly as
described in [`../README.md`](../README.md) — same buttons, same
localStorage keys pattern (`coromandelExpressWeather_lastRun` /
`_previousRun`).

Default sort is **route order** (Howrah first), same reasoning as Mangala
Lakshadweep Express: this is a journey, not a ranking.

## Scheduled scrape

`.github/workflows/scrape-coromandel-express-weather.yml` runs **every 12
hours**, same cadence as the Southern Hemisphere weather workflow — there's
no threshold to watch here the way Mangala Lakshadweep Express's hourly
schedule exists for Koyilandi, so there's no reason for a tighter
interval than "keep it reasonably fresh."

## Mobile layout

Identical mechanism to [High Altitude Cities'](../README.md#mobile-layout)
— below 720px wide, the table becomes a card per stop, same breakpoint,
same CSS, same `openCards` survive-a-re-render behaviour, keyed by
`order`.
