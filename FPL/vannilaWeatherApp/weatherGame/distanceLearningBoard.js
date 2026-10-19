// DistanceLearningQuiz's Firebase layer — anonymous sign-in (same uid as
// GeoStreak and Time Quiz on this browser), uploading the localStorage
// tables from distanceLearningStore.js to Firestore, and the leaderboard.
//
// localStorage is always written first; this file only copies it up, in
// the background. Every record keeps its client-generated id as its
// Firestore document id and gets `syncedAt` set locally once uploaded, so:
//   - the first connection uploads the whole local history;
//   - anything that fails (offline, rules not published yet) is retried on
//     the next page load or finished quiz;
//   - a retry never duplicates anything.
//
// Collections (rules in firestore.rules, "DistanceLearningQuiz" section):
//   dlqPlayers/{uid}         private  high scores + totals
//   dlqLeaderboard/{uid}     public   nickname + best scores, for ranking
//   dlqRuns/{runId}          private  one per quiz (own uid, or a master)
//   dlqAttempts/{attemptId}  private  one per answer or timeout (same)
//
// Fails silently throughout, like timeQuizLeaderboard.js: Firebase being
// unconfigured, blocked or down never affects the quiz itself.

const DistanceLearningBoard = (() => {
  const PLAYERS = "dlqPlayers";
  const LEADERBOARD = "dlqLeaderboard";
  const RUNS = "dlqRuns";
  const ATTEMPTS = "dlqAttempts";
  const LEADERBOARD_SIZE = 10;
  const BATCH_LIMIT = 450; // Firestore allows 500 writes per batch
  const SIGN_IN_TIMEOUT_MS = 10000;

  const configured = typeof firebaseConfig !== "undefined"
    && firebaseConfig.apiKey
    && !firebaseConfig.apiKey.startsWith("REPLACE_ME");
  // Firebase anonymous sign-in never completes on a page opened straight
  // from disk (file://) — it just hangs — so online features are skipped
  // there and the panels say why. Serve the folder over http(s) instead
  // (GitHub Pages, or e.g. `python3 -m http.server`).
  const fromFile = location.protocol === "file:";
  const online = configured && !fromFile;
  const OFFLINE_NOTE = fromFile
    ? "Online features need the page served over http(s), not opened from a file."
    : "Not configured — see firebaseConfig.js.";

  let db = null;
  let uid = null;
  // Resolves once sign-in has finished (uid set, or null on failure) — and
  // nothing more. Upload and leaderboard code wait on this; it must never
  // itself wait on them, or the two deadlock (see the README's bug log).
  let signedIn = Promise.resolve();
  let syncing = null; // the in-flight sync() promise, so two never overlap

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));
  }

  // The shared GeoStreak/Time Quiz nickname, or a stable placeholder built
  // from this browser's playerId so it doesn't change between uploads.
  function nickname(player) {
    if (player.nickname) return player.nickname.slice(0, 20);
    const digits = parseInt(player.playerId.replace(/[^0-9a-f]/gi, "").slice(0, 6), 16) % 9000 + 1000;
    return `Player${digits}`;
  }

  function init() {
    if (!online) return;
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    const auth = firebase.auth();
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Sign-in timed out")), SIGN_IN_TIMEOUT_MS));
    const signIn = auth.signInAnonymously()
      .then(() => new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (!user) return;
          uid = user.uid;
          unsubscribe();
          resolve();
        });
      }));
    signedIn = Promise.race([signIn, timeout])
      .then(() => DistanceLearningStore.setFirebaseUid(uid))
      .catch((err) => {
        uid = null;
        console.error("DistanceLearningBoard: sign-in failed", err);
      });
    // After sign-in, not part of it: restore cloud high scores, then upload
    // anything pending (the whole local history on first connection).
    signedIn.then(async () => {
      if (!uid) return;
      await restorePlayer();
      await sync();
    });
  }

  // Brings back high scores from the cloud if this browser's localStorage
  // was cleared (the anonymous uid survives in Firebase's own storage).
  async function restorePlayer() {
    try {
      const doc = await db.collection(PLAYERS).doc(uid).get();
      if (doc.exists) DistanceLearningStore.mergeRemotePlayer(doc.data());
    } catch (err) {
      console.error("DistanceLearningBoard: restorePlayer failed", err);
    }
  }

  // Local-only bookkeeping that doesn't belong in Firestore.
  function forUpload(record) {
    const { syncedAt, startedAtMs, ...rest } = record;
    return rest;
  }

  // Uploads every unsynced run and attempt, then refreshes the player and
  // leaderboard documents. Safe to call any time; concurrent calls share
  // one run.
  function sync() {
    if (!online) return Promise.resolve();
    if (!syncing) {
      syncing = doSync().finally(() => { syncing = null; });
    }
    return syncing;
  }

  async function doSync() {
    await signedIn;
    if (!uid) return;
    const { runs, attempts } = DistanceLearningStore.getUnsynced();
    const player = DistanceLearningStore.getPlayer();
    const name = nickname(player);
    const playedAt = firebase.firestore.FieldValue.serverTimestamp();

    // One batch per run: the run plus its attempts, so they land together.
    // Attempts from a quiz abandoned mid-way (tab closed) have no run
    // record and go up on their own.
    const runIds = new Set([...runs.map((r) => r.runId), ...attempts.map((a) => a.runId)]);
    for (const runId of runIds) {
      const run = runs.find((r) => r.runId === runId);
      const runAttempts = attempts.filter((a) => a.runId === runId);
      for (let i = 0; i < Math.max(1, runAttempts.length); i += BATCH_LIMIT) {
        const chunk = runAttempts.slice(i, i + BATCH_LIMIT);
        const includeRun = run && i === 0;
        const batch = db.batch();
        if (includeRun) {
          batch.set(db.collection(RUNS).doc(runId), { ...forUpload(run), uid, nickname: name, playedAt });
        }
        chunk.forEach((a) => {
          batch.set(db.collection(ATTEMPTS).doc(a.attemptId), { ...forUpload(a), uid, uploadedAt: playedAt });
        });
        if (!includeRun && !chunk.length) continue;
        const ids = { runIds: includeRun ? [runId] : [], attemptIds: chunk.map((a) => a.attemptId) };
        try {
          await batch.commit();
          DistanceLearningStore.markSynced(ids);
        } catch (err) {
          // Runs and attempts can't be overwritten, so a retry of records
          // that did upload last time (but weren't marked, e.g. the tab
          // closed mid-sync) is rejected. Batches are all-or-nothing, so if
          // the first record exists the whole batch got there earlier.
          const probe = includeRun ? db.collection(RUNS).doc(runId) : db.collection(ATTEMPTS).doc(chunk[0].attemptId);
          try {
            if ((await probe.get()).exists) {
              DistanceLearningStore.markSynced(ids);
              continue;
            }
          } catch (probeErr) { /* fall through to logging the original error */ }
          console.error("DistanceLearningBoard: upload failed", runId, err);
          return; // try again next time rather than hammering a failing write
        }
      }
    }

    await writePlayerDocs(player, name);
  }

  async function writePlayerDocs(player, name) {
    if (!player.highScore) return; // nothing to rank until a quiz is finished
    const roundBest = {};
    Object.entries(player.roundHighScores).forEach(([key, v]) => { roundBest[key] = v.score; });
    const updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    try {
      await Promise.all([
        db.collection(PLAYERS).doc(uid).set({
          playerId: player.playerId,
          nickname: name,
          highScore: player.highScore.score,
          highScoreRoundKey: player.highScore.roundKey || null,
          roundHighScores: roundBest,
          totalRuns: player.totalRuns,
          totalAttempts: player.totalAttempts,
          createdAt: player.createdAt,
          updatedAt,
        }),
        db.collection(LEADERBOARD).doc(uid).set({
          nickname: name,
          bestScore: player.highScore.score,
          roundBest,
          totalRuns: player.totalRuns,
          updatedAt,
        }),
      ]);
    } catch (err) {
      console.error("DistanceLearningBoard: writePlayerDocs failed", err);
    }
  }

  // ---- Leaderboard ---------------------------------------------------------
  // Tabs: Overall (best score on any round) plus one per open round, each
  // ranked by that round's best. The top score is highlighted gold and the
  // viewer's own row blue.

  async function renderLeaderboard(listEl, tabKey, size) {
    listEl.innerHTML = '<p class="dl-lb-note">Loading&hellip;</p>';
    await signedIn;
    if (!uid) {
      listEl.innerHTML = '<p class="dl-lb-note">Could not connect to the leaderboard.</p>';
      return;
    }
    const field = tabKey === "overall" ? "bestScore" : `roundBest.${tabKey}`;
    try {
      const snap = await db.collection(LEADERBOARD).orderBy(field, "desc").limit(size).get();
      if (snap.empty) {
        listEl.innerHTML = '<p class="dl-lb-note">No scores yet — be the first!</p>';
        return;
      }
      const rows = snap.docs.map((doc, i) => {
        const d = doc.data();
        const score = tabKey === "overall" ? d.bestScore : d.roundBest[tabKey];
        const classes = [i === 0 ? "dl-lb-top" : "", doc.id === uid ? "dl-lb-me" : ""].join(" ");
        return `
          <tr class="${classes}">
            <td class="dl-lb-rank">${i === 0 ? "&#127942;" : i + 1}</td>
            <td class="dl-lb-name">${escapeHtml(d.nickname || "Anonymous")}</td>
            <td class="dl-lb-score">${Number.isInteger(score) ? score : score.toFixed(1)}</td>
            <td class="dl-lb-runs">${d.totalRuns ?? "&ndash;"}</td>
          </tr>`;
      }).join("");
      listEl.innerHTML = `
        <table class="dl-lb-table">
          <thead><tr><th>#</th><th>Name</th><th>Best</th><th>Runs</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    } catch (err) {
      listEl.innerHTML = '<p class="dl-lb-note">Could not load the leaderboard.</p>';
      console.error("DistanceLearningBoard: renderLeaderboard failed", err);
    }
  }

  // `tabs` is [{ key, label }], overall first. Opens on `initialKey`.
  function renderLeaderboardPanel(containerId, tabs, initialKey = "overall", size = LEADERBOARD_SIZE) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!online) {
      container.innerHTML = `<div class="dl-panel dl-lb-panel"><h3>Leaderboard</h3><p class="dl-lb-note">${OFFLINE_NOTE}</p></div>`;
      return;
    }
    container.innerHTML = `
      <div class="dl-panel dl-lb-panel">
        <h3>Leaderboard</h3>
        <div class="dl-lb-tabs">
          ${tabs.map((t) => `<button type="button" class="dl-lb-tab${t.key === initialKey ? " dl-lb-tab-active" : ""}" data-tab="${t.key}">${t.label}</button>`).join("")}
        </div>
        <div class="dl-lb-list"></div>
      </div>`;
    const listEl = container.querySelector(".dl-lb-list");
    container.querySelectorAll(".dl-lb-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".dl-lb-tab").forEach((b) => b.classList.toggle("dl-lb-tab-active", b === btn));
        renderLeaderboard(listEl, btn.dataset.tab, size);
      });
    });
    renderLeaderboard(listEl, initialKey, size);
  }

  // ---- Own data, for the Insights page ---------------------------------------
  // This player's uploaded runs and attempts, after uploading anything still
  // pending. Returns null when Firebase isn't available, so the caller can
  // fall back to localStorage alone.
  async function loadMyData() {
    if (!online) return null;
    await sync();
    if (!uid) return null;
    const [runs, attempts] = await Promise.all([
      db.collection(RUNS).where("uid", "==", uid).get(),
      db.collection(ATTEMPTS).where("uid", "==", uid).get(),
    ]);
    return { runs: runs.docs.map((d) => d.data()), attempts: attempts.docs.map((d) => d.data()) };
  }

  init();

  // Every document in a collection, PAGE docs at a time. Firestore refuses
  // any single query with a limit over 10,000 (the original single
  // limit(50000) attempts query failed every time), so read in pages
  // ordered by document id, which needs no index.
  async function readAll(collection) {
    const PAGE = 5000;
    const docs = [];
    let last = null;
    for (;;) {
      let query = db.collection(collection).orderBy(firebase.firestore.FieldPath.documentId()).limit(PAGE);
      if (last) query = query.startAfter(last);
      const snap = await query.get();
      snap.docs.forEach((d) => docs.push(d.data()));
      if (snap.docs.length < PAGE) return docs;
      last = snap.docs[snap.docs.length - 1];
    }
  }

  // Every player's runs and attempts — master accounts only (isMaster() in
  // firestore.rules; anyone else's read is refused). For the Insights
  // page's All Players / By Player views. Throws on failure so the page
  // can show why.
  async function loadAllData() {
    if (!online) throw new Error(OFFLINE_NOTE);
    await signedIn;
    if (!uid) throw new Error("Not signed in to Firebase.");
    const [runs, attempts] = await Promise.all([readAll(RUNS), readAll(ATTEMPTS)]);
    return { runs, attempts };
  }

  async function getUid() {
    await signedIn;
    return uid;
  }

  return { sync, renderLeaderboardPanel, loadMyData, loadAllData, getUid, offlineNote: online ? null : OFFLINE_NOTE };
})();
