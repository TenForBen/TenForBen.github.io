# GeoStreak

A small vanilla-JS geography/weather guessing game bolted onto the
Weather.JS site. One player, one running streak, no accounts, no build step.

Play it at [`geoStreakGame.html`](./geoStreakGame.html), linked from the
main [Weather.JS](../index.html) page ("GeoStreak" button).

## The loop

1. The app picks a random condition: **above** or **below** a random
   threshold between **5°C and 35°C**. e.g. *"Name a city with current
   temperature below 22°C."*
2. You type **any** place name (free text — no fixed list, no autocomplete)
   and hit Guess (or Enter).
3. The app looks up that place's current temperature via the OpenWeatherMap
   API.
4. **Satisfies the condition** → streak +1, a new condition is generated,
   the 20s timer resets, loop continues.
5. **Doesn't satisfy it** → game over, final streak shown.
6. **Not found** (typo, made-up place, API error) → a "Nothing found for
   '\<x>'. Try another city." hint, with **no penalty** — the round timer
   keeps running and you can try again.
7. **Timer hits 0** before you answer → game over, labeled "Time's Up!"
   (as opposed to "Game Over" for a wrong guess).

## Round timer

Each round gives you **20 seconds**. It's shown live below the input,
turning amber under 10s and red under 5s. A guess still in flight when the
timer expires is discarded when it resolves — it can't retroactively revive
a round that already ended.

## High score

Current streak and **High Score** are both shown in stat boxes at the top
of the page at all times, visible before you've even answered the first
question. High score persists via `localStorage["geoStreakGame_highScore"]`
and pulses when the current streak overtakes it.

## Architecture

No frameworks, no build step — plugs into the same three files the main
weather app uses, guarded so each only runs on the page that has its
elements:

- **`../fetch.js`** — `Fetch.getCurrentForGame(cityName)` wraps the same
  `getCurrent()` the main app uses, bounded to a 5s timeout, returning
  `null` (never throwing) on any failure — city not found, timeout,
  offline — so the caller can show a plain "nothing found" message.
- **`../ui.js`** — the main app's card template was extracted into
  `buildWeatherCardHtml()` / `applyCardStyling()`, reused as-is by
  `renderGameCard()` for the result reveal (a "CORRECT"/"INCORRECT" stamp
  on top of the same card look as the main app), plus small render helpers:
  `renderGameCondition`, `updateStreakDisplay`, `updateHighScoreDisplay`
  (with pulse), `updateTimerDisplay`, `renderGameOver` (win/loss vs.
  timeout heading).
- **`../app.js`** — `initGeoStreak()` holds all game state (streak, high
  score, current condition, round timer, a `roundId` guard against
  stale in-flight guesses) and orchestrates the loop. Guarded on
  `#geoStreakRoot` so loading this file on the main app's `index.html`
  (which has no such element) doesn't run any of it.
- **`geoStreakGame.html`** — thin shell: markup + the dark "station
  console" styling only. No game logic lives here.

## Visual design

Dark "weather station console" theme — deep navy background, a small
radar-sweep animation in the header, monospace stat readouts — distinct
from the main app's light Bootstrap look. The result-reveal card is the
one exception: it deliberately **reuses** the main app's own light card
component (city name, flag, coordinates, temperature, conditions) so a
guess result still looks like a Weather.JS reading, just stamped
CORRECT/INCORRECT in the corner.

## Notably *not* in this version

- No hardcoded city pool, no suggestion chips, no simulated/offline
  fallback reading. An earlier draft had all three; free-text guessing
  made the fallback (which needed known coordinates) inapplicable, so a
  failed lookup is just "nothing found" rather than faked data.
- No `<datalist>` for city suggestions — an earlier version used one and
  its native popup intercepted clicks on the submit button.
- No multi-stage progression, country-alternation rule, or daylight
  questions — just the single above/below loop.
