// Pilot run: fetch every manager in the given leagues, plus each
// manager's current-gameweek picks. Prints to the console only — no
// .js/.json file is written (that's the point of this pilot; see
// README.md for why, and what replaces it once Firebase is wired up).
import { getBootstrapStatic, getEventLive, getEntry, getEntryPicks, getLeague } from "./fplApi.js";
import { mapWithConcurrency } from "./concurrency.js";

const LEAGUE_IDS = [478151, 232737];
const CONCURRENCY = 6; // in-flight manager lookups at once, per league

async function scrapeLeague(leagueId, { eventId, playersById, liveById }) {
  const league = await getLeague(leagueId);

  const managers = await mapWithConcurrency(league.entries, CONCURRENCY, async (row) => {
    const [entry, picksRes] = await Promise.all([
      getEntry(row.entry),
      // A manager who hasn't set a team for this gameweek yet 404s here —
      // that's "no picks", not a failure worth aborting the whole scrape over.
      getEntryPicks(row.entry, eventId).catch((err) => {
        if (err.status === 404) return null;
        throw err;
      }),
    ]);

    const picks = (picksRes?.picks ?? []).map((p) => {
      const player = playersById.get(p.element);
      const live = liveById.get(p.element);
      return {
        name: player?.web_name ?? `#${p.element}`,
        gwPoints: live?.stats?.total_points ?? 0,
        multiplier: p.multiplier, // 0 on the bench, 2 (or 3 with triple captain) on the captain
        isCaptain: p.is_captain,
        isViceCaptain: p.is_vice_captain,
      };
    });

    return {
      managerId: row.entry,
      leagueRank: row.rank,
      playerName: `${entry.player_first_name} ${entry.player_last_name}`,
      teamName: entry.name,
      countryCode: entry.player_region_iso_code_short,
      countryName: entry.player_region_name,
      gwPoints: entry.summary_event_points,
      overallPoints: entry.summary_overall_points,
      overallRank: entry.summary_overall_rank,
      gameweek: eventId,
      picks,
    };
  });

  managers.sort((a, b) => a.leagueRank - b.leagueRank);
  return { id: league.id, kind: league.kind, name: league.name, managers };
}

function printSummary(league) {
  console.log(`\n=== ${league.name} — league ${league.id} (${league.kind}) — ${league.managers.length} managers ===`);
  for (const m of league.managers) {
    console.log(
      `${String(m.leagueRank).padStart(3)}  ${m.teamName} (${m.playerName}, ${m.countryCode ?? "??"})`
      + ` — GW ${m.gwPoints} pts, ${m.overallPoints} overall, rank ${m.overallRank?.toLocaleString() ?? "—"}`
    );
  }
}

async function main() {
  const bootstrap = await getBootstrapStatic();
  const currentEvent = bootstrap.events.find((e) => e.is_current) ?? bootstrap.events.find((e) => e.is_next);
  const eventId = currentEvent.id;
  const playersById = new Map(bootstrap.elements.map((el) => [el.id, el]));
  const live = await getEventLive(eventId);
  const liveById = new Map(live.elements.map((el) => [el.id, el]));

  console.log(`Gameweek in play: ${eventId} (${currentEvent.name})`);

  const leagues = [];
  for (const leagueId of LEAGUE_IDS) {
    const league = await scrapeLeague(leagueId, { eventId, playersById, liveById });
    printSummary(league);
    leagues.push(league);
  }

  // Full detail (including every pick) for just the top manager in each
  // league, as a concrete sample of the shape this would hand to Firebase —
  // printing all of it for every manager would flood the terminal for no
  // extra proof.
  console.log("\n--- Sample manager record (league leader, full shape) ---");
  for (const league of leagues) {
    console.log(`\n${league.name}:`);
    console.log(JSON.stringify(league.managers[0], null, 2));
  }
}

main().catch((err) => {
  console.error("Scrape failed:", err);
  process.exitCode = 1;
});
