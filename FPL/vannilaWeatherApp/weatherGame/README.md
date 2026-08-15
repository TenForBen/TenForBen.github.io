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
- **`firebaseConfig.js`** / **`leaderboard.js`** / **`firestore.rules`** —
  the optional online leaderboard and run history (see
  [Leaderboard](#leaderboard) and [Run History](#run-history) above).
  Firebase's compat SDK (loaded via `<script>` tags, matching this
  project's no-bundler style) plus `leaderboard.js` must both come
  *before* `../app.js` in `geoStreakGame.html` — `app.js` calls
  `showStartScreen()` synchronously as soon as it loads, and that needs
  the `Leaderboard` global (and `escapeHtml` from `../ui.js`) to already
  exist.
- **`history.html`** / **`historyPage.js`** — the Run History page. A
  separate page load, so it can't reuse `leaderboard.js`'s in-memory
  Firebase state — it does its own minimal sign-in + query, self-contained
  like `southernHemisphere/app.js` (its own small `escapeHtml`/
  `flagEmoji`, rather than loading `../ui.js` for just those two
  functions). Read-only: this page never writes to Firestore.

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
{ nickname: "Player4492", bestStreak: 22, totalCorrect: 125, totalAttempts: 139, updatedAt: <server timestamp> }
```

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

**Export PDF** is the browser's own print dialog with "Save as PDF" picked
as the destination — no PDF library, no server round-trip. Clicking it
force-expands every run card (so nothing you never happened to click open
is silently missing from the export) and hands off to `window.print()`;
a `@media print` stylesheet in `history.html` swaps the dark console
theme for a plain light one just for the printed/exported version, since
printing the dark theme as-is would either waste a page of ink or — if
the browser's "background graphics" print option is off — render as
invisible white-on-white.

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
`uid == request.auth.uid`. This is granular play-by-play data, not a
headline number, so there's no reason for it to be world-readable the way
the leaderboard is.

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
