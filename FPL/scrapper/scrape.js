// Fetches every manager in the given leagues, plus each manager's
// current-gameweek picks, and writes them to Firestore — see
// firestoreClient.js for the shape. Still prints a summary either way;
// no .js/.json file is ever written (that's what Firestore replaces —
// see README.md).
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getBootstrapStatic, getEventLive, getEntry, getEntryPicks, getLeague } from "./fplApi.js";
import { mapWithConcurrency } from "./concurrency.js";
import { configured as firestoreConfigured, writeLeague } from "./firestoreClient.js";
import { writeLegacyPages, writeHomePage } from "./legacyOutput.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(__dirname, "..", ".."); // FPL/scrapper -> repo root

// slug: short name used for the DB file and, for every league after the
// first, its punkte_{slug}.html filename — see legacyOutput.js.
const LEAGUES = [
  { id: 478151, slug: "R2G" },
  { id: 232737, slug: "VivaLosFlamingos" },
  { id: 1130674, slug: "KVKeKhiladi" },
];
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
  console.log(
    firestoreConfigured
      ? "Firestore: serviceAccountKey.json found — writing results."
      : "Firestore: no serviceAccountKey.json — printing only, see README.md to enable writes."
  );

  const leagues = [];
  for (const { id: leagueId, slug } of LEAGUES) {
    const league = await scrapeLeague(leagueId, { eventId, playersById, liveById });
    printSummary(league);
    await writeLeague(league);
    leagues.push({ league, slug });
  }

  const outDir = writeLegacyPages({ leagues, gameweek: eventId, siteRoot: SITE_ROOT });
  console.log(`\nLegacy punkte.html + DB/*.js written to ${outDir}`);

  const homePath = writeHomePage({ leagues, gameweek: eventId, siteRoot: SITE_ROOT });
  console.log(`Home page written to ${homePath}`);

  // Full detail (including every pick) for just the top manager in each
  // league, as a concrete sample of the shape this hands to Firestore —
  // printing all of it for every manager would flood the terminal for no
  // extra proof.
  console.log("\n--- Sample manager record (league leader, full shape) ---");
  for (const { league } of leagues) {
    console.log(`\n${league.name}:`);
    console.log(JSON.stringify(league.managers[0], null, 2));
  }
}

main().catch((err) => {
  console.error("Scrape failed:", err);
  process.exitCode = 1;
});
