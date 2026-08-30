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
   both "above 22°C" and "below 22°C" — and judged against the **rounded**
   reading, the same one the result card actually displays, not the raw
   decimal underneath it. A reading of 22.4°C, shown on the card as
   "22°C", counts as exactly 22 rather than failing "below 22°C" on a
   fraction of a degree the player never sees.
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

That 10-30°C range also gets **squeezed by season**, per hemisphere+
direction: a hemisphere in its own winter has its ABOVE ceiling pulled in
3°C (to 27°C) — realistically there aren't many cities on that half of
the planet running hot in their own winter — and a hemisphere in its own
summer gets its BELOW floor pulled up 3°C (to 13°C) for the mirror
reason. The other two combinations (a hemisphere's own summer+ABOVE, its
own winter+BELOW) are already the plentiful case and keep the full range,
as do both hemispheres during the Mar-May / Sep-Nov shoulder months.
Fixed 3-month meteorological blocks off the visitor's local calendar
month (`toughThresholdRange()` in `app.js`), not solstice-exact dates —
this only needs to broadly track which half of the year it is, not
precise transition days. Without this, e.g. "Southern, ABOVE 30°C" in
southern winter (roughly Jun-Aug) was asking for something only a handful
of deep-tropical southern cities could ever satisfy.

Each place can only be used **once per session** (one continuous streak
run) — guessing "Auckland" and then "Auckland" again later in the same run
is rejected with a hint, no penalty, timer keeps running. Checked
case-insensitively and against the API's resolved name too, so "Auckland"
and "auckland,NZ" count as the same entry.

The resolved-name check is keyed on **name + country together**, not the
bare name — OpenWeather's resolved city name alone doesn't disambiguate
same-named cities in different countries (there's a Queenstown in NZ, AU
*and* ZA; a Colón in both AR and CO), so using one used to wrongly block
every other one for the rest of the run. Guessing "Queenstown,NZ" then
later "Queenstown,ZA" in the same run is two different real places and is
allowed; guessing "Queenstown,NZ" twice is still caught as the same one.
The used-city list resets on Play Again.

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

It also shows **distance traveled this run** — the great-circle distance
strung across every guessed city in order, city to city
(`totalRunDistanceKm()` in `app.js`, reusing `haversineKm()` from
`ui.js`). Same figure the History page builds up per round in its
Distance column (see below) — this is just that column's final row,
computed straight from the run in progress rather than a saved one.

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
- **`firebaseConfig.js`** / **`leaderboard.js`** / **`firestore.rules`** —
  the optional online leaderboard and run history (see
  [Leaderboard](#leaderboard) and [Run History](#run-history) above).
  Firebase's compat SDK (loaded via `<script>` tags, matching this
  project's no-bundler style) plus `leaderboard.js` must both come
  *before* `../app.js` in `geoStreakGame.html` — `app.js` calls
  `showStartScreen()` synchronously as soon as it loads, and that needs
  the `Leaderboard` global (and `escapeHtml` from `../ui.js`) to already
  exist.
- **`history.html`** / **`historyPage.js`** — the Run History page,
  covering **both** games (a "GeoStreak"/"Time Quiz" switcher up top —
  see [Leaderboard, Run History & Insights](#leaderboard-run-history--insights)
  under Time Quiz). A separate page load, so it can't reuse
  `leaderboard.js`'s in-memory Firebase state — it does its own minimal
  sign-in + query, self-contained like `southernHemisphere/app.js` (its
  own small `escapeHtml`/`flagEmoji`, rather than loading `../ui.js` for
  just those two functions). Read-only: this page never writes to Firestore.
- **`timeQuiz.html`** / **`timeQuiz.js`** / **`timeQuizLeaderboard.js`** —
  Time Quiz itself, and its own leaderboard/run-history/insights module
  (see [Time Quiz](#time-quiz) below). Same `firebaseConfig.js` /
  `firestore.rules` as GeoStreak — one Firebase project, both games.
- **`checklist/`** — not GeoStreak, not a game at all. A separate personal
  daily habit tracker, currently `localStorage`-only with a Firebase
  upgrade (reusing this same project) planned next — see
  [`checklist/README.md`](./checklist/README.md).

## Leaderboard

An optional, **entirely client-judged** online leaderboard, backed by
Firebase Firestore on the free Spark plan. "Client-judged" is the
important qualifier: correct/incorrect is still decided in the browser
exactly as described above, and only the final streak gets shared — so
this is gameable via devtools the same way hand-editing `localStorage`
already was. It's a real shared leaderboard for a casual personal project,
not an anti-cheat system. See [Why not fully secure](#why-not-fully-secure)
below for what closing that gap would actually take.

### Setup (one-time, per Firebase project)

1. **Create a project** at [console.firebase.google.com](https://console.firebase.google.com/) — free, no credit card (Spark plan).
2. **Enable Firestore**: Build -> Firestore Database -> Create database -> start in **production mode** (the rules below replace the default-deny anyway) -> pick any region.
3. **Enable Anonymous sign-in**: Build -> Authentication -> Get started -> Sign-in method -> Anonymous -> Enable. This is what gives each browser a stable identity with zero login UI — no email, no password, nothing the player has to do.
4. **Register a web app**: Project settings (gear icon) -> General -> "Your apps" -> the `</>` (web) icon -> register it (a nickname is enough, no hosting setup needed) -> copy the `firebaseConfig` object it shows you.
5. **Paste that config into [`firebaseConfig.js`](./firebaseConfig.js)**, replacing the six `REPLACE_ME` placeholders. These values are not secret (see the comment at the top of that file for why) — access control is entirely the rules file's job, not this object's.
6. **Publish the security rules**: Firestore Database -> Rules tab -> replace the contents with [`firestore.rules`](./firestore.rules) -> Publish.

That's it — no CLI, no `firebase login`, no deploy step. Until step 5 is
done, `leaderboard.js` detects the placeholder and the panel just shows
"Leaderboard not configured yet" — the rest of GeoStreak is completely
unaffected either way.

### Data model

One Firestore document per player, in the `geostreakLeaderboard`
collection, keyed by their anonymous-auth uid:

```
{ nickname: "Player4492", bestStreak: 22, totalCorrect: 125, totalAttempts: 139, totalRuns: 31, updatedAt: <server timestamp> }
```

The ranked list itself shows **# · Name · Str (highest streak) · Runs ·
Cor (total correct) · Avg** — `Avg` is `totalCorrect / totalRuns`
(correct guesses per run, not per round — a different number from the
old accuracy-by-round % this column replaced), computed client-side in
`renderRow()`, not stored. All three of `totalCorrect`/`totalAttempts`/
`totalRuns` come straight from `app.js`'s own lifetime, this-browser
counters (the same numbers the Insights panel's "ALL-TIME, THIS BROWSER"
row already shows) — nothing new is tracked locally for this, they just
weren't being sent to Firestore before.

**These three only update alongside a new personal best** — same
limitation `totalCorrect`/`totalAttempts` already had, now extended to
`totalRuns` too, since all of them ride on `submitScore()`, which only
fires (and which `firestore.rules`' `bestStreak > resource.data.bestStreak`
gate only accepts) when a run's streak beats this player's stored one. A
player who's played 40 runs since their last personal best still shows
whatever `totalRuns` was *at* that best, not 40 more — the leaderboard
undercounts an active-but-not-currently-improving player's real total.
Decoupling these fields from the streak gate (so every run's end updates
them regardless of whether the streak improved) would need a different
rules shape and isn't built. A row written before this column existed has
none of the three yet — shown as "—", not a misleading 0.

A **nickname** defaults to a random `PlayerNNNN`. Setting one is a
one-time thing: a "Playing as" row above the search box asks for it once,
and disappears for good the moment you hit Save — from then on the name
just sits quietly in the header (highlighted, so it reads as *you*), with
a small "change" link next to it that brings the row back if you ever want
to rename. Stored in `localStorage["geoStreakGame_nickname"]` — its mere
presence there is also how the page tells "never set a name" apart from
"set one, first visit or the hundredth" — and re-sent on every write so
renaming updates future leaderboard rows without needing a migration.

The ranked list itself is a different story — it's hidden while a round is
actually live (same treatment as the local insights panel) and shows
itself automatically on the start, pause and game-over screens. To check
it **mid-round** without pausing, there's a "Show Leaderboard" button next
to Pause — the timer keeps running underneath it; it's a peek, not a
break.

**Pagination** kicks in past 10 entries — 10 rows per page, with Prev/Next
controls that only render at all once there's actually a second page to go
to. Firestore has no cheap "give me page N" or row-count query, so each
page fetch asks for 11 rows instead of 10 purely to learn whether a Next
page exists, and "Prev" is answered by remembering the cursor for each
page already seen this panel-open rather than re-deriving it — paging
backward through cursors you've already walked, not a fresh reverse query.
Reopening the panel (leaving and coming back to a non-playing screen)
always starts back on page 1, since the ranking can easily have changed
since you last looked and trying to preserve a page position across that
isn't worth the complexity.

### Overall vs Today

Two tabs sit above the ranked list. **Overall** is the `geostreakLeaderboard`
collection described above — an all-time personal best per player.
**Today** is a second, separate collection, `geostreakDaily`, one document
per player *per calendar day* (doc id `"{uid}_{date}"`):

```
{ uid: "abc123...", nickname: "Player4492", bestStreak: 6, totalCorrect: 18, totalAttempts: 20, totalRuns: 4, date: "2026-08-16", updatedAt: <server timestamp> }
```

Submitted the same improvement-only way as Overall, to the same doc every
time you finish a run *that day* — a new day just means a new doc id, so
there's nothing to reset or roll over at midnight; yesterday's doc is
simply never written to again. Today tracks the same
`totalCorrect`/`totalAttempts`/`totalRuns` fields Overall does (added
alongside the Runs/Correct/Avg columns above — a doc from before that
has none of them, same "—" fallback as an old Overall row).

**"Today" is Central European time, not the viewer's own timezone** — a
player in Tokyo and one in Toronto should see the same leaderboard, so the
day boundary can't be "whatever midnight means on each visitor's own
clock." The cutoff is computed via `Intl.DateTimeFormat` against the
`Europe/Berlin` IANA zone rather than a hardcoded UTC+2, so it stays
correct across the CET/CEST daylight-saving switch — the same technique
`ui.js`'s `getOffsetSeconds()` already uses for the main app's timezone
math, just applied to a calendar date instead of a clock time.

Today's query — `date == <today>`, ordered by `bestStreak` — combines an
equality filter with an orderBy on a different field, which (like the
History page's `uid == X` query) needs its own **composite index**;
Firestore doesn't build one automatically for that shape of query. Same
one-time fix as History's: load the Today tab once, open the browser
console, follow the "this query requires an index" link it prints (specific
to your project, pre-fills the form), click Create, wait for it to say
Enabled.

A run's final streak is only ever submitted **on Game Over**, and only if
it's positive — a losing run's low number was never a personal best worth
recording. The write is a `set(..., { merge: true })` upsert, not an
append: there's exactly one row per player here, always their personal
best. The full round-by-round record of *every* run — see
[Run History](#run-history) below — lives in a separate collection
entirely, written unconditionally.

### Why the rules file is the part that actually matters

Anyone can read the leaderboard, but a write is only accepted if:

- it comes from the signed-in owner of that document (`request.auth.uid == uid`),
- every field is present, the right type, and within sane bounds (nickname ≤ 20 chars, `0 < bestStreak <= 500`, etc.), and
- **on an update, the new `bestStreak` is strictly greater than the one already stored.**

That last check is the one doing real work. Without it, a player could
resubmit a lower number later (say, after a bad run) and silently
overwrite a real personal best — Firestore itself enforces "scores only go
up," so the client doesn't have to be trusted for that specific guarantee,
even though it's still trusted for *what counts as correct* in the first place.

### Why not fully secure

The only way to close the "devtools can just write the score directly"
gap for real is to stop trusting the client for *correctness* too — move
the guess-judging itself into a Cloud Function that calls OpenWeatherMap
server-side and returns a verdict the browser can't fabricate, then only
accept a leaderboard write that references a verdict the function itself
issued. That needs the paid Blaze plan (Cloud Functions require outbound
networking, unavailable on Spark) and is a real rework of the round loop,
not an add-on — deliberately out of scope here in favour of shipping a
working shared leaderboard today.

## Run History

A per-player, per-round log of every run ever played — not just the
headline streak the leaderboard keeps, but every single question asked
and every guess made along the way. Play it at
[`history.html`](./history.html) (linked from GeoStreak's header).

The motivating case: your streak dies at 5 and you want to see all 5
correct guesses plus the one that ended it — not just the final number.
The History page shows exactly that, one card per run, each expandable
into a full round-by-round table (condition, what you guessed, the actual
temperature, CORRECT / INCORRECT / TIMED OUT). Your **Personal Best** run
— the highest `finalStreak` among your recent runs — gets its own
highlighted section up top, pre-expanded, so a new best is always one
click away without hunting through the list.

Each round's **Temp** column is color-highlighted by how close the
reading landed to the threshold it was judged against — independent of
CORRECT/INCORRECT, since a near-miss and a comfortable pass are both
worth calling out. Exactly at the threshold is gold; within 2 degrees
either side is green; anything wider gets no color
(`tempClosenessClass()` in `historyPage.js`).

The **Distance** column shows both a running total and that round's own
hop: 0 on the first guessed city, then `total km (+step km)` on each
next one — the running great-circle distance across every city guessed
so far, plus in brackets just the leg from the previous city to this one
(`buildDistanceColumn()` in `historyPage.js`, its own copy of `ui.js`'s
`haversineKm()` per this page's self-contained convention; the bracketed
number is the same value the running total was already computing per
step, just kept instead of discarded). No bracket on whichever round
starts a fresh chain — the very first guess, or the first guess after a
gap — since there's nothing before it to measure from. A round with no
coordinates — timed out, or an older run recorded before coordinates
were saved (`lat`/`lon` on each round in `app.js`) — shows "—" and
breaks the running chain right there rather than guessing; the total
picks back up (bracket-less) from the next round that has them.

**Export** (the 📄 button on each run card) is the browser's own print
dialog with "Save as PDF" picked as the destination — no PDF library, no
server round-trip — but scoped to just that one run, not the whole page:
`wireExportButtons()` force-expands that single card (so a never-clicked
card still exports in full), marks it via `body.gs-printing-one` +
`.gs-print-target`, and hands off to `window.print()`. A `@media print`
stylesheet in `history.html` hides every other run card for the duration,
and swaps the dark console theme for a plain light one, since printing
the dark theme as-is would either waste a page of ink or — if the
browser's "background graphics" print option is off — render as
invisible white-on-white. An `afterprint` listener restores everything
(other cards, this card's open/closed state) once the dialog closes.

Uses the same Firebase project as the leaderboard — no separate account
setup. `firestore.rules` already covers both collections if you followed
the Leaderboard section's steps. There's exactly **one** extra one-time
step this feature needs that the leaderboard didn't:

**Create a composite index.** The History page's query — every run for
one player, `uid == X`, newest first — needs a composite index that
Firestore doesn't build automatically. The very first time you load
`history.html`, it'll fail with "This query needs a Firestore index" and
log the real error to the browser console; that error's `message` contains
a **direct link, specific to your project**, that pre-fills the index for
you (collection `geostreakRuns`, fields `uid` Ascending + `playedAt`
Descending) — open it, click **Create Index**, wait a minute or two for it
to finish building (Firestore Database -> Indexes tab shows
Building -> Enabled), then reload the page. One-time, console-only, same
as everything else here.

### Data model

One document per **completed run**, in a new `geostreakRuns` collection,
auto-generated id:

```
{
  uid: "abc123...",
  nickname: "Player4492",
  finalStreak: 5,
  reason: "wrong" | "time",
  roundCount: 6,
  rounds: [
    { direction: "above", threshold: 18, hemisphere: null, typed: "Kochi",
      resolvedCity: "Kochi", country: "IN", temp: 29.4, correct: true, timedOut: false },
    // ...5 more, in order — the 6th being the incorrect guess or timeout that ended it
  ],
  playedAt: <server timestamp>,
}
```

The key design choice: **one write per finished run, not one write per
round.** Every round this run played is accumulated in memory
client-side (`roundHistory` in `app.js`) and only sent to Firestore as a
single array field, in a single `add()` call, at the moment `endGame()`
fires. A 40-round tough-mode streak costs exactly the same one write as a
1-round loss — Firestore bills per write call, not per array element.
Unlike the leaderboard, this write happens on **every** run regardless of
streak — a 0-streak instant loss is still a real attempt worth being able
to look back at.

### Privacy

Unlike the public leaderboard, run history is **private** —
`firestore.rules` only allows a player to read documents where
`uid == request.auth.uid`, or where the reader is one of a short
hardcoded list of master UIDs (below). This is granular play-by-play
data, not a headline number, so there's no reason for it to be
world-readable the way the leaderboard is.

### Master access (the "All Players" tab)

A short allowlist of anonymous-auth UIDs — `firestore.rules`' `isMaster()`
— can see everyone's run history, not just their own: `history.html` gets
an extra "All Players" tab (hidden for everyone else) showing the most
recent `RUNS_LIMIT` runs across every player, nickname included per card
so it's clear whose is whose. No "Personal Best" pin on that view — it's
a recent-activity feed across everyone, not one player's best.

This is **real** access control, not the "client-judged, gameable via
devtools" caveat the streak system carries — `isMaster()` is enforced by
Firestore itself, server-side, so a non-master browser genuinely cannot
read another player's runs no matter what it sends.

**Bootstrapping a master UID**, since there's no admin panel to grant one
through:

1. From the browser you want as master, open `history.html` and click
   **"Copy my player ID"** (below the status line) — copies that
   browser's anonymous-auth UID to the clipboard. It's always visible to
   everyone, not just masters — a UID on its own grants nothing without
   also being on the allowlist below, so there's nothing sensitive about
   showing it.
2. Add that UID to **both** `MASTER_UIDS` in `historyPage.js` and
   `isMaster()`'s list in `firestore.rules` — they're two independent
   copies (a JS array and a Firestore rules list, no shared source
   between them), kept in sync by hand. `MASTER_UIDS` only controls
   whether the tab is *shown*; `isMaster()` is what actually gates the
   read. Update one without the other and you get either a tab that
   403s, or working access with no visible way to reach it.
3. Republish `firestore.rules` (Firestore Database -> Rules -> paste ->
   Publish) and redeploy the `historyPage.js` change together — same
   one-time console step as every other rules change in this project.

### Why the "personal best" section doesn't need a second query

Finding the single highest-streak run *could* mean a second Firestore
query (`orderBy("finalStreak", "desc").limit(1)`) — but combining that
with the `uid` filter needs its own composite index, on top of whatever
the main history query already needs. Instead, the page fetches your
`RUNS_LIMIT` (100) most recent runs once and finds the best one **among
those**, client-side. For any realistic amount of play this is
indistinguishable from a true all-time best — it would only miss an older,
better run once you've played more than 100 games since it happened.

### Read/write cost — what this actually adds

Everything below is against Firestore's free Spark plan limits: **50,000
reads/day, 20,000 writes/day.** Firestore bills reads **per document
returned**, not per query — a query returning 10 docs is 10 reads, not 1.
A write that a security rule *rejects* is free; only a write that actually
succeeds counts.

| Action | Before Run History | After Run History |
| --- | --- | --- |
| Finishing a run | 0–1 write (leaderboard, only if a new best) | **+1 write, always** (run history) — at most 2 total |
| Viewing the leaderboard, one page (start/pause/game-over/peek) | up to 20 reads | **up to 11 reads** (pagination's 10-per-page + 1 to check for a next page) |
| Visiting the History page | — (didn't exist) | **up to 100 reads**, only when that page is actually opened |

Worked example — 10 people playing 5 runs each in a day (50 runs total),
each checking their leaderboard 3 times per session (one page each) and
their history once:

- **Writes:** 50 runs × up to 2 writes = **100 writes/day** — 0.5% of the free cap.
- **Leaderboard reads:** 50 runs × 3 views × 11 docs = **1,650 reads/day.**
- **History reads:** 10 visits × up to 100 docs = **1,000 reads/day.**
- **Total: ~2,650 reads/day** — 5% of the free cap, and Run History's own
  share of that (the only genuinely *new* cost) is about 1,000 reads and
  50 writes — comfortably inside Spark for any personal or small-friends-group
  scale. Pagination actually *lowered* the leaderboard's own per-view cost
  along the way (20 reads flat -> 11 for a first page), since most visits
  never go past page 1.

## Time Quiz

A Kahoot-style companion mode, not a variant of the streak itself — same
core loop as GeoStreak (type a city whose current temperature matches a
condition, judged live against OpenWeatherMap), but a fixed 15-question
quiz instead of an infinite streak, scored by how fast you answer rather
than how long you survive. Play it at
[`timeQuiz.html`](./timeQuiz.html) ("Start Time Quiz", next to the
renamed "Start Streak Game" button on GeoStreak's own start screen).

No shared/live session yet — everything in [`timeQuiz.js`](./timeQuiz.js)
is built with a later multiplayer mode in mind without actually building
one yet, see "Built for later" below — but it does have its own online
leaderboard, full run history, and global "most used" insights, same
Firebase project and same player identity as GeoStreak's; see
[Leaderboard, Run History &amp; Insights](#leaderboard-run-history--insights)
further down.

### Scoring

20 seconds per question, split linearly into 1000 points: answer in 1s
and it's worth 950, in 5s it's worth 750, right at the buzzer it's worth
0. A wrong city — or the right temperature in the wrong region — scores
a flat 0 regardless of how fast it came in. `computePoints()` is the
whole formula: `round(1000 * (1 - elapsedSeconds / 20))`, clamped to
`[0, 1000]`.

The clock itself is `performance.now()`-based, not `Date.now()` —
immune to a system clock adjustment mid-question — and the score-worthy
elapsed time is captured **the instant Submit is clicked**, before the
network round-trip to look the city up even starts. A slow OpenWeatherMap
response costs nothing; only how long you took to type and hit Submit
does.

Alongside the seconds, a live **"N pts if correct now"** line ticks down
from 1000 to 0 in step with the clock — the exact same `computePoints()`
call the real submit uses (`correct: true`, `elapsed` read fresh each
tick), so it's never a second formula that could drift out of sync with
actual scoring, just the same one evaluated early.

No streak, no elimination: a wrong answer doesn't end the quiz, it just
scores 0 and moves on — all 15 questions play out every time.

### Question generation — region-scoped, season-aware

Each question names one of seven regions (**World**, India, United
States, Canada, Europe, South America, Africa) and a temperature
condition; the answer has to satisfy both — right temperature in the
wrong region scores 0, same as a wrong temperature. World is the one
exception: `countryCodes: null` means no restriction at all, any
resolved city counts. `REGIONS` in `timeQuiz.js` holds, per region:
which country codes qualify (`sys.country` on the OpenWeatherMap
response, checked against a broad-but-not-exhaustive list — easy to
extend), and a **[min, max] range** — not a short fixed list — per
tier/direction: `moderate` for questions 1–10, `tough` for 11–15, the
same "gets harder partway through" shape GeoStreak's own tough-round
rule already uses. Every range across every region stays inside
`GLOBAL_MIN`/`GLOBAL_MAX` (6–32°C, mirroring GeoStreak's own normal-mode
5–32°C bounds) — an earlier version ranged as wide as 2–41°C, which
produced genuinely unfair edge questions.

**Mixing is ported from GeoStreak's own `pickThreshold()`,** not
reinvented: a random integer from the range, tracked in a per-
region/tier/direction "already asked" set that won't repeat a value
until the whole range is exhausted (then refills) — earlier versions of
this page drew from a short fixed list of 3-4 numbers per region, which
repeated constantly and felt scripted rather than random. Direction
(above/below) strictly **alternates** question to question, same as
GeoStreak's `nextDirection` — not a fresh coin flip each time — with the
starting side randomised per quiz.

**Adjacent questions avoid landing near each other**, an addition
GeoStreak's own version doesn't need (it isn't a fixed-length quiz, so
"what came right before" isn't as noticeable there). Since direction
always alternates, a naive version could follow "ABOVE 6°C" with "BELOW
6°C" right after — two different questions that read as a jarring flip
on the same number, not real variety. `pickThreshold()` takes an
`avoidNear` value (the previous question's threshold) and excludes
anything within `minGap` (4°C) of it *if* that still leaves a candidate
— a handful of regions have ranges narrower than `2×minGap`, where no
candidate can ever be far enough away, so this is a best-effort
preference, not a hard guarantee (~97.5% of adjacent pairs stay ≥4°C
apart across 1000 simulated quizzes; the rest are those narrow-range
cases with nowhere else to go).

**Which regions actually get asked is a checkbox picker on the start
screen** — any combination, remembered across visits as
`playerState.lastRegions` (see [Leaderboard, Run History &amp;
Insights](#leaderboard-run-history--insights) below for where that state
actually lives now). Leaving every box unchecked plays **World** rather
than refusing to start; `buildQuestions()` takes the active region list
as a parameter for exactly this. One real bug this surfaced: the "avoid
picking the same region twice in a row" logic used to spin forever with
only one region selected, since there's no alternative to fall back to —
a single-region quiz (the World default, or any one box checked alone)
is now special-cased to just repeat that one region, rather than routing
through the general avoid-repeats loop at all.

**The picker itself starts locked.** A first-time (or so-far-not-good-
enough) player never sees the checkboxes at all — just a note explaining
what unlocks them — and every quiz runs World-only regardless. Finishing
a single quiz with `UNLOCK_CORRECT_COUNT` (10) or more correct, or a
score of `UNLOCK_SCORE` (8,000) or higher, sets
`playerState.regionsUnlocked` permanently (checked once per finished quiz
in `renderFinal()`, never re-locked once set) and shows a "🎉 Region
selection unlocked" note right there on the results screen — but the
picker itself only appears the *next* time the start screen renders
fresh, not retroactively within the run that just unlocked it, since
`renderStart()` is what decides whether to show it. "Play Again" on the
results screen goes back through `renderStart()` for exactly this reason
— it used to wire straight to `startQuiz()`, which silently forced every
replay back to World (it reads `.tq-region-check:checked` from a DOM that
only exists on the start screen) regardless of what had just been
unlocked; fixed alongside this same migration.

The thresholds themselves are hand-picked for **the season this was
built in** (August/September — northern-hemisphere late summer,
southern-hemisphere late winter), not generic year-round numbers: India's
moderate range stays on the "still hot" side since nearly the whole
country is 24–30°C+ right now, while its tough "below" range only has an
answer at real altitude (Leh, Manali, Darjeeling) — genuinely hard, not
unanswerable. South America and Africa both currently span a real
hot/cold split within one region (equatorial/northern areas warm
year-round, southern-hemisphere portions in winter), so both directions
are fair game there — unlike a region that's uniformly one season, where
only one direction stays answerable. Revisit `REGIONS` by hand each
season; nothing here recalculates it automatically.

### A not-found lookup doesn't end the question

A typo (or a name OpenWeatherMap just can't resolve) used to score a
flat 0 immediately — now it's handled exactly like GeoStreak's own
`submitGuess()` handles the same case: a hint ("Nothing found for
'X'. Try another city — the clock's still running.") and another real
attempt, clock still running, rather than the question ending on what
was probably a spelling mistake. The question is only actually over once
the 20s clock itself runs out (`startTimer()`'s own timeout call into
`resolveAnswer()`) or a real city resolves.

### Reusing a city mid-quiz

Same city twice this quiz is flagged, not silently accepted — same idea
as GeoStreak's own `usedCities` check in `submitGuess()`, ported here as
a `usedCities` Set reset at the start of each quiz. Checked twice:
before the network lookup (the raw typed string, lowercased — catches an
immediate retype) and again once it resolves (the canonical
`"name|country"` key — catches "Auckland" then "Auckland,NZ" resolving
to the same place despite different raw text). Either check flags rather
than scores 0: the clock keeps running, nothing is submitted, and the
hint below the input says which city was already used — the player gets
another real attempt at the same question, not a wasted one.

### Quitting early

A small "&#9209; Quit" button sits next to the timer on the question screen
(`.tq-quit-btn`, muted like GeoStreak's own `.gs-pause-btn` but with a red
hover, since this one ends the quiz rather than pausing it). Clicking it
(after a native `confirm()`, the only irreversible action on this page)
locks in whatever's been scored on already-answered questions as the
final result — the question in progress at the moment of quitting is
simply dropped, not scored as wrong or timed out. `renderFinal()` uses
`answers.length` rather than the fixed `QUESTION_COUNT` everywhere it
matters (the "N / M correct" line, the Firestore run's `questionCount`),
and the results heading gets a "(quit early)" suffix plus a "quit after N
of 15" note — so a 6-question quit reads honestly as 6 played, not as 9
wrong answers it never actually faced. Region-unlock, best-score, and
leaderboard submission all use whatever score/correct-count actually
accumulated — no special-casing beyond that; the existing thresholds
already handle a shorter run correctly (10+ correct genuinely can't
happen before question 10, quit or not).

### The gap between questions

The fixed pause between questions (`GAP_SECONDS`) shows a large
monospace countdown — the same `.tq-timer` styling as the live 20-second
question clock, not a small text note — so it reads as a real countdown
rather than an afterthought, ticking down to **2 decimals**
(`formatGapTimer()`, `performance.now()`-based like the question clock
itself, not a 1-second `setInterval` jumping in whole numbers). A "Next
question now" button still fires the advance early; the countdown is
what happens if nothing is clicked. The panel also repeats "Question N /
15" — the same progress line the question screen shows — so it's still
visible during the pause, not just while a question is live.

Beyond city/country/temp, the result panel also shows **Coordinates**
(linked out to Google Maps, the same `?api=1&query=lat,lon` pattern used
throughout this site), **Local time** and **Day length** — all three
computed straight from the OpenWeatherMap response already in hand, no
extra request — and **Elevation**, which isn't part of that response and
needs its own call (`fetch.js#getElevation`, the same Open-Elevation
lookup the main app's result card already uses). That one loads
asynchronously after the panel renders (shown as "…" until it resolves)
rather than delaying the panel — `loadElevation()` checks the target
element still exists before writing to it, so a player who's already
moved on to the next question by the time it resolves just means the
value never gets written anywhere, not an error.

**A country tally, same "🇧🇷 BR ×2 | 🇦🇷 AR ×1" chips as GeoStreak's own**
(`ui.js#updateCountryTally`) — ported here as `buildTallyHtml()` rather
than shared, since that one writes straight into a DOM element and this
page rebuilds the whole result panel's HTML each question. `countryCities`
(a `Map<countryCode, cityName[]>`, reset each quiz) is filled alongside
`usedCities` the moment a city is accepted, so it's always in sync with
what's actually been used. Each chip is hoverable/focusable and expands
a popover listing the specific cities, same as GeoStreak's.

### Nickname

`timeQuiz.js` shows "Playing as {nickname}" on the start screen and
"{nickname}'s score" on the results screen — reading the exact same
`localStorage["geoStreakGame_nickname"]` key GeoStreak's own
`leaderboard.js` writes, so whatever name was set there just shows up
here with no separate entry flow. Read-only on this page: editing a
nickname stays GeoStreak's job. Computed **once** per page load and
reused everywhere it's shown, rather than re-read per render —
`leaderboard.js`'s own `getNickname()` falls back to a fresh random
placeholder on every call when nothing's saved, which would otherwise
show a different made-up name on the start screen than on the results
screen.

### Built for later: same quiz for everyone

`buildQuestions(seed)` is a pure function of its seed — a seeded PRNG
(`mulberry32`), not `Math.random()` — so the exact same 15 questions,
in the exact same order, come out of the exact same seed every time.
Solo play just seeds it from the clock, but a future "one admin starts
it, everyone gets the same quiz" mode only needs to broadcast that one
seed number to every player, not synchronize the actual question list.
Nothing else here (timers, scoring, region-matching) assumes anything
about who else might be playing.

### Leaderboard, Run History &amp; Insights

Same Firebase project as GeoStreak, same player — `timeQuizLeaderboard.js`
(loaded on `timeQuiz.html`, alongside GeoStreak's own `leaderboard.js`
loaded on `geoStreakGame.html`) signs in anonymously the same way, and
since Firebase anonymous auth persists **per browser, not per page**, it
resolves to the exact same `uid` GeoStreak already established — there's
no separate "Time Quiz account." The nickname is the same story: both
files read/write `localStorage["geoStreakGame_nickname"]`, so a name set
on either page just shows up on the other. A visitor who opens Time Quiz
before ever touching GeoStreak still gets asked to name themselves — a
"Playing as ___ [Save]" row on the start screen (`nicknameRowHtml()`/
`wireNicknameRow()`), simpler than GeoStreak's own setup-row/header-display
toggle since this page has no persistent header slot to swap it into.

Three collections mirror GeoStreak's own shape, `bestScore` (0–15,000: 15
questions × 1,000 points max) standing in for `bestStreak`:

- **`timeQuizLeaderboard/{uid}`** — all-time personal best, upserted only
  when a run's score beats the stored one (same improvement-only
  `firestore.rules` gate as `geostreakLeaderboard`).
- **`timeQuizDaily/{uid}_{date}`** — the "Today" tab, same
  Europe/Berlin-anchored calendar day as `geostreakDaily`.
- **`timeQuizRuns/{runId}`** — one document per finished quiz, written
  unconditionally (score of 0 included), same private
  own-runs-or-master-only read rule as `geostreakRuns`:
  ```
  { uid, nickname, score, correctCount, questionCount,
    regions: ["India", "United States"], rounds: [...15 entries...],
    playedAt: <server timestamp> }
  ```
  `rounds` is exactly the `answers` array `timeQuiz.js` already builds for
  its own results-screen breakdown table (region/condition/detail/correct/
  elapsed/points) — sent as-is, not reshaped.

**A fourth collection, `timeQuizPlayers/{uid}`, replaced this page's
`localStorage` entirely** — best score, lifetime `totalCorrect`/
`totalAttempts`/`totalRuns`, the permanent region-unlock flag, and the
last-picked regions used to be five separate `localStorage` keys; now
they're one private document (own-uid read/write only — unlike the public
leaderboard collections above, there's no reason for a player's own
settings to be world-readable):
```
{ bestScore: 11250, totalCorrect: 340, totalAttempts: 512, totalRuns: 38,
  regionsUnlocked: true, lastRegions: ["india", "us"], updatedAt: <server timestamp> }
```
Fetched **once** per page load (`TimeQuizBoard.loadPlayerState()`, awaited
by `init()` before the very first `renderStart()`) and kept as an
in-memory `playerState` object from there — mutated directly as a quiz
plays out (`recordAttempt()` on every question, the unlock/best-score
checks in `renderFinal()`) and flushed back to Firestore in exactly
**one write per finished quiz** (`TimeQuizBoard.savePlayerState()`), not
a write per field-change. `firestore.rules`' `isValidPlayerState()` +
the update rule's four `>=` comparisons (plus "`regionsUnlocked` can flip
false&rarr;true but never back") enforce the same "personal stats only
move one direction" guarantee as everywhere else in this file, just
without requiring `bestScore` specifically to have improved on any given
write — unlike `timeQuizLeaderboard`, this document is meant to be
written on **every** completed quiz, not just a new personal best.

**The tradeoff**: this page now has no local fallback at all for that
state. If Firebase is unreachable — not configured, offline, blocked by
an extension — `loadPlayerState()` resolves to a fresh all-zero
`playerState` for the whole session (never throws, same "fail open with
defaults" reasoning as the rest of this file) and `savePlayerState()`
silently no-ops on the way out, same as every other background write
here. The quiz is still fully playable either way; what's lost in that
scenario is exactly what used to survive a page reload for free — best
score, lifetime totals, region-unlock progress, and remembered region
picks all reset to zero/locked/empty next load instead of persisting.
Accepted deliberately: `localStorage` was a workaround for not having a
per-player datastore yet, and now that the leaderboard/run-history/tally
collections above already require Firebase to mean anything, keeping a
second, divergent, offline-only copy of the same numbers wasn't worth
the two-sources-of-truth complexity it added.

The leaderboard panel (Overall/Today tabs, paginated 10-per-page) shows on
the start screen and the results screen, same as GeoStreak's own panel
shows on start/pause/game-over — never mid-quiz.

**"Your Best 10"** skips a second Firestore query: instead of a
`uid == me` + `orderBy(score, desc)` composite index on top of the one
`uid == me` + `orderBy(playedAt, desc)` already needs, it fetches the 50
most recent runs (`BEST_RUNS_LOOKBACK` in `timeQuizLeaderboard.js`) and
sorts by score client-side — same "no second query" reasoning
`historyPage.js`'s single-best-run comment already gives for GeoStreak,
extended from one run to ten. Only wrong once more than 50 quizzes have
been played since an old top-10 run aged out of that window.

**Insights — Most Used Cities / Most Used Countries** — shown below the
how-to-play list on the start screen, and unlike GeoStreak's own
per-browser city tally (a `localStorage` count, see `ui.js`'s
`buildCityInsightsHtml()`), this one is **global**: every player's
accepted answers (correct or not — resolving to a real city is the bar,
same moment `countryCities` already gets updated in `submitAnswer()`)
increment the same two shared, ownerless counter collections:

- **`timeQuizCityTally/{slug}`** — `{ city, country, count, lastUsedAt }`,
  doc id a sanitized `"country_city"` slug (`tallyDocId()`), not a uid.
- **`timeQuizCountryTally/{countryCode}`** — `{ country, count, lastUsedAt }`.

`firestore.rules` has no per-owner check for either (there isn't one) —
the only thing enforced is **count can only go up, by exactly 1, per
write**, plus `city`/`country` staying fixed for a given doc id, the same
"client-judged, but at least monotonic" guarantee the streak/score
improvement gates give elsewhere in this file. `FieldValue.increment(1)`
against a field that doesn't exist yet resolves to `0 + 1`, which is what
`isValidCityTallyCreate()`/`isValidCountryTallyCreate()`'s `count == 1`
check is looking for. Both insight lists are a single-field `orderBy` —
neither needs a composite index.

**Run History** (`history.html`) now has a "GeoStreak" / "Time Quiz"
switcher above the existing Mine/All Players tabs (`wireGameTabs()` in
`historyPage.js`) — the two games' runs live in different collections
with a different round shape, so `GAMES` in that file holds, per game,
which collection to query and how to render a card
(`buildTimeQuizRunCard()`/`buildTimeQuizRoundsTable()` for Time Quiz,
reusing the existing GeoStreak renderers unchanged). Time Quiz's "best"
section shows the **Best 10** cards described above instead of GeoStreak's
single Personal Best card; the Mine/All Players master gate
(`MASTER_UIDS`/`isMaster()`) is unchanged and applies to both games.

**Extra one-time setup**, on top of whatever GeoStreak's own Leaderboard
section already had you do: republish the updated `firestore.rules` (same
Firestore Database -> Rules -> paste -> Publish step), then create two more
composite indexes the same way History's own `geostreakRuns` one was
created — load the Today tab and the History page's Time Quiz view once
each, open the browser console, follow the "this query requires an index"
link:
- `timeQuizDaily`: `date` Ascending + `bestScore` Descending.
- `timeQuizRuns`: `uid` Ascending + `playedAt` Descending.

(`timeQuizPlayers` needs no index of its own — `loadPlayerState()` reads
one document straight by its id, never queries the collection.)

### Not in this version

- **No live multiplayer** — see "Built for later" above for what's
  already in place toward it.
- **No admin/host controls** — "1 admin can start the quiz" from the
  original ask is exactly the multiplayer piece not built yet.

## Visual design

Dark "weather station console" theme — deep navy background, a small
radar-sweep animation in the header, monospace stat readouts — distinct
from the main app's light Bootstrap look. The result-reveal card is the
one exception: it deliberately **reuses** the main app's own light card
component (city name, flag, coordinates, temperature, conditions) so a
guess result still looks like a Weather.JS reading, just stamped
CORRECT/INCORRECT in the corner.

## Bug log

Notable bugs, once actually fixed — what broke, what it looked like to a
player, and the real cause, newest first. Not every commit, just the ones
worth a future reader knowing *why* the code is shaped the way it is.

- **2026-08-17 — History's INCORRECT badge didn't say why a tough round
  failed.** A tough round (hemisphere + temperature) needs both halves
  right, but a failed one just showed "INCORRECT" with no way to tell
  whether the temperature guess, the hemisphere guess, or both were wrong
  — the player had to recompute it by hand from the city and reading.
  Fixed by recording `tempCorrect`/`hemisphereCorrect` alongside `correct`
  in each round (`app.js`), and having `historyPage.js` turn that into
  "INCORRECT (temp)", "(hemisphere)", or "(temp & hemisphere)". Runs
  recorded before this fix don't have the two new fields, so they still
  show a plain "INCORRECT" rather than guessing.
- **2026-08-16 — Correctness judged against the raw temperature, not the
  rounded one the card displays.** The result card always showed
  `Math.round(data.main.temp)` (e.g. "16°C"), but the correct/incorrect
  check compared the unrounded value underneath it. A reading like
  16.01°C — displayed as an exact "16°C" — still failed "BELOW 16°C",
  since 16.01 is not ≤ 16. Fixed by rounding before judging, so the
  number the player is looking at is always the number that gets judged.
- **2026-08-16 — Used-city dedup blocked same-named cities in different
  countries.** The "already used this session" check keyed on
  OpenWeather's resolved city name alone. Queenstown exists in NZ, AU
  *and* ZA; Colón in both AR and CO — genuinely different places that
  happen to share a name. Guessing one blocked every other one for the
  rest of the run. Fixed by keying on name+country together, matching the
  `cityKey` format already used for the country tally and lifetime city
  stats elsewhere in this file.

## Notably *not* in this version

- No hardcoded city pool, no suggestion chips, no simulated/offline
  fallback reading. An earlier draft had all three; free-text guessing
  made the fallback (which needed known coordinates) inapplicable, so a
  failed lookup is just "nothing found" rather than faked data.
- No `<datalist>` for city suggestions — an earlier version used one and
  its native popup intercepted clicks on the submit button.
- No country-alternation rule or daylight questions — the only
  progression is the question-11 hemisphere twist above.
