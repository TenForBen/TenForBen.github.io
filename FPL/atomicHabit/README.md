# Atomic Habits

A personal habit tracker, inspired by James Clear's *Atomic Habits* —
not part of GeoStreak or the FPL scrapper, just living in its own folder.
Play it at [`index.html`](./index.html) (a short summary of the book's
core ideas, plus links to whichever habits are being tracked) and
[`sugarTracking.html`](./sugarTracking.html), the first one.

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

## Adding another habit

`index.html`'s "Habits I'm tracking" card is a plain hardcoded list —
add another `<li><a class="ah-habit-link" href="...">...</a></li>` there
pointing at a new page in this folder. `style.css` is already shared
(the `ah-*` classes), so a new habit page that reuses the date-bar +
checkbox-list + streak layout doesn't need new CSS, just a page-specific
script with its own item list and streak rule if it isn't a plain
day-level one.

## Not in this version

- No cross-device sync — `localStorage` only, same tradeoff
  `../weatherGame/checklist` currently makes.
- No heatmap/calendar *overview* of history — the 📅 button jumps to one
  date at a time, it doesn't show which past days were good at a glance.
