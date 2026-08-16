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
  const DAILY_COLLECTION = "geostreakDaily";
  const RUNS_COLLECTION = "geostreakRuns";
  const PAGE_SIZE = 10;

  // "Today" is anchored to Central European time, not the viewer's own
  // timezone — a player in Tokyo and one in Toronto should agree on what
  // counts as today's leaderboard. Europe/Berlin rather than a hardcoded
  // UTC+2 so this stays correct across the CET/CEST daylight-saving
  // switch instead of quietly being an hour off every winter — same
  // technique ui.js's getOffsetSeconds() already uses for the main app.
  const DAILY_TIMEZONE = "Europe/Berlin";

  function todayDateStr() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: DAILY_TIMEZONE }).format(new Date());
  }

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
  // currentPage) reset to a blank slate every time the panel opens fresh,
  // or the Overall/Today tab switches, rather than trying to preserve a
  // page position across either. Overall and Today are different queries
  // over different collections, so each tracks its own cursor stack.
  let currentTab = "overall"; // "overall" | "today"
  const pagination = {
    overall: { cursors: [null], page: 0 },
    today: { cursors: [null], page: 0 },
  };

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
    const overallTabBtn = document.getElementById("gsLbTabOverall");
    const todayTabBtn = document.getElementById("gsLbTabToday");
    if (overallTabBtn) overallTabBtn.addEventListener("click", () => switchTab("overall"));
    if (todayTabBtn) todayTabBtn.addEventListener("click", () => switchTab("today"));
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

  // Same idea as submitScore(), but "best today" rather than "best ever":
  // one document per player per Central-European calendar day
  // (doc id "{uid}_{date}"), upserted the same way — rules reject the
  // write outright unless it's this player's own doc and the new streak
  // beats whatever's already stored for today. A new day means a new doc
  // id, so nothing has to be reset or rolled over at midnight; yesterday's
  // doc is simply never touched again.
  async function submitDailyScore(streak, stats) {
    if (!configured || streak <= 0) return;
    await ready;
    if (!uid) return;
    const date = todayDateStr();
    try {
      await db.collection(DAILY_COLLECTION).doc(`${uid}_${date}`).set({
        uid,
        nickname: getNickname(),
        bestStreak: streak,
        date,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error("Leaderboard: submitDailyScore failed", err);
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

  // Fetches PAGE_SIZE rows for `pageIndex` of the given tab, plus one
  // extra (PAGE_SIZE + 1 total) purely to answer "is there a page after
  // this one?" cheaply — Firestore has no free row-count, so the
  // alternative would be a whole separate query just to know whether to
  // show a Next button. "today" adds a date equality filter on top of the
  // same orderBy, which — unlike "overall"'s single-field sort — needs a
  // composite index; see the README's Leaderboard section for the
  // one-time console step that creates it.
  async function fetchLeaderboardPage(tab, pageIndex) {
    let query = tab === "today"
      ? db.collection(DAILY_COLLECTION).where("date", "==", todayDateStr()).orderBy("bestStreak", "desc")
      : db.collection(COLLECTION).orderBy("bestStreak", "desc");
    const cursor = pagination[tab].cursors[pageIndex];
    if (cursor) query = query.startAfter(cursor);
    const snap = await query.limit(PAGE_SIZE + 1).get();
    const hasNext = snap.docs.length > PAGE_SIZE;
    const pageDocs = snap.docs.slice(0, PAGE_SIZE);
    // Remember where the *next* page starts, but only the first time we
    // see it — re-deriving it on every visit to this page would be wasted
    // work since the cursor (a specific document) doesn't change.
    if (hasNext && !pagination[tab].cursors[pageIndex + 1]) {
      pagination[tab].cursors[pageIndex + 1] = pageDocs[pageDocs.length - 1];
    }
    return { pageDocs, hasNext };
  }

  // Pagination controls only appear once they'd actually do something —
  // a leaderboard with 10 or fewer entries has nothing to page through.
  function renderPagination(container, tab, pageIndex, hasNext) {
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
    if (prevBtn) prevBtn.addEventListener("click", () => renderPage(listEl, tab, pageIndex - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => renderPage(listEl, tab, pageIndex + 1));
  }

  async function renderPage(container, tab, pageIndex) {
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
      const { pageDocs, hasNext } = await fetchLeaderboardPage(tab, pageIndex);
      if (pageDocs.length === 0) {
        container.innerHTML = pageIndex === 0
          ? `<p class="gs-leaderboard-note">${tab === "today" ? "No one's played today yet — be the first!" : "No scores yet — be the first!"}</p>`
          : '<p class="gs-leaderboard-note">No more scores.</p>';
        return;
      }
      pagination[tab].page = pageIndex;
      const startRank = pageIndex * PAGE_SIZE + 1;
      const rows = pageDocs.map((doc, i) => renderRow(doc, startRank + i)).join("");
      container.innerHTML = `<ul class="gs-leaderboard-list">${rows}</ul>`;
      renderPagination(paginationEl, tab, pageIndex, hasNext);
    } catch (err) {
      container.innerHTML = '<p class="gs-leaderboard-note">Could not load leaderboard.</p>';
      console.error("Leaderboard: renderPage failed", err);
    }
  }

  function switchTab(tab) {
    if (tab === currentTab) return;
    currentTab = tab;
    const overallBtn = document.getElementById("gsLbTabOverall");
    const todayBtn = document.getElementById("gsLbTabToday");
    if (overallBtn) overallBtn.classList.toggle("gs-tab-active", tab === "overall");
    if (todayBtn) todayBtn.classList.toggle("gs-tab-active", tab === "today");
    renderPage(document.getElementById("gsLeaderboardList"), tab, 0);
  }

  // Shown/hidden alongside the local insights panel (start, pause and
  // game-over states) — never during an active round. Re-fetches on every
  // show, so returning to a non-playing screen picks up other players'
  // scores since you last looked, not just your own. Always reopens on
  // the Overall tab, page 1 — cursors and tab choice from a previous visit
  // this session are stale enough (the ranking could easily have changed)
  // that starting over is simpler and more correct than trying to
  // preserve exactly where you left off.
  function showPanel() {
    const panel = document.getElementById("gsLeaderboard");
    if (!panel) return;
    panel.style.display = "block";
    currentTab = "overall";
    pagination.overall = { cursors: [null], page: 0 };
    pagination.today = { cursors: [null], page: 0 };
    const overallBtn = document.getElementById("gsLbTabOverall");
    const todayBtn = document.getElementById("gsLbTabToday");
    if (overallBtn) overallBtn.classList.add("gs-tab-active");
    if (todayBtn) todayBtn.classList.remove("gs-tab-active");
    renderPage(document.getElementById("gsLeaderboardList"), "overall", 0);
  }

  function hidePanel() {
    const panel = document.getElementById("gsLeaderboard");
    if (panel) panel.style.display = "none";
  }

  return { init, submitScore, submitDailyScore, submitRunHistory, showPanel, hidePanel };
})();

if (document.getElementById("gsLeaderboard")) {
  Leaderboard.init();
}
