// Firestore access for this scraper — the Admin SDK, not the client SDK
// GeoStreak uses. There's no "player" to anonymously sign in as here,
// just a trusted script, so a service account key stands in for
// Firestore security rules entirely: whatever this key can do, this
// script can do, no rules file involved.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_PATH = join(__dirname, "serviceAccountKey.json");

// Never committed (see .gitignore) — missing on a fresh clone is the
// expected case, not an error. Callers check `configured` and skip
// writing rather than crashing, same graceful-degradation pattern as
// GeoStreak's firebaseConfig.js placeholder check.
export const configured = existsSync(KEY_PATH);

let db = null;
if (configured) {
  const serviceAccount = JSON.parse(readFileSync(KEY_PATH, "utf8"));
  initializeApp({ credential: cert(serviceAccount) });
  db = getFirestore();
}

// One document per league (name/kind/last-scraped-at), one document per
// manager per gameweek underneath it — the natural replacement for the
// old one-.js-file-per-league-per-gameweek layout
// (FPL/GW/GW{n}/DB/new/{League}.js): a page can now query "this league,
// this gameweek" directly instead of loading and parsing a whole
// generated file.
export async function writeLeague(league) {
  if (!configured) return;

  const leagueRef = db.collection("leagues").doc(String(league.id));
  await leagueRef.set(
    {
      name: league.name,
      kind: league.kind,
      lastScrapedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const gameweek = league.managers[0]?.gameweek;
  if (gameweek == null) return; // nothing to write — league had no managers

  const gwRef = leagueRef.collection("gameweeks").doc(String(gameweek));
  await gwRef.set({ gameweek }, { merge: true });

  // One batch per league: Firestore caps a batch at 500 writes, and even
  // a big classic league (thousands of managers total, but leagues this
  // script targets are small/private ones) is nowhere near that.
  const batch = db.batch();
  for (const manager of league.managers) {
    const managerRef = gwRef.collection("managers").doc(String(manager.managerId));
    batch.set(managerRef, manager);
  }
  await batch.commit();
}
