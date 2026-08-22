# The Seasonal Squeeze

Why a tough round's temperature range bends with the calendar, hemisphere by hemisphere.

A tough round (GeoStreak, question 11+) pins a temperature condition to
one hemisphere, unlike a plain round which any city on Earth can satisfy.
That's a problem for a fixed **10–30°C** range: in southern winter,
almost nothing south of the equator reads `ABOVE 30°C` outside a handful
of deep-tropical cities. `toughThresholdRange()` in
[`../app.js`](../app.js) now narrows whichever end of the range is
fighting its own hemisphere's season, and widens back out the moment it
isn't.

## Decision path

```mermaid
flowchart TD
  A["New tough round<br/>hemisphere + direction picked"] --> B{"This hemisphere's<br/>current season?"}
  B -->|"own winter"| C{"direction?"}
  B -->|"own summer"| D{"direction?"}
  B -->|"shoulder<br/>Mar&ndash;May &middot; Sep&ndash;Nov"| E["full range<br/>10&ndash;30&deg;C"]

  C -->|"ABOVE"| F["squeeze ceiling<br/>30&deg;C &rarr; 27&deg;C"]
  C -->|"BELOW"| G["full range<br/>10&ndash;30&deg;C"]

  D -->|"BELOW"| H["squeeze floor<br/>10&deg;C &rarr; 13&deg;C"]
  D -->|"ABOVE"| I["full range<br/>10&ndash;30&deg;C"]

  classDef entry fill:#0a1226,stroke:#2c3d63,color:#f2f7ff,stroke-width:1px;
  classDef season fill:#0a1226,stroke:#2c3d63,color:#7dd3fc,stroke-width:1.5px;
  classDef cool fill:#12233f,stroke:#7dd3fc,color:#eaf7ff,stroke-width:2px;
  classDef warm fill:#2a2110,stroke:#f0b429,color:#fff2d6,stroke-width:2px;
  classDef full fill:#0c1630,stroke:#1b2a4a,color:#9db4de,stroke-width:1px;

  class A entry
  class B,C,D season
  class F cool
  class H warm
  class E,G,I full
```

A round's hemisphere and direction are picked first; only then does the
current month narrow the range — and only on the combination that's
actually hard to satisfy this season.

- 🟦 **ceiling squeezed** — this hemisphere's own winter, direction ABOVE
- 🟨 **floor squeezed** — this hemisphere's own summer, direction BELOW
- ⬛ **full 10–30°C range** — every other combination, including both
  hemispheres during the Mar–May / Sep–Nov shoulder months

## Worked months

| Month | Northern · ABOVE | Northern · BELOW | Southern · ABOVE | Southern · BELOW |
|---|---|---|---|---|
| **April** (shoulder season) | 10–30°C | 10–30°C | 10–30°C | 10–30°C |
| **August** (N summer, S winter) | 10–30°C | **13–30°C** | **10–27°C** | 10–30°C |
| **December** (N winter, S summer) | **10–27°C** | 10–30°C | 10–30°C | **13–30°C** |

## Constants in play

| | |
|---|---|
| Base range | 10–30°C |
| Squeeze amount | 3°C |
| Northern summer window | Jun–Aug |
| Northern winter window | Dec–Feb |

Implemented in `toughThresholdRange()`, `FPL/vannilaWeatherApp/app.js` —
fixed 3-month meteorological blocks off the visitor's local calendar
month, not solstice-exact dates.
