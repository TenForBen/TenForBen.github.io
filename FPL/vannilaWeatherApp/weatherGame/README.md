# GeoStreak

A small vanilla-JS geography/weather guessing game bolted onto the
Weather.JS site. One player, one running streak, no accounts, no build step.

Play it at [`geoStreakGame.html`](./geoStreakGame.html), linked from the
main [Weather.JS](../index.html) page ("GeoStreak" button).

## The loop

0. Nothing runs until you press **Start Game** on the opening screen (see
   [Start screen](#start-screen-and-insights) below).
1. The app picks a condition: a threshold between **5°C and 32°C**
   (28 possible values), paired with **above** or **below**. e.g.
   *"Name a city with current temperature below 22°C."* The upper bound is
   capped below 35°C on purpose — real cities clearing 35°C right now are a
   short, narrow list (basically Gulf/Iraq/Iran and US-Southwest desert
   cities), so "above 35" rewards knowing this week's heatwave trivia more
   than general geography. Direction strictly **alternates** round to round
   (starting side randomised once per session) — never two "above"s or two
   "below"s in a row. A given (direction, threshold) question can't repeat
   until every threshold for that direction has been asked at least once
   (28 questions per direction, 56 total this session) — then that
   direction's pool refills and can cycle again. The comparison is
   **inclusive** at the threshold — a reading of exactly 22°C satisfies
   both "above 22°C" and "below 22°C".
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

## Tough rounds (question 11+)

Once you've banked **10 correct answers** in a run, every round from the
11th question on adds a **hemisphere** requirement on top of the
temperature one: *"Name a city in the Northern hemisphere with current
temperature below 18°C."* A guess now has to satisfy **both** parts — right
temperature in the wrong hemisphere (or vice versa) is still a miss.

Tough rounds also narrow the threshold range to **10°C–30°C** (21 possible
values instead of 28) — the extreme ends of the normal range are the easy
giveaways (near-freezing or desert-heat trivia), so tough rounds drop them
to keep both conditions genuinely in play. Direction and hemisphere each
strictly **alternate** round to round, independently, same rule as the
non-tough loop. Tough thresholds have their own per-direction pool (10-30°C)
separate from the normal one (5-32°C), so exhausting one doesn't force an
early refill of the other. Equator (latitude 0) counts as northern.

Once tough mode kicks in for a run, it stays on for the rest of that run —
dropping back below 10 correct never happens, since a wrong guess ends the
run outright.

Each place name can only be used **once per session** (one continuous
streak run) — guessing "Auckland" and then "Auckland" again later in the
same run is rejected with a hint, no penalty, timer keeps running. Checked
case-insensitively and against the API's resolved name too, so "Auckland"
and "auckland,NZ" count as the same entry. The used-city list resets on
Play Again.

## Round timer

Each round gives you **20 seconds**. It's shown live below the condition,
turning amber under 10s and red under 5s. A guess still in flight when the
timer expires is discarded when it resolves — it can't retroactively revive
a round that already ended.

## Result card auto-fade

A correct guess's result card stays up for **~4 seconds**, then fades out
over half a second and clears — so it doesn't linger on screen through the
whole next round. A wrong guess's card (the one that ended the session) is
left alone and stays visible on the Game Over screen. Guarded the same way
as the round timer: if a new result has already replaced this one by the
time the fade would fire, the stale fade-out is a no-op.

A brand-new city — one you've never pulled a reading from before, on this
browser, in any run — briefly **brightens** the card (a 2-second glow) so
the discovery doesn't pass unnoticed under the CORRECT/INCORRECT stamp. See
[City tracking & insights](#city-tracking--insights) below for how "new" is
tracked.

## Game Over screen

Unlike Pause and Start, ending a run doesn't hide the round you were on: the
**last question stays on screen**, right above the Game Over panel and the
result card that ended things, so you can see exactly what you missed (or
ran out of time on). Only the now-irrelevant timer and pause button are
hidden — the search box stays put (see below).

The Game Over panel also shows **unique cities this run** — how many
different real places you pulled a reading from before the run ended
(correct guesses and the one that ended it, not duplicates or not-founds).
This is a per-run count, not the lifetime one below.

## The search box is always there

The city input and its button sit at the top of the page in every state —
before Start Game is ever pressed, mid-round, paused, and after Game
Over — rather than only existing while a round is live. Whether a search
counts as a **guess** depends entirely on whether there's a live round to
judge it against:

- **Live round** → button reads "Guess"; the input is judged against the
  current condition exactly as described above, and affects streak,
  lifetime stats, the country tally, and the used-cities list.
- **No live round** (start screen, paused, game over) → button reads
  "Search"; it's a plain city lookup with **no judging and no side
  effects on any game state** — the same thing typing into the main
  Weather.JS search box would do. The result renders as an unstamped
  card (no CORRECT/INCORRECT) in the same result slot a guess would use.

This means you can look up a city's weather before starting a run, or
between runs, without it costing you a used-city slot or counting toward
your lifetime attempt numbers.

## City tracking & insights

Every judged guess (one that resolved to a real place) is logged against a
lifetime **"City, Country" → attempt count** map in
`localStorage["geoStreakGame_cityCounts"]`, across every run you've ever
played on this browser — separate from the country tally above, which is
per-session only.

Once you've completed **3 runs** (`localStorage["geoStreakGame_gamesPlayed"]`
— bumped whenever a run ends, win condition doesn't exist here, so
"completed" just means "ended"), a **Top Cities** block appears on the
Start, Pause and Game Over panels: your 5 most-attempted cities all-time,
each with its count and share of your total city attempts, e.g.
"🇧🇷 São Paulo — 4× (31%)". Before 3 runs, the block simply doesn't render —
with only a run or two of data, "most used" is just whatever you happened
to type, not a real pattern.

## Country tally

A running "🇧🇷 BR ×2 | 🇦🇷 AR ×1" breakdown under the stat boxes, one entry
per country you've pulled a real reading from this session — correct or
not, since even the guess that ends your streak still counts. Resets on
Play Again along with everything else session-scoped.

## High score

Current streak and **High Score** are both shown in stat boxes at the top
of the page at all times, visible before you've even answered the first
question. High score persists via `localStorage["geoStreakGame_highScore"]`
and pulses when the current streak overtakes it.

## Start screen and insights

The page opens on a **Start Game** panel — no question is generated and no
timer runs until you press it. The button sits right under the rules, right
below the search box; your all-time numbers are deliberately **not** in this
panel — see below for where they live.

| Insight | Source |
| --- | --- |
| **Best streak** | `localStorage["geoStreakGame_highScore"]` |
| **Correct** | `localStorage["geoStreakGame_totalCorrect"]` |
| **Attempts** | `localStorage["geoStreakGame_totalAttempts"]` |
| **Accuracy** | derived — correct ÷ attempts, never stored |
| **Top Cities** (once eligible) | derived from `localStorage["geoStreakGame_cityCounts"]`, gated on `localStorage["geoStreakGame_gamesPlayed"]` |

An **attempt** is a guess that resolved to a real place and got judged.
A lookup that found nothing, a city already used this session, and a round
that simply timed out are *not* attempts — so accuracy measures geography
rather than typing. Accuracy is computed at render time rather than stored,
so it can't drift out of step with the two counters behind it.

These numbers render into their own block, **below the result card**,
whenever the start, pause or game-over panel is showing (hidden during an
active round). Keeping them out of those panels means the primary action
button — Start Game, Resume, Play Again — is never buried under a wall of
stats and a top-5 city list; the result card from your last guess or search
gets the prime spot instead. All of the numbers are lifetime and
browser-local: they survive Play Again, and only the streak, used cities
and country tally reset with a new run.

## Pause

A **PAUSE** button sits next to the round timer, but it doesn't stop the
clock on the round you're in — that would be an unlimited thinking-time
button. Clicking it *arms* a pause (the button turns amber and reads
"PAUSING AFTER THIS ONE"), and the pause only lands once the current attempt
is settled with a correct answer. Clicking again before then calls it off.

While armed, the round plays out normally: the timer keeps running, and a
not-found or duplicate-city guess leaves the pause armed and the round
going. If the run ends first — wrong guess or timeout — the pause is dropped
along with it and you go straight to Game Over.

The pause screen shows your live streak plus the insight panel, and keeps
the last result card visible below it. Resume clears that card and deals a
fresh question with a full 20 seconds.

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
  (with pulse), `updateTimerDisplay`, `updateCountryTally`,
  `updatePauseButton`, the three compact panel renderers —
  `renderStartScreen`, `renderPauseScreen`, `renderGameOver` (win/loss vs.
  timeout heading) — and `renderInsights`, the shared numbers block those
  three panels used to embed directly but now render separately (below the
  result card) via one `buildInsightsHtml()` and one
  `buildCityInsightsHtml()`, so the numbers can't be formatted four
  different ways.
- **`../app.js`** — `initGeoStreak()` holds all game state (streak, high
  score, lifetime counters, lifetime per-city log, current condition, round
  timer, pause state, and a `roundId` guard against stale in-flight guesses)
  and orchestrates the loop. Guarded on `#geoStreakRoot` so loading this file
  on the main app's `index.html` (which has no such element) doesn't run any
  of it.
- **`geoStreakGame.html`** — thin shell: markup + the dark "station
  console" styling only. No game logic lives here. Of the four screens only
  the play area is static markup; start, pause and game-over are rendered
  into empty containers, so their buttons are wired by delegating clicks
  from the container rather than binding elements that get replaced.

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
- No country-alternation rule or daylight questions — the only
  progression is the question-11 hemisphere twist above.
