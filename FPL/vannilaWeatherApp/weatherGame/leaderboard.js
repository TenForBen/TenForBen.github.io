// GeoStreak's online leaderboard — Firebase Firestore on the free Spark
// plan, so it's entirely client-judged: the browser still decides
// correct/incorrect exactly as before, and only the final streak gets
// shared. That means it's gameable via devtools the same way the
// "just edit localStorage" version already was — see firestore.rules and
// the README's Leaderboard section for exactly what it does and doesn't
// protect against, and what it would take to close that gap properly.
//
// Entirely optional: if firebaseConfig.js still has its REPLACE_ME
// placeholders, every function here no-ops and the leaderboard panel shows
// a "not configured" note instead of breaking the rest of the game.
//
// Guarded on #gsLeaderboard so this file can also be safely included on a
// page that doesn't have one, same convention app.js uses for its two
// init functions.
const Leaderboard = (() => {
  const NICKNAME_KEY = "geoStreakGame_nickname";
  const COLLECTION = "geostreakLeaderboard";
  const RUNS_COLLECTION = "geostreakRuns";
  const PAGE_SIZE = 10;

  const configured = typeof firebaseConfig !== "undefined"
    && firebaseConfig.apiKey
    && !firebaseConfig.apiKey.startsWith("REPLACE_ME");

  let db = null;
  let uid = null;
  // Resolves once anonymous sign-in has produced a uid — every read/write
  // below awaits this first, so a call made right on page load doesn't
  // race the auth handshake.
  let ready = Promise.resolve();

  // pageCursors[i] is the document to startAfter() when fetching page i —
  // pageCursors[0] is always null (the first page needs no cursor).
  // Firestore has no cheap "give me page N directly" query, so paging
  // backward means walking back through cursors already seen this panel
  // session rather than re-deriving them, which is why this (and
  // currentPage) reset to a blank slate every time the panel opens fresh
  // rather than trying to persist across views.
  let pageCursors = [null];
  let currentPage = 0;

  function randomNickname() {
    return `Player${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function getNickname() {
    return localStorage.getItem(NICKNAME_KEY) || randomNickname();
  }

  // Whether a name has ever actually been saved — getNickname() always
  // returns *something* (falling back to a random one), so this is the
  // only reliable way to tell "never set" apart from "set, and it just
  // happens to be this one".
  function hasNickname() {
    return !!localStorage.getItem(NICKNAME_KEY);
  }

  function setNickname(name) {
    const trimmed = name.trim().slice(0, 20);
    if (trimmed) localStorage.setItem(NICKNAME_KEY, trimmed);
    return getNickname();
  }

  function init() {
    // Wired up either way — saving a nickname locally is harmless even
    // before Firebase is configured, and it means the name's already set
    // the moment someone does fill in firebaseConfig.js.
    wireNicknameInput();
    if (!configured) return;
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    const auth = firebase.auth();

    ready = auth.signInAnonymously()
      .then(() => new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (!user) return;
          uid = user.uid;
          unsubscribe();
          resolve();
        });
      }))
      .catch((err) => {
        // Offline, blocked by an extension, project misconfigured, etc. —
        // the leaderboard just silently stays empty; nothing else in the
        // game depends on this promise resolving.
        console.error("Leaderboard: anonymous sign-in failed", err);
      });
  }

  // The one-time setup row (#gsPlayerBar, above the search box) versus the
  // permanent header display (#gsHeaderNicknameWrap) are mutually
  // exclusive — exactly one is showing at any moment, toggled by whether
  // a name has actually been saved yet, or by clicking "change".
  function showSetupRow() {
    const bar = document.getElementById("gsPlayerBar");
    const headerWrap = document.getElementById("gsHeaderNicknameWrap");
    if (bar) bar.style.display = "block";
    if (headerWrap) headerWrap.style.display = "none";
  }

  function showHeaderDisplay() {
    const bar = document.getElementById("gsPlayerBar");
    const headerWrap = document.getElementById("gsHeaderNicknameWrap");
    const headerName = document.getElementById("gsHeaderNickname");
    if (bar) bar.style.display = "none";
    if (headerWrap) headerWrap.style.display = "flex";
    if (headerName) headerName.textContent = getNickname();
  }

  function wireNicknameInput() {
    const input = document.getElementById("gsNickname");
    const saveBtn = document.getElementById("gsNicknameSave");
    const changeLink = document.getElementById("gsChangeNickname");
    if (!input || !saveBtn) return;

    input.value = getNickname();
    if (hasNickname()) {
      showHeaderDisplay();
    } else {
      showSetupRow();
    }

    saveBtn.addEventListener("click", () => {
      input.value = setNickname(input.value);
      showHeaderDisplay();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveBtn.click();
    });
    if (changeLink) {
      changeLink.addEventListener("click", (e) => {
        e.preventDefault(); // it's a styling convenience, not a real link
        showSetupRow();
        input.focus();
        input.select();
      });
    }
  }

  // Called once a run ends. Only writes on a positive streak — a losing
  // run's final number is never itself a personal best worth recording.
  // The write can still be rejected outright by firestore.rules if it
  // doesn't actually beat this player's stored bestStreak; that's the
  // real gate, not anything checked here.
  async function submitScore(streak, stats) {
    if (!configured || streak <= 0) return;
    await ready;
    if (!uid) return;
    try {
      await db.collection(COLLECTION).doc(uid).set({
        nickname: getNickname(),
        bestStreak: streak,
        totalCorrect: stats.totalCorrect,
        totalAttempts: stats.totalAttempts,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      // Most commonly: rules rejected a non-improving score, or the
      // player's offline. Either way, failing silently is correct here —
      // a rejected background write shouldn't interrupt the game.
      console.error("Leaderboard: submitScore failed", err);
    }
  }

  // Called once a run ends, regardless of streak — unlike submitScore(),
  // even a zero/immediate-loss run is worth recording, since the whole
  // point (see history.html) is being able to look back at *every*
  // attempt, not just the good ones. One document per run, written once,
  // with every round embedded as a plain array field — not one write per
  // round, and not a subcollection either, both of which would multiply
  // the write/read cost for no real benefit at this scale. See the
  // README's Leaderboard section for the actual read/write numbers this
  // adds up to.
  async function submitRunHistory(streak, reason, rounds) {
    if (!configured) return;
    await ready;
    if (!uid) return;
    try {
      await db.collection(RUNS_COLLECTION).add({
        uid,
        nickname: getNickname(),
        finalStreak: streak,
        reason: reason === "time" ? "time" : "wrong",
        roundCount: rounds.length,
        rounds,
        playedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      // Same "fail silently" reasoning as submitScore() — a background
      // write that didn't make it shouldn't interrupt Game Over.
      console.error("Leaderboard: submitRunHistory failed", err);
    }
  }

  function renderRow(doc, rank) {
    const d = doc.data();
    const accuracy = d.totalAttempts
      ? `${Math.round((d.totalCorrect / d.totalAttempts) * 100)}%`
      : "—";
    const mine = doc.id === uid ? " gs-leaderboard-me" : "";
    return `
      <li class="${mine}">
        <span class="gs-leaderboard-rank">${rank}</span>
        <span class="gs-leaderboard-name">${escapeHtml(d.nickname || "Anonymous")}</span>
        <span class="gs-leaderboard-streak">${d.bestStreak}</span>
        <span class="gs-leaderboard-accuracy">${accuracy}</span>
      </li>
    `;
  }

  // Fetches PAGE_SIZE rows for `pageIndex`, plus one extra (PAGE_SIZE + 1
  // total) purely to answer "is there a page after this one?" cheaply —
  // Firestore has no free row-count, so the alternative would be a whole
  // separate query just to know whether to show a Next button.
  async function fetchLeaderboardPage(pageIndex) {
    let query = db.collection(COLLECTION).orderBy("bestStreak", "desc");
    if (pageCursors[pageIndex]) query = query.startAfter(pageCursors[pageIndex]);
    const snap = await query.limit(PAGE_SIZE + 1).get();
    const hasNext = snap.docs.length > PAGE_SIZE;
    const pageDocs = snap.docs.slice(0, PAGE_SIZE);
    // Remember where the *next* page starts, but only the first time we
    // see it — re-deriving it on every visit to this page would be wasted
    // work since the cursor (a specific document) doesn't change.
    if (hasNext && !pageCursors[pageIndex + 1]) {
      pageCursors[pageIndex + 1] = pageDocs[pageDocs.length - 1];
    }
    return { pageDocs, hasNext };
  }

  // Pagination controls only appear once they'd actually do something —
  // a leaderboard with 10 or fewer entries has nothing to page through.
  function renderPagination(container, pageIndex, hasNext) {
    if (!container) return;
    if (pageIndex === 0 && !hasNext) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = `
      <button type="button" id="gsLbPrev" class="gs-page-btn" ${pageIndex === 0 ? "disabled" : ""}>&larr; Prev</button>
      <span class="gs-page-label">Page ${pageIndex + 1}</span>
      <button type="button" id="gsLbNext" class="gs-page-btn" ${hasNext ? "" : "disabled"}>Next &rarr;</button>
    `;
    const listEl = document.getElementById("gsLeaderboardList");
    const prevBtn = document.getElementById("gsLbPrev");
    const nextBtn = document.getElementById("gsLbNext");
    if (prevBtn) prevBtn.addEventListener("click", () => renderPage(listEl, pageIndex - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => renderPage(listEl, pageIndex + 1));
  }

  async function renderPage(container, pageIndex) {
    if (!container) return;
    const paginationEl = document.getElementById("gsLeaderboardPagination");
    if (!configured) {
      container.innerHTML = '<p class="gs-leaderboard-note">Leaderboard not configured yet — see firebaseConfig.js.</p>';
      return;
    }
    container.innerHTML = '<p class="gs-leaderboard-note">Loading&hellip;</p>';
    if (paginationEl) paginationEl.innerHTML = "";
    await ready;
    if (!uid) {
      container.innerHTML = '<p class="gs-leaderboard-note">Could not connect to the leaderboard.</p>';
      return;
    }
    try {
      const { pageDocs, hasNext } = await fetchLeaderboardPage(pageIndex);
      if (pageDocs.length === 0) {
        container.innerHTML = pageIndex === 0
          ? '<p class="gs-leaderboard-note">No scores yet — be the first!</p>'
          : '<p class="gs-leaderboard-note">No more scores.</p>';
        return;
      }
      currentPage = pageIndex;
      const startRank = pageIndex * PAGE_SIZE + 1;
      const rows = pageDocs.map((doc, i) => renderRow(doc, startRank + i)).join("");
      container.innerHTML = `<ul class="gs-leaderboard-list">${rows}</ul>`;
      renderPagination(paginationEl, pageIndex, hasNext);
    } catch (err) {
      container.innerHTML = '<p class="gs-leaderboard-note">Could not load leaderboard.</p>';
      console.error("Leaderboard: renderPage failed", err);
    }
  }

  // Shown/hidden alongside the local insights panel (start, pause and
  // game-over states) — never during an active round. Re-fetches on every
  // show, so returning to a non-playing screen picks up other players'
  // scores since you last looked, not just your own. Always reopens on
  // page 1 — cursors from a previous visit this session are stale enough
  // (the ranking could easily have changed) that starting over is simpler
  // and more correct than trying to preserve a page position.
  function showPanel() {
    const panel = document.getElementById("gsLeaderboard");
    if (!panel) return;
    panel.style.display = "block";
    pageCursors = [null];
    currentPage = 0;
    renderPage(document.getElementById("gsLeaderboardList"), 0);
  }

  function hidePanel() {
    const panel = document.getElementById("gsLeaderboard");
    if (panel) panel.style.display = "none";
  }

  return { init, submitScore, submitRunHistory, showPanel, hidePanel };
})();

if (document.getElementById("gsLeaderboard")) {
  Leaderboard.init();
}
