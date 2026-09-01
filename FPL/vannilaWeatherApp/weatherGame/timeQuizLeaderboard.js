// Time Quiz's online leaderboard, run history, and global tally insights —
// same Firebase project as GeoStreak's leaderboard.js, adapted for a fixed
// 15-question quiz-and-score game instead of an open-ended streak. A
// separate file (not a shared import) for the same reason historyPage.js
// duplicates its own escapeHtml/flagEmoji rather than loading ui.js: this
// project has no build step, and timeQuiz.html is its own page load with
// its own Firebase app instance.
//
// The player identity itself is NOT separate from GeoStreak's — anonymous
// auth persists per browser (not per page), so signing in here on
// timeQuiz.html resolves to the exact same uid GeoStreak's leaderboard.js
// already established, and the nickname lives in the same
// localStorage["geoStreakGame_nickname"] key both pages read. A brand-new
// visitor who lands on Time Quiz first (never having opened GeoStreak) is
// still asked to name themselves here — see wireNicknameInput() below —
// exactly like GeoStreak's own first-visit flow.
//
// Entirely optional, same guard as leaderboard.js: if firebaseConfig.js
// still has its REPLACE_ME placeholders, every function here no-ops.
const TimeQuizBoard = (() => {
  const NICKNAME_KEY = "geoStreakGame_nickname";
  const LEADERBOARD_COLLECTION = "timeQuizLeaderboard";
  const DAILY_COLLECTION = "timeQuizDaily";
  const RUNS_COLLECTION = "timeQuizRuns";
  const CITY_TALLY_COLLECTION = "timeQuizCityTally";
  const COUNTRY_TALLY_COLLECTION = "timeQuizCountryTally";
  // Same hardcoded allowlist as historyPage.js's/timeQuizHistoryPage.js's
  // own MASTER_UIDS — a third independent copy, kept in sync by hand
  // (there's no shared source between three separate self-contained page
  // scripts). Gates which half of the Insights panel a viewer sees: Top
  // Countries for everyone, Top Cities for masters only — see
  // renderInsights() below.
  const MASTER_UIDS = ["B0N7TfmkrXTaYjB2TBCVOBVtIhM2", "MsRKlqcPecOBng8SHekRF5YCVFJ3", "WmoVyIkr2eVCtQHMPwoiTnKWZQp1", "M9odxs0JSTPAnFuewYOCB2BEPR03"];
  const PLAYERS_COLLECTION = "timeQuizPlayers";
  const PAGE_SIZE = 10;
  const BEST_RUNS_LOOKBACK = 50; // most-recent runs fetched to derive "best 10" client-side — see showMyBestRuns()
  const INSIGHT_PAGE_SIZE = 10;

  // Same Europe/Berlin-anchored "today" as GeoStreak's leaderboard.js —
  // see that file's DAILY_TIMEZONE comment for why a fixed zone instead of
  // the viewer's own.
  const DAILY_TIMEZONE = "Europe/Berlin";
  function todayDateStr() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: DAILY_TIMEZONE }).format(new Date());
  }

  const configured = typeof firebaseConfig !== "undefined"
    && firebaseConfig.apiKey
    && !firebaseConfig.apiKey.startsWith("REPLACE_ME");

  let db = null;
  let uid = null;
  let ready = Promise.resolve();

  const pagination = {
    overall: { cursors: [null], page: 0 },
    today: { cursors: [null], page: 0 },
  };
  let currentTab = "overall";

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));
  }

  function randomNickname() {
    return `Player${Math.floor(1000 + Math.random() * 9000)}`;
  }
  function getNickname() {
    return localStorage.getItem(NICKNAME_KEY) || randomNickname();
  }
  function hasNickname() {
    return !!localStorage.getItem(NICKNAME_KEY);
  }
  function setNickname(name) {
    const trimmed = name.trim().slice(0, 20);
    if (trimmed) localStorage.setItem(NICKNAME_KEY, trimmed);
    return getNickname();
  }

  function init() {
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
        console.error("TimeQuizBoard: anonymous sign-in failed", err);
      });
  }

  // Same toggle GeoStreak's own leaderboard.js uses: a one-time setup row
  // (#tqPlayerBar, static markup above #tqStart in timeQuiz.html — NOT
  // rebuilt by renderStart(), so it survives across screens the same way
  // GeoStreak's #gsPlayerBar does) shown only until a name is actually
  // saved, then replaced for good by a small header chip
  // (#tqHeaderNicknameWrap) with a "change" link that brings the setup
  // row back on demand. Exactly one of the two shows at any moment.
  function showSetupRow() {
    const bar = document.getElementById("tqPlayerBar");
    const headerWrap = document.getElementById("tqHeaderNicknameWrap");
    if (bar) bar.style.display = "block";
    if (headerWrap) headerWrap.style.display = "none";
  }

  function showHeaderDisplay() {
    const bar = document.getElementById("tqPlayerBar");
    const headerWrap = document.getElementById("tqHeaderNicknameWrap");
    const headerName = document.getElementById("tqHeaderNickname");
    if (bar) bar.style.display = "none";
    if (headerWrap) headerWrap.style.display = "flex";
    if (headerName) headerName.textContent = getNickname();
  }

  // Called once, at page load (from timeQuiz.js's own init(), not
  // TimeQuizBoard's own init() — that one only handles Firebase/auth
  // setup and runs before timeQuiz.js has an onSave callback ready to
  // pass in). `onSave(newName)` lets the caller keep its own cached copy
  // of the nickname (timeQuiz.js reads it once at load, same reasoning
  // leaderboard.js's own comment gives — a fresh getNickname() call would
  // hand back a *different* random placeholder each time nothing's been
  // saved yet) in sync the moment a name is actually saved here.
  function wireNicknameInput(onSave) {
    const input = document.getElementById("tqNickname");
    const saveBtn = document.getElementById("tqNicknameSave");
    const changeLink = document.getElementById("tqChangeNickname");
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
      if (onSave) onSave(input.value);
    });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") saveBtn.click(); });
    if (changeLink) {
      changeLink.addEventListener("click", (e) => {
        e.preventDefault(); // it's a styling convenience, not a real link
        showSetupRow();
        input.focus();
        input.select();
      });
    }
  }

  // Doc id for the shared city-tally counter — Firestore ids can't contain
  // "/" and a raw city name could have almost anything in it, so this
  // slugs "country_city" down to [a-z0-9_] rather than trusting the raw
  // string. Different-cased spellings of the same city collapse into one
  // doc, which is the point; OpenWeatherMap's own resolved `name` is
  // consistent enough in practice that this never fragments a real city
  // across multiple docs.
  function tallyDocId(country, city) {
    const raw = `${country}_${city}`.toLowerCase();
    const slug = raw.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return slug.slice(0, 300) || "unknown";
  }

  // Called once per accepted (resolved, non-duplicate) answer, correct or
  // not — "used as an answer" is the bar, same moment timeQuiz.js already
  // updates its own per-quiz `countryCities` tally. Fire-and-forget: a
  // failed increment (offline, rules rejected a malformed write) shouldn't
  // interrupt the quiz, same "fail silently" reasoning as every other
  // background write in this project.
  async function recordCityUsage(city, country) {
    if (!configured || !city || !country) return;
    await ready;
    if (!uid) return;
    const cc = String(country).toUpperCase();
    const cityDocId = tallyDocId(cc, city);
    const now = firebase.firestore.FieldValue.serverTimestamp();
    const inc = firebase.firestore.FieldValue.increment(1);
    try {
      await Promise.all([
        db.collection(CITY_TALLY_COLLECTION).doc(cityDocId).set(
          { city, country: cc, count: inc, lastUsedAt: now },
          { merge: true },
        ),
        db.collection(COUNTRY_TALLY_COLLECTION).doc(cc).set(
          { country: cc, count: inc, lastUsedAt: now },
          { merge: true },
        ),
      ]);
    } catch (err) {
      console.error("TimeQuizBoard: recordCityUsage failed", err);
    }
  }

  const DEFAULT_PLAYER_STATE = {
    bestScore: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    totalRuns: 0,
    stageIndex: 0,
  };

  // Replaces this page's old localStorage-backed state entirely — best
  // score, lifetime counters, and progress through timeQuiz.js's STAGES
  // campaign all live in one `timeQuizPlayers/{uid}` document now.
  // Fetched exactly once per page load (timeQuiz.js caches the result in
  // memory and mutates it in place through a finished quiz, see
  // savePlayerState() below), not re-read on every render. Falls back to
  // a fresh, all-zero state whenever there's nothing to read yet — not
  // configured, offline, or a genuinely new player with no doc.
  //
  // A doc written before stages were linear has `regionsUnlocked`/
  // `lastRegions` instead of `stageIndex` — migrated one-way, once, right
  // here: a player who'd already unlocked every region under the old
  // system starts at stage 1 (India) rather than back at square one;
  // everyone else starts at 0 (World). There's no way to know which
  // *specific* stage an old "everything unlocked" player would have
  // reached under the new linear rule, so this is a judgment call, not a
  // precise migration.
  async function loadPlayerState() {
    if (!configured) return { ...DEFAULT_PLAYER_STATE };
    await ready;
    if (!uid) return { ...DEFAULT_PLAYER_STATE };
    try {
      const doc = await db.collection(PLAYERS_COLLECTION).doc(uid).get();
      if (!doc.exists) return { ...DEFAULT_PLAYER_STATE };
      const d = doc.data();
      const stageIndex = typeof d.stageIndex === "number"
        ? d.stageIndex
        : (d.regionsUnlocked ? 1 : 0);
      return {
        bestScore: d.bestScore || 0,
        totalCorrect: d.totalCorrect || 0,
        totalAttempts: d.totalAttempts || 0,
        totalRuns: d.totalRuns || 0,
        stageIndex,
      };
    } catch (err) {
      console.error("TimeQuizBoard: loadPlayerState failed", err);
      return { ...DEFAULT_PLAYER_STATE };
    }
  }

  // One write per finished quiz — `state` is the caller's own in-memory
  // copy, already updated (bestScore/totals/stageIndex all reflect the
  // quiz that just ended) before this is called, not re-derived here.
  // Fire-and-forget, same "shouldn't block or interrupt the results
  // screen" reasoning as every other background write in this file — a
  // failed write just means this session's in-memory copy is ahead of
  // what's stored; the next page load (or another device) would miss the
  // update, not this one.
  //
  // A full `.set(state)`, deliberately NOT `{merge: true}` — this always
  // sends the complete current state, so there's nothing to merge, and a
  // plain set() actually REPLACES the document. That matters for a
  // player migrating off the old regionsUnlocked/lastRegions shape: a
  // merge would leave those old fields sitting in the stored document
  // forever (merge only touches the keys you send), which would make
  // firestore.rules' isValidPlayerState() hasOnly() check fail on every
  // future write. A full replace clears them out in one shot.
  async function savePlayerState(state) {
    if (!configured) return;
    await ready;
    if (!uid) return;
    try {
      await db.collection(PLAYERS_COLLECTION).doc(uid).set({
        bestScore: state.bestScore,
        totalCorrect: state.totalCorrect,
        totalAttempts: state.totalAttempts,
        totalRuns: state.totalRuns,
        stageIndex: state.stageIndex,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error("TimeQuizBoard: savePlayerState failed", err);
    }
  }

  async function submitScore(score, stats) {
    if (!configured || score <= 0) return;
    await ready;
    if (!uid) return;
    try {
      await db.collection(LEADERBOARD_COLLECTION).doc(uid).set({
        nickname: getNickname(),
        bestScore: score,
        totalCorrect: stats.totalCorrect,
        totalAttempts: stats.totalAttempts,
        totalRuns: stats.totalRuns,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error("TimeQuizBoard: submitScore failed", err);
    }
  }

  async function submitDailyScore(score, stats) {
    if (!configured || score <= 0) return;
    await ready;
    if (!uid) return;
    const date = todayDateStr();
    try {
      await db.collection(DAILY_COLLECTION).doc(`${uid}_${date}`).set({
        uid,
        nickname: getNickname(),
        bestScore: score,
        totalCorrect: stats.totalCorrect,
        totalAttempts: stats.totalAttempts,
        totalRuns: stats.totalRuns,
        date,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error("TimeQuizBoard: submitDailyScore failed", err);
    }
  }

  // Unconditional, every finished quiz regardless of score — same as
  // GeoStreak's submitRunHistory(), the point being a complete attempt
  // log, not just the good ones.
  async function submitRunHistory(score, correctCount, questionCount, regionLabels, rounds) {
    if (!configured) return;
    await ready;
    if (!uid) return;
    try {
      await db.collection(RUNS_COLLECTION).add({
        uid,
        nickname: getNickname(),
        score,
        correctCount,
        questionCount,
        regions: regionLabels,
        rounds,
        playedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error("TimeQuizBoard: submitRunHistory failed", err);
    }
  }

  function renderRow(doc, rank) {
    const d = doc.data();
    const runs = typeof d.totalRuns === "number" ? d.totalRuns : null;
    const correct = typeof d.totalCorrect === "number" ? d.totalCorrect : null;
    const avg = runs && correct != null ? (correct / runs).toFixed(1) : "—";
    const mine = doc.id === uid ? " tq-leaderboard-me" : "";
    return `
      <li class="${mine}">
        <span class="tq-leaderboard-rank">${rank}</span>
        <span class="tq-leaderboard-name">${escapeHtml(d.nickname || "Anonymous")}</span>
        <span class="tq-leaderboard-streak" title="Best score">${d.bestScore.toLocaleString()}</span>
        <span class="tq-leaderboard-runs" title="Total quizzes">${runs ?? "—"}</span>
        <span class="tq-leaderboard-correct" title="Total correct">${correct ?? "—"}</span>
        <span class="tq-leaderboard-avg" title="Correct ÷ quizzes">${avg}</span>
      </li>
    `;
  }

  // Same paging idea as leaderboard.js's fetchLeaderboardPage() — PAGE_SIZE
  // + 1 to cheaply learn whether a next page exists, cursors remembered
  // per tab rather than re-derived.
  async function fetchLeaderboardPage(tab, pageIndex) {
    let query = tab === "today"
      ? db.collection(DAILY_COLLECTION).where("date", "==", todayDateStr()).orderBy("bestScore", "desc")
      : db.collection(LEADERBOARD_COLLECTION).orderBy("bestScore", "desc");
    const cursor = pagination[tab].cursors[pageIndex];
    if (cursor) query = query.startAfter(cursor);
    const snap = await query.limit(PAGE_SIZE + 1).get();
    const hasNext = snap.docs.length > PAGE_SIZE;
    const pageDocs = snap.docs.slice(0, PAGE_SIZE);
    if (hasNext && !pagination[tab].cursors[pageIndex + 1]) {
      pagination[tab].cursors[pageIndex + 1] = pageDocs[pageDocs.length - 1];
    }
    return { pageDocs, hasNext };
  }

  function renderPagination(container, tab, pageIndex, hasNext) {
    if (!container) return;
    if (pageIndex === 0 && !hasNext) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = `
      <button type="button" id="tqLbPrev" class="tq-page-btn" ${pageIndex === 0 ? "disabled" : ""}>&larr; Prev</button>
      <span class="tq-page-label">Page ${pageIndex + 1}</span>
      <button type="button" id="tqLbNext" class="tq-page-btn" ${hasNext ? "" : "disabled"}>Next &rarr;</button>
    `;
    const listEl = document.getElementById("tqLeaderboardList");
    const prevBtn = document.getElementById("tqLbPrev");
    const nextBtn = document.getElementById("tqLbNext");
    if (prevBtn) prevBtn.addEventListener("click", () => renderPage(listEl, tab, pageIndex - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => renderPage(listEl, tab, pageIndex + 1));
  }

  async function renderPage(container, tab, pageIndex) {
    if (!container) return;
    const paginationEl = document.getElementById("tqLeaderboardPagination");
    if (!configured) {
      container.innerHTML = '<p class="tq-leaderboard-note">Leaderboard not configured yet.</p>';
      return;
    }
    container.innerHTML = '<p class="tq-leaderboard-note">Loading&hellip;</p>';
    if (paginationEl) paginationEl.innerHTML = "";
    await ready;
    if (!uid) {
      container.innerHTML = '<p class="tq-leaderboard-note">Could not connect to the leaderboard.</p>';
      return;
    }
    try {
      const { pageDocs, hasNext } = await fetchLeaderboardPage(tab, pageIndex);
      if (pageDocs.length === 0) {
        container.innerHTML = pageIndex === 0
          ? `<p class="tq-leaderboard-note">${tab === "today" ? "No one's played today yet — be the first!" : "No scores yet — be the first!"}</p>`
          : '<p class="tq-leaderboard-note">No more scores.</p>';
        return;
      }
      const startRank = pageIndex * PAGE_SIZE + 1;
      const rows = pageDocs.map((doc, i) => renderRow(doc, startRank + i)).join("");
      container.innerHTML = `<ul class="tq-leaderboard-list">${rows}</ul>`;
      renderPagination(paginationEl, tab, pageIndex, hasNext);
    } catch (err) {
      // Today's query (date == X + orderBy bestScore) needs a composite
      // index Firestore doesn't build automatically — until it's created
      // (see the README's Leaderboard, Run History & Insights section)
      // every load of this tab fails this way, which otherwise looks
      // identical to "nobody's played today," not an error. Same
      // failed-precondition handling historyPage.js's own
      // reportLoadError() already uses for the same reason.
      container.innerHTML = err && err.code === "failed-precondition"
        ? '<p class="tq-leaderboard-note">This needs a Firestore index — open the browser console for a one-click link to create it.</p>'
        : '<p class="tq-leaderboard-note">Could not load leaderboard.</p>';
      console.error("TimeQuizBoard: renderPage failed", err);
    }
  }

  function switchTab(tab) {
    if (tab === currentTab) return;
    currentTab = tab;
    const overallBtn = document.getElementById("tqLbTabOverall");
    const todayBtn = document.getElementById("tqLbTabToday");
    if (overallBtn) overallBtn.classList.toggle("tq-tab-active", tab === "overall");
    if (todayBtn) todayBtn.classList.toggle("tq-tab-active", tab === "today");
    renderPage(document.getElementById("tqLeaderboardList"), tab, 0);
  }

  // Renders the whole leaderboard panel (tabs + list + pagination) into a
  // container the caller already put in the DOM — unlike GeoStreak's
  // version, this page has no single static #gsLeaderboard shell to toggle
  // show/hide on, since tqStart/tqFinal rebuild their own innerHTML each
  // render. Always reopens on Overall, page 1, same reasoning as
  // leaderboard.js's showPanel().
  function renderLeaderboardPanel(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
      <div class="tq-panel">
        <h3>Leaderboard</h3>
        <div class="tq-leaderboard-tabs">
          <button type="button" id="tqLbTabOverall" class="tq-tab-btn tq-tab-active">Overall</button>
          <button type="button" id="tqLbTabToday" class="tq-tab-btn">Today</button>
        </div>
        <ul class="tq-leaderboard-list tq-leaderboard-header-list">
          <li class="tq-leaderboard-header-row">
            <span class="tq-leaderboard-rank">#</span>
            <span class="tq-leaderboard-name">Name</span>
            <span class="tq-leaderboard-streak" title="Best score">Score</span>
            <span class="tq-leaderboard-runs" title="Total quizzes">Runs</span>
            <span class="tq-leaderboard-correct" title="Total correct">Cor</span>
            <span class="tq-leaderboard-avg" title="Correct ÷ quizzes">Avg</span>
          </li>
        </ul>
        <div id="tqLeaderboardList"></div>
        <div id="tqLeaderboardPagination" class="tq-lb-pagination"></div>
      </div>
    `;
    currentTab = "overall";
    pagination.overall = { cursors: [null], page: 0 };
    pagination.today = { cursors: [null], page: 0 };
    document.getElementById("tqLbTabOverall").addEventListener("click", () => switchTab("overall"));
    document.getElementById("tqLbTabToday").addEventListener("click", () => switchTab("today"));
    renderPage(document.getElementById("tqLeaderboardList"), "overall", 0);
  }

  // "Your Best 10" — rather than a second query (uid + score, its own
  // composite index on top of the uid + playedAt one History already
  // needs), this fetches the BEST_RUNS_LOOKBACK most recent runs and sorts
  // by score client-side, same reasoning historyPage.js's own "personal
  // best doesn't need a second query" comment gives for a single best run:
  // indistinguishable from a true all-time top 10 for any realistic amount
  // of play, only wrong once more than BEST_RUNS_LOOKBACK quizzes have
  // been played since an old top-10 run.
  async function renderMyBestRuns(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!configured) {
      container.innerHTML = '<p class="tq-leaderboard-note">Not configured yet.</p>';
      return;
    }
    container.innerHTML = '<p class="tq-leaderboard-note">Loading&hellip;</p>';
    await ready;
    if (!uid) {
      container.innerHTML = '<p class="tq-leaderboard-note">Could not connect.</p>';
      return;
    }
    try {
      const snap = await db.collection(RUNS_COLLECTION)
        .where("uid", "==", uid)
        .orderBy("playedAt", "desc")
        .limit(BEST_RUNS_LOOKBACK)
        .get();
      if (snap.empty) {
        container.innerHTML = '<p class="tq-leaderboard-note">No quizzes played on this browser yet.</p>';
        return;
      }
      const best = snap.docs
        .map((doc) => doc.data())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      const rows = best.map((r, i) => `
        <li>
          <span class="tq-leaderboard-rank">${i + 1}</span>
          <span class="tq-leaderboard-name">${r.correctCount}/${r.questionCount} correct &middot; ${(r.regions || []).join(", ") || "World"}</span>
          <span class="tq-leaderboard-streak">${r.score.toLocaleString()}</span>
        </li>
      `).join("");
      container.innerHTML = `<ul class="tq-leaderboard-list">${rows}</ul>`;
    } catch (err) {
      if (err && err.code === "failed-precondition") {
        container.innerHTML = '<p class="tq-leaderboard-note">This needs a Firestore index — open the browser console for a one-click link to create it.</p>';
      } else {
        container.innerHTML = '<p class="tq-leaderboard-note">Could not load your best runs.</p>';
      }
      console.error("TimeQuizBoard: renderMyBestRuns failed", err);
    }
  }

  // Global insight — every player's answers feed the same two shared
  // tally collections, so this is "most used across everyone," not a
  // per-browser stat (GeoStreak's own city insight, by contrast, is a
  // localStorage-only per-browser tally — see ui.js's
  // buildCityInsightsHtml()). Top 10 per page, same PAGE_SIZE+1-trick
  // pagination as the leaderboard panel above — one extra row fetched
  // purely to learn whether a Next page exists. Two independent
  // single-field orderBy queries, neither needing a composite index.
  const insightPagination = {
    city: { cursors: [null], page: 0 },
    country: { cursors: [null], page: 0 },
  };

  async function fetchTallyPage(collectionName, kind, pageIndex) {
    let query = db.collection(collectionName).orderBy("count", "desc");
    const cursor = insightPagination[kind].cursors[pageIndex];
    if (cursor) query = query.startAfter(cursor);
    const snap = await query.limit(INSIGHT_PAGE_SIZE + 1).get();
    const hasNext = snap.docs.length > INSIGHT_PAGE_SIZE;
    const pageDocs = snap.docs.slice(0, INSIGHT_PAGE_SIZE);
    if (hasNext && !insightPagination[kind].cursors[pageIndex + 1]) {
      insightPagination[kind].cursors[pageIndex + 1] = pageDocs[pageDocs.length - 1];
    }
    return { pageDocs, hasNext };
  }

  function renderTallyPagination(container, kind, pageIndex, hasNext) {
    if (!container) return;
    if (pageIndex === 0 && !hasNext) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = `
      <button type="button" class="tq-page-btn" data-action="prev" ${pageIndex === 0 ? "disabled" : ""}>&larr; Prev</button>
      <span class="tq-page-label">Page ${pageIndex + 1}</span>
      <button type="button" class="tq-page-btn" data-action="next" ${hasNext ? "" : "disabled"}>Next &rarr;</button>
    `;
    container.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const delta = btn.dataset.action === "next" ? 1 : -1;
        renderTallyPage(kind, insightPagination[kind].page + delta);
      });
    });
  }

  async function renderTallyPage(kind, pageIndex) {
    const listEl = document.getElementById(kind === "city" ? "tqInsightCityList" : "tqInsightCountryList");
    const pagEl = document.getElementById(kind === "city" ? "tqInsightCityPagination" : "tqInsightCountryPagination");
    if (!listEl) return;
    listEl.innerHTML = '<p class="tq-leaderboard-note">Loading&hellip;</p>';
    if (pagEl) pagEl.innerHTML = "";
    try {
      const collectionName = kind === "city" ? CITY_TALLY_COLLECTION : COUNTRY_TALLY_COLLECTION;
      const { pageDocs, hasNext } = await fetchTallyPage(collectionName, kind, pageIndex);
      if (pageDocs.length === 0) {
        listEl.innerHTML = pageIndex === 0
          ? '<p class="tq-leaderboard-note">No data yet — be the first!</p>'
          : '<p class="tq-leaderboard-note">No more entries.</p>';
        return;
      }
      insightPagination[kind].page = pageIndex;
      const startRank = pageIndex * INSIGHT_PAGE_SIZE + 1;
      const rows = pageDocs.map((doc, i) => {
        const d = doc.data();
        const label = kind === "city" ? `${flagEmoji(d.country)} ${d.city}` : `${flagEmoji(d.country)} ${d.country}`;
        return `
          <li>
            <span class="tq-leaderboard-rank">${startRank + i}</span>
            <span class="tq-city-name">${escapeHtml(label)}</span>
            <span class="tq-city-count">${d.count.toLocaleString()}</span>
          </li>
        `;
      }).join("");
      listEl.innerHTML = `<ul class="tq-city-list">${rows}</ul>`;
      renderTallyPagination(pagEl, kind, pageIndex, hasNext);
    } catch (err) {
      listEl.innerHTML = '<p class="tq-leaderboard-note">Could not load insights.</p>';
      console.error("TimeQuizBoard: renderTallyPage failed", err);
    }
  }

  // Builds the shell once, then lets renderTallyPage() own each column's
  // own list/pagination from there — same split as renderLeaderboardPanel()
  // building its shell once and renderPage() handling the actual data
  // underneath it.
  //
  // Top Countries shows for every viewer; Top Cities only for a master
  // uid (MASTER_UIDS above) — city-level detail reads as more revealing
  // than a country-level count, so it's held back the same way run-by-run
  // detail is already private in firestore.rules (`timeQuizRuns`'
  // own-uid-or-master read rule), even though these two tally collections
  // themselves are world-readable at the rules layer — this is a display
  // choice in this file, not an access-control one enforced server-side.
  async function renderInsights(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!configured) {
      container.innerHTML = '<p class="tq-leaderboard-note">Not configured yet.</p>';
      return;
    }
    container.innerHTML = '<p class="tq-leaderboard-note">Loading&hellip;</p>';
    await ready;
    if (!uid) {
      container.innerHTML = '<p class="tq-leaderboard-note">Could not connect.</p>';
      return;
    }
    const isMaster = MASTER_UIDS.includes(uid);
    const cityColumnHtml = `
      <div class="tq-insight-col">
        <p class="tq-insight-label">TOP CITIES</p>
        <div id="tqInsightCityList"><p class="tq-leaderboard-note">Loading&hellip;</p></div>
        <div id="tqInsightCityPagination" class="tq-lb-pagination"></div>
      </div>
    `;
    container.innerHTML = `
      ${isMaster ? cityColumnHtml : ""}
      <div class="tq-insight-col">
        <p class="tq-insight-label">TOP COUNTRIES</p>
        <div id="tqInsightCountryList"><p class="tq-leaderboard-note">Loading&hellip;</p></div>
        <div id="tqInsightCountryPagination" class="tq-lb-pagination"></div>
      </div>
    `;
    insightPagination.city = { cursors: [null], page: 0 };
    insightPagination.country = { cursors: [null], page: 0 };
    const pages = [renderTallyPage("country", 0)];
    if (isMaster) pages.push(renderTallyPage("city", 0));
    await Promise.all(pages);
  }

  // Duplicated from timeQuiz.js's own flagEmoji() per this file's
  // self-contained convention (no shared import between the two).
  function flagEmoji(countryCode) {
    const cc = String(countryCode || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (cc.length !== 2) return "";
    return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
  }

  return {
    init,
    getNickname,
    hasNickname,
    wireNicknameInput,
    recordCityUsage,
    loadPlayerState,
    savePlayerState,
    submitScore,
    submitDailyScore,
    submitRunHistory,
    renderLeaderboardPanel,
    renderMyBestRuns,
    renderInsights,
  };
})();

TimeQuizBoard.init();
