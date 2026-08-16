# Morning Checklist

A personal daily habit tracker — not part of GeoStreak, just living in
this folder. Seven items, built from a "morning mistakes" list: check off
what you actually avoided today, watch the sun rise as you go, come back
later to see any past day.

**Storage: currently `localStorage`, one browser only.** Firebase (reusing
GeoStreak's project, already prepped in `../firestore.rules` under
`morningChecklist`) is a planned follow-up so history can follow you
across devices — see [Data model](#data-model) below for both.

Play it at [`morningChecklist.html`](./morningChecklist.html), linked from
GeoStreak's header ("← GeoStreak" goes back the other way).

## The seven items

Each is phrased as the win, not the mistake — checking a box means you
avoided it, not that you did it:

1. Phone stayed down (didn't check it the second you woke up)
2. Water before coffee
3. Got morning sunlight
4. Skipped the carb-heavy breakfast
5. Waited to eat (didn't eat the instant you woke up)
6. Moved after eating (didn't sit straight back down)
7. Started the day calm (not full survival mode)

Edit the `ITEMS` array at the top of [`app.js`](./app.js) to change the
wording, add, or remove one — nothing else needs to change to match, the
whole page (list, storage, streak) is generated from that array's length.

## The sun

The horizon scene above the list isn't decorative — the sun's height is a
direct readout of today's count: below the horizon at 0/7, near the top at
7/7. Rays only appear once every item is checked, as a small payoff for
actually finishing the day.

## Date navigation

Prev/Next arrows plus a "Today" jump button move between days — Next is
disabled once you're on today (no peeking into the future), and checking
a box on a **past** day is allowed and just as saved as today's, in case
you want to backfill a day you forgot to log.

## Data model

One `localStorage` entry per **local calendar day**, key
`morningChecklist_{date}`:

```
localStorage["morningChecklist_2026-08-16"] = "[true,true,false,false,false,false,false]"
```

Everything (`readDay`/`writeDay` in [`app.js`](./app.js)) reads and writes
that single key per day — no indexing concerns, since there's no query
involved at all.

Unlike a "must increase" leaderboard entry, a write here isn't
one-directional: a checked box can be unchecked again later the same day.

"Today" is the **viewer's own local timezone** (`Intl.DateTimeFormat`,
no forced zone) — this is one person's own routine, so today should just
mean today wherever they actually are.

### Planned: Firebase

`../firestore.rules` already has a `morningChecklist` collection block
(doc id `"{uid}_{date}"`, fetched by **direct document id** rather than a
query — unlike GeoStreak's History and Today-leaderboard pages, this
needs **no composite index** at all) ready for when this moves off
`localStorage`. Swapping it in means: publish that rules block to the
Firebase console, reuse `../firebaseConfig.js` and the same
anonymous-auth pattern as GeoStreak, and change `readDay`/`writeDay` in
`app.js` to hit Firestore instead of `localStorage` (same call shape,
just async). Until then, history lives in one browser only — clearing
site data loses it.

## Streak

The "🔥 N days in a row" line walks backward from today one day at a time,
capped at 90 days to bound the worst case, stopping at the first day that
wasn't fully checked. Today itself is the one exception: if today isn't
finished yet, it's skipped rather than treated as a break, since the day
is still in progress — the streak reflects consecutive *completed* days,
and today doesn't get to break a streak before it's even over.

## Not in this version

- No calendar/heatmap overview of history — just one day at a time via
  Prev/Next. A wider view is a reasonable future addition if daily
  navigation ever feels slow for looking back very far.
- No editing the item list from the UI — it's a hardcoded array in
  `app.js`, meant to be a rare hand-edit, not a live feature.
- No cross-device sync — see "Planned: Firebase" above.
