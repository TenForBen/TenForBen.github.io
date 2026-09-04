# Atomic Habits

A personal habit tracker, inspired by James Clear's *Atomic Habits* —
not part of GeoStreak or the FPL scrapper, just living in its own folder.
Play it at [`index.html`](./index.html) (a short summary of the book's
core ideas, plus links to whichever habits are being tracked),
[`sugarTracking.html`](./sugarTracking.html), the first one, and
[`paperclip.html`](./paperclip.html), the second.

## Sugar Control

Three checkboxes a day — **Morning / Afternoon / Evening** — one per
stretch of the day spent sugar-free. Checking a box means sugar was
successfully avoided during that stretch, not that it was eaten.

### Streak — per *period*, not per day

Unlike `../weatherGame/checklist`'s day-level streak (a day only counts
once every one of its 7 items is checked), this one counts at the
**period** level: check all three today and the streak reads 3, not 1.
Concretely, `computeStreak()` in [`sugarTracking.js`](./sugarTracking.js)
walks backward from *now* one period at a time — today's Evening, then
Afternoon, then Morning, then yesterday's Evening, and so on — adding 1
for every checked period, and stopping dead at the first **unchecked**
one it finds. That's a real break: periods further back than a break
don't get partial credit even if they were themselves checked, same as
any ordinary streak.

Two periods are treated specially, both only for **today**:

- The period currently in progress (before noon it's Morning, before 5pm
  it's Afternoon, otherwise Evening — see `PERIOD_END_HOUR`) doesn't
  break the streak if it's still unchecked — it's undecided, not missed.
  If it *is* checked (nothing stops you from logging a period early),
  it counts like any other.
- A period later today that hasn't started yet is skipped silently — it
  doesn't exist yet, so it's neither a hit nor a miss.

So at 9pm having checked all three, the streak is 3. At 2pm having
checked Morning only, it's 1 (Afternoon is still open, Evening hasn't
started). At 9am with yesterday a perfect 3/3 and today untouched, it's
however many consecutive periods stretch back from yesterday evening —
today isn't touched yet, so it can't break anything.

### Backdated entries

Prev/Next arrows step one day at a time, same as the Morning Checklist.
Unlike that page, there's also a real **calendar** (📅 button, opens a
native `<input type="date">` via `showPicker()`) to jump straight to any
past date rather than stepping through one day at a time — future dates
are blocked (the input's `max` is today). Checking a box on a backdated
day is saved exactly the same way as checking one today.

### Data model

One `localStorage` entry per **local calendar day**, key
`sugarTracking_{date}`:

```
localStorage["sugarTracking_2026-08-28"] = "[true,true,true]"
```

Same shape and same reasoning as `../weatherGame/checklist`'s
`morningChecklist_{date}` entries — see that folder's README for the
Firebase follow-up shape if this ever needs to sync across devices
(not built here; this is `localStorage`-only, one browser).

## Paperclip

The second habit, and a deliberate departure from Sugar Control's
`localStorage`-only shape: [Trent Dyrsmid's own trick from the
book](https://jamesclear.com/paperclip-strategy) — moving one paperclip
from an unfinished jar to a finished one for every sales call made — as a
Pomodoro timer. One **11-minute Pomodoro per clip**, up to **20 clips a
day**, per activity, resetting fresh every calendar day (not a one-time
lifetime total). Play it at [`paperclip.html`](./paperclip.html) and its
history at [`paperclipHistory.html`](./paperclipHistory.html).

### Firestore-backed, not localStorage

Unlike Sugar Control, **nothing here lives in `localStorage`** — nickname,
activities, and daily progress all go through Firestore, reusing
GeoStreak's own Firebase project (`../vannilaWeatherApp/weatherGame/
firebaseConfig.js`, referenced directly rather than duplicated — same
"reuse, don't copy" approach `../weatherGame/checklist` documents for the
same project) rather than a new one. `../weatherGame/firestore.rules` has
the actual collection rules, under its own "Paperclip (Atomic Habits)"
section.

**Setup**, if this is your first time enabling it: same one-time steps as
GeoStreak's own Leaderboard section in `../weatherGame/README.md`
(Firestore + anonymous auth already enabled if GeoStreak's leaderboard
already works) — the one new thing is **two composite indexes**, created
the same way: open `paperclip.html` and `paperclipHistory.html` once
each, open the browser console, follow the "this query requires an
index" link.
- `paperclipActivities`: `uid` Ascending + `createdAt` Ascending.
- `paperclipDays`: `activityId` Ascending + `date` Descending.

### Nickname

Same setup-row/header-chip toggle as GeoStreak's own header, just backed
by a `paperclipProfiles/{uid}` document instead of a localStorage key.
The nickname itself is a **separate identity from GeoStreak/Time Quiz**
— its own document, not `localStorage["geoStreakGame_nickname"]` — even
though (reusing that same Firebase project) the underlying anonymous-auth
`uid` is technically the same browser session either way.

A brand-new visitor gets a `PlayerNNNN` placeholder immediately, same as
GeoStreak — the difference is this placeholder has to be **persisted**
right away too (`firestore.rules`' `isValidPaperclipProfile()` never
allows an empty `nickname`), so a separate `nicknameChosen` boolean is
what actually distinguishes "still on the placeholder" from "saved a
real name," since there's no "was this key ever written" signal the way
an unset `localStorage` key gives GeoStreak for free.

### Activities — a list, not a single hardcoded one

A profile can create as many activities as it wants over time, switching
between them with a dropdown; each tracks its own baskets and history
completely independently. Leaving the name blank when creating one
defaults to the next Spanish number — **Uno**, **Dos**, **Tres**, and so
on (`SPANISH_NUMBERS` in `paperclip.js`, based on how many activities
already exist, falling back to a plain "Activity N" past ten). Activities
are write-once once created (`firestore.rules` has no update path for
`paperclipActivities`) — there's no rename feature; create a new one
instead.

### Baskets reset daily

`paperclipDays/{activityId}_{date}` is one document per activity **per
calendar day** — a new day is simply a new doc id, so there's nothing to
roll over at midnight, same idea as GeoStreak's own daily leaderboard.
`clipsMoved` climbs from 0 to `BASKET_SIZE` (20) across the day as
Pomodoros complete, via `FieldValue.increment(1)` rather than a
read-then-write — same technique the weatherGame project's tally
collections already use, and `firestore.rules`' `isValidPaperclipDayUpdate()`
enforces the increment is always exactly 1, capped at 20, so a determined
cheater can't just write 20 directly.

### The Pomodoro itself

`performance.now()`-based, same technique GeoStreak/Time Quiz's own
timers use — immune to a system clock adjustment mid-session. Stopping
early (Cancel) moves nothing; only an uninterrupted 11 minutes counts as
the "successful completion" the mechanic rewards. The clip landing in the
finished basket is **optimistic** — it appears the instant the timer
hits zero, with the Firestore write firing in the background and only
rolled back (with a note) if that write actually fails — "make it
satisfying" is the whole point of the mechanic, so the payoff doesn't
wait on a network round-trip.

### Simple graphics, on purpose

Both baskets are just a wrapped grid of 📎 — no drawn illustration, no
canvas, no library. The newest clip gets a brief scale/fade-in animation
(`.ah-clip-new` in `style.css`) so a completion actually reads as
something happening, not a silently-updated number.

## Adding another habit

`index.html`'s "Habits I'm tracking" card is a plain hardcoded list —
add another `<li><a class="ah-habit-link" href="...">...</a></li>` there
pointing at a new page in this folder. `style.css` is shared (the `ah-*`
classes) across all of them — Sugar Control's date-bar + checkbox-list +
streak layout for a plain day-level habit, or Paperclip's basket/Pomodoro
classes for something that isn't. A Firestore-backed habit reuses
GeoStreak's project the way Paperclip does; a `localStorage`-only one
follows Sugar Control instead.

## Not in this version

- **Sugar Control has no cross-device sync** — `localStorage` only, same
  tradeoff `../weatherGame/checklist` currently makes. Paperclip doesn't
  have this limitation; see its own section above.
- No heatmap/calendar *overview* of history — the 📅 button jumps to one
  date at a time, it doesn't show which past days were good at a glance.
