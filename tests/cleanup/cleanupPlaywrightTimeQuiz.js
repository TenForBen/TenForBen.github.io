// Removes every Time Quiz record written by the Playwright test
// (tests/e2e/timeQuiz.spec.ts, nickname "Playwright Test") from the
// weathergame-bda93 Firestore project.
//
// firestore.rules denies all client deletes, so this has to go through the
// Admin SDK with a service-account key for weathergame-bda93 (Firebase
// console -> Project settings -> Service accounts -> Generate new private key).
//
//   node tests/cleanup/cleanupPlaywrightTimeQuiz.js <path-to-key.json>           # dry run, lists what it would do
//   node tests/cleanup/cleanupPlaywrightTimeQuiz.js <path-to-key.json> --apply   # actually deletes
//
// What it touches, all matched by the test's anonymous uids:
//   timeQuizRuns, timeQuizFastestAnswers, timeQuizLeaderboard, timeQuizDaily,
//   timeQuizPlayers — documents deleted
//   timeQuizCityTally, timeQuizCountryTally — counts decremented by the cities
//     those runs used (read back from each run's `rounds`); a doc whose count
//     reaches 0 is deleted
//   Firebase Auth — the anonymous users themselves deleted

const path = require("path");
const admin = require("firebase-admin");

const NICKNAME = "Playwright Test";
const EXPECTED_PROJECT = "weathergame-bda93";

const [keyArg, ...flags] = process.argv.slice(2);
const apply = flags.includes("--apply");
if (!keyArg) {
  console.error("Usage: node tests/cleanup/cleanupPlaywrightTimeQuiz.js <service-account-key.json> [--apply]");
  process.exit(1);
}

const key = require(path.resolve(keyArg));
if (key.project_id !== EXPECTED_PROJECT) {
  console.error(`Key is for "${key.project_id}", expected "${EXPECTED_PROJECT}".`);
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

// Must match tallyDocId() in FPL/vannilaWeatherApp/weatherGame/timeQuizLeaderboard.js.
function tallyDocId(country, city) {
  const raw = `${country}_${city}`.toLowerCase();
  const slug = raw.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return slug.slice(0, 300) || "unknown";
}

// A round's detail is "City, CC — 17°C" (optionally followed by a note), or
// "Time's up — no answer" when nothing was accepted.
function cityFromDetail(detail) {
  const [place] = String(detail).split(" — ");
  const comma = place.lastIndexOf(", ");
  if (comma === -1) return null;
  return { city: place.slice(0, comma), country: place.slice(comma + 2).toUpperCase() };
}

async function main() {
  console.log(apply ? "APPLYING deletions\n" : "DRY RUN — pass --apply to delete\n");

  const uids = new Set();
  const toDelete = []; // DocumentReferences
  const cityCounts = new Map(); // tallyDocId -> count
  const countryCounts = new Map(); // CC -> count

  const runs = await db.collection("timeQuizRuns").where("nickname", "==", NICKNAME).get();
  for (const doc of runs.docs) {
    const run = doc.data();
    uids.add(run.uid);
    toDelete.push(doc.ref);
    for (const round of run.rounds || []) {
      const place = cityFromDetail(round.detail);
      if (!place) continue;
      const id = tallyDocId(place.country, place.city);
      cityCounts.set(id, (cityCounts.get(id) || 0) + 1);
      countryCounts.set(place.country, (countryCounts.get(place.country) || 0) + 1);
    }
  }

  for (const name of ["timeQuizFastestAnswers", "timeQuizLeaderboard", "timeQuizDaily"]) {
    const snap = await db.collection(name).where("nickname", "==", NICKNAME).get();
    for (const doc of snap.docs) {
      toDelete.push(doc.ref);
      if (doc.data().uid) uids.add(doc.data().uid);
      if (name === "timeQuizLeaderboard") uids.add(doc.id); // doc id is the uid
    }
  }

  for (const uid of uids) {
    const ref = db.collection("timeQuizPlayers").doc(uid);
    if ((await ref.get()).exists) toDelete.push(ref);
  }

  console.log(`Test uids: ${[...uids].join(", ") || "(none)"}`);
  console.log(`Documents to delete: ${toDelete.length}`);
  for (const ref of toDelete) console.log(`  - ${ref.path}`);

  const tallyChanges = [];
  for (const [collection, counts] of [["timeQuizCityTally", cityCounts], ["timeQuizCountryTally", countryCounts]]) {
    for (const [id, by] of counts) {
      const ref = db.collection(collection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) {
        console.log(`  ! ${ref.path} not found, skipping`);
        continue;
      }
      const next = (snap.data().count || 0) - by;
      tallyChanges.push({ ref, next });
    }
  }
  console.log(`\nTally docs to adjust: ${tallyChanges.length}`);
  for (const { ref, next } of tallyChanges) {
    console.log(`  - ${ref.path}: ${next <= 0 ? "delete (count 0)" : `count -> ${next}`}`);
  }

  if (!apply) return;

  // Batches cap at 500 writes.
  const writes = [
    ...toDelete.map((ref) => (b) => b.delete(ref)),
    ...tallyChanges.map(({ ref, next }) => (b) => (next <= 0 ? b.delete(ref) : b.update(ref, { count: next }))),
  ];
  for (let i = 0; i < writes.length; i += 500) {
    const batch = db.batch();
    writes.slice(i, i + 500).forEach((write) => write(batch));
    await batch.commit();
  }

  if (uids.size) {
    const result = await admin.auth().deleteUsers([...uids]);
    console.log(`\nDeleted ${result.successCount} anonymous auth users (${result.failureCount} failed).`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
