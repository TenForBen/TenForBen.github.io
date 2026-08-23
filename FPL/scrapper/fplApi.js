// Thin wrapper around the official Fantasy Premier League JSON API —
// https://fantasy.premierleague.com/api/... No API key, no auth, and (per
// the old C# scrapper's own README) no documented spec either, just
// well-known public endpoints. Deliberately NOT Selenium/HTML scraping
// like the old version: these return clean structured JSON directly, and
// FPL sets no CORS headers on them, which is exactly why this has to run
// server-side (Node) rather than as a browser page.

const BASE = "https://fantasy.premierleague.com/api";

async function getJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; fpl-scrapper-pilot/1.0)" },
  });
  if (!res.ok) {
    const err = new Error(`FPL API ${res.status} ${res.statusText} — ${url}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Every player (element) in the game, every real-world club, and every
// gameweek's metadata (deadlines, which one is "current"). Fetched once
// per run and reused everywhere — this doesn't change mid-scrape.
export function getBootstrapStatic() {
  return getJson(`${BASE}/bootstrap-static/`);
}

// Every player's stats FOR ONE GAMEWEEK specifically (goals, bonus,
// total_points, ...). bootstrap-static's elements only carry
// season-to-date totals; this is the only place a single gameweek's
// per-player score lives — needed to reproduce the old scrapper's
// "Player_N: name + that gameweek's points" fields.
export function getEventLive(eventId) {
  return getJson(`${BASE}/event/${eventId}/live/`);
}

// One manager's profile: real name, team name, country, overall/gameweek
// points and rank. Same shape regardless of which league(s) they're in.
export function getEntry(entryId) {
  return getJson(`${BASE}/entry/${entryId}/`);
}

// One manager's starting XI + bench for one gameweek (player ids only —
// combine with bootstrap-static's elements for names, and event/live for
// that gameweek's points). 404s for a manager who hasn't set a team yet
// for that gameweek — callers should treat that as "no picks", not a
// fatal error.
export function getEntryPicks(entryId, eventId) {
  return getJson(`${BASE}/entry/${entryId}/event/${eventId}/picks/`);
}

async function getLeagueStandingsPage(leagueId, kind, page) {
  const path = kind === "h2h" ? "leagues-h2h" : "leagues-classic";
  return getJson(`${BASE}/${path}/${leagueId}/standings/?page_standings=${page}`);
}

// FPL has two unrelated league types — "classic" (ranked by total points)
// and "head-to-head" (ranked by match wins) — living at different
// endpoints with no way to know which one a given ID is ahead of time.
// Classic is tried first since it's the far more common type; a 404 there
// means it's actually H2H. Both paginate the same way
// (?page_standings=N, standings.has_next), so this walks every page
// regardless of which type it turned out to be.
export async function getLeague(leagueId) {
  let kind = "classic";
  let first;
  try {
    first = await getLeagueStandingsPage(leagueId, "classic", 1);
  } catch (err) {
    if (err.status !== 404) throw err;
    kind = "h2h";
    first = await getLeagueStandingsPage(leagueId, "h2h", 1);
  }

  const results = [...first.standings.results];
  let page = 1;
  let hasNext = first.standings.has_next;
  while (hasNext) {
    page += 1;
    const next = await getLeagueStandingsPage(leagueId, kind, page);
    results.push(...next.standings.results);
    hasNext = next.standings.has_next;
  }

  return { id: leagueId, kind, name: first.league.name, entries: results };
}
