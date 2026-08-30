// Time Quiz's own Run History + Insights page — reads Firestore's
// timeQuizRuns/timeQuizCityTally/timeQuizCountryTally collections. A
// dedicated page rather than a tab bolted onto GeoStreak's own
// history.html (an earlier version tried that and was reverted — a
// shared switcher meant two different games' very different round shapes
// fighting over one set of containers, for no real benefit once each
// game already has its own everything else).
//
// Self-contained like historyPage.js itself: its own small
// escapeHtml/flagEmoji/run-card renderers rather than loading
// timeQuizLeaderboard.js — this is a separate page load with its own
// Firebase sign-in, same reasoning historyPage.js's own top-of-file
// comment gives for GeoStreak. Read-only: this page never writes to
// Firestore.

const RUNS_LIMIT = 100; // same as GeoStreak's own history page

// Same hardcoded allowlist as historyPage.js's own MASTER_UIDS — kept in
// sync by hand with firestore.rules' isMaster(), which already covers
// timeQuizRuns (added alongside geostreakRuns). A UID goes in this list
// (and that one, and the rules file) after someone clicks "Copy my
// player ID" below and hands it to whoever maintains this file.
const MASTER_UIDS = ["B0N7TfmkrXTaYjB2TBCVOBVtIhM2", "MsRKlqcPecOBng8SHekRF5YCVFJ3", "WmoVyIkr2eVCtQHMPwoiTnKWZQp1", "M9odxs0JSTPAnFuewYOCB2BEPR03"];

const CITY_TALLY_COLLECTION = "timeQuizCityTally";
const COUNTRY_TALLY_COLLECTION = "timeQuizCountryTally";
const INSIGHT_PAGE_SIZE = 10;

const configured = typeof firebaseConfig !== "undefined"
  && firebaseConfig.apiKey
  && !firebaseConfig.apiKey.startsWith("REPLACE_ME");

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function flagEmoji(iso2) {
  const cc = String(iso2 || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (cc.length !== 2) return "";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function formatPlayedAt(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "just now";
  return timestamp.toDate().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// ---- Run cards ---------------------------------------------------------

function buildRoundsTable(rounds) {
  const rows = rounds.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(r.region)}</td>
      <td>${escapeHtml(r.condition)}</td>
      <td>${escapeHtml(r.detail)}</td>
      <td>${r.correct
        ? '<span class="gs-badge gs-badge-correct">CORRECT</span>'
        : '<span class="gs-badge gs-badge-incorrect">INCORRECT</span>'}</td>
      <td>${r.elapsed.toFixed(2)}s</td>
      <td>${r.points}</td>
    </tr>
  `).join("");

  return `
    <table class="gs-round-table">
      <thead>
        <tr><th>#</th><th>Region</th><th>Condition</th><th>Your answer</th><th>Result</th><th>Time</th><th>Points</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// `best` picks the highlighted-border styling (used for each of the
// "Best 10" cards, not just one). `showNickname` is the master-only "All
// Players" tab, where whose attempt it is is the first thing worth
// knowing about a row.
function buildRunCard(run, { best = false, showNickname = false } = {}) {
  const regionsLabel = escapeHtml((run.regions && run.regions.length ? run.regions : ["World"]).join(", "));
  const correctLabel = `${run.correctCount}/${run.questionCount} correct`;
  const meta = showNickname
    ? `${escapeHtml(run.nickname || "Anonymous")} &middot; ${correctLabel} &middot; ${regionsLabel} &middot; ${formatPlayedAt(run.playedAt)}`
    : `${correctLabel} &middot; ${regionsLabel} &middot; ${formatPlayedAt(run.playedAt)}`;
  return `
    <div class="gs-run-card${best ? " gs-run-card-best" : ""}">
      <div class="gs-run-header-row">
        <button type="button" class="gs-run-toggle" aria-expanded="false">
          <span class="gs-run-streak">${run.score.toLocaleString()}</span>
          <span class="gs-run-meta">${meta}</span>
          <span class="gs-run-caret">&#9656;</span>
        </button>
        <button type="button" class="gs-run-export-btn" title="Export this attempt as PDF">&#128196;</button>
      </div>
      <div class="gs-run-detail" style="display: none;">
        ${buildRoundsTable(run.rounds || [])}
      </div>
    </div>
  `;
}

function wireRunToggles(container) {
  container.querySelectorAll(".gs-run-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const detail = btn.closest(".gs-run-card").querySelector(".gs-run-detail");
      const opening = detail.style.display === "none";
      detail.style.display = opening ? "block" : "none";
      btn.setAttribute("aria-expanded", String(opening));
      btn.querySelector(".gs-run-caret").innerHTML = opening ? "&#9662;" : "&#9656;";
    });
  });
}

// Exports just ONE attempt as a PDF via the browser's own print dialog —
// same technique (and same reasoning) as GeoStreak's own historyPage.js.
function wireExportButtons(container) {
  container.querySelectorAll(".gs-run-export-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".gs-run-card");
      const detail = card.querySelector(".gs-run-detail");
      const toggle = card.querySelector(".gs-run-toggle");
      const wasOpen = detail.style.display !== "none";

      if (!wasOpen) {
        detail.style.display = "block";
        toggle.setAttribute("aria-expanded", "true");
        toggle.querySelector(".gs-run-caret").innerHTML = "&#9662;";
      }
      card.classList.add("gs-print-target");
      document.body.classList.add("gs-printing-one");

      const restore = () => {
        document.body.classList.remove("gs-printing-one");
        card.classList.remove("gs-print-target");
        if (!wasOpen) {
          detail.style.display = "none";
          toggle.setAttribute("aria-expanded", "false");
          toggle.querySelector(".gs-run-caret").innerHTML = "&#9656;";
        }
        window.removeEventListener("afterprint", restore);
      };
      window.addEventListener("afterprint", restore);

      window.print();
    });
  });
}

function wireCopyUidLink(uid) {
  const link = document.getElementById("tqhCopyUid");
  if (!link) return;
  link.style.display = "inline";
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(uid).then(() => {
      const original = link.textContent;
      link.textContent = "Copied!";
      setTimeout(() => { link.textContent = original; }, 1500);
    });
  });
}

// ---- Insights (Most Used Cities/Countries), paginated ------------------
// Two independent Top-10-per-page lists — global across every player, not
// scoped to this uid, same "shared ownerless counter" collections
// timeQuiz.html's own start-screen insight reads (see
// timeQuizLeaderboard.js). Duplicated here rather than shared, per this
// file's own self-contained-page convention stated up top.

const insightPaging = {
  city: { cursors: [null], page: 0 },
  country: { cursors: [null], page: 0 },
};

// Same PAGE_SIZE+1-trick pagination as the leaderboard panel elsewhere in
// this project — one extra row fetched purely to learn whether a Next
// page exists, cursors remembered per kind rather than re-derived.
async function fetchTallyPage(db, collectionName, kind, pageIndex) {
  let query = db.collection(collectionName).orderBy("count", "desc");
  const cursor = insightPaging[kind].cursors[pageIndex];
  if (cursor) query = query.startAfter(cursor);
  const snap = await query.limit(INSIGHT_PAGE_SIZE + 1).get();
  const hasNext = snap.docs.length > INSIGHT_PAGE_SIZE;
  const pageDocs = snap.docs.slice(0, INSIGHT_PAGE_SIZE);
  if (hasNext && !insightPaging[kind].cursors[pageIndex + 1]) {
    insightPaging[kind].cursors[pageIndex + 1] = pageDocs[pageDocs.length - 1];
  }
  return { pageDocs, hasNext };
}

function renderTallyPagination(container, db, kind, pageIndex, hasNext) {
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
      renderTallyPage(db, kind, insightPaging[kind].page + delta);
    });
  });
}

async function renderTallyPage(db, kind, pageIndex) {
  const listEl = document.getElementById(kind === "city" ? "tqhCityList" : "tqhCountryList");
  const pagEl = document.getElementById(kind === "city" ? "tqhCityPagination" : "tqhCountryPagination");
  if (!listEl) return;
  listEl.innerHTML = '<p class="tq-leaderboard-note">Loading&hellip;</p>';
  if (pagEl) pagEl.innerHTML = "";
  try {
    const collectionName = kind === "city" ? CITY_TALLY_COLLECTION : COUNTRY_TALLY_COLLECTION;
    const { pageDocs, hasNext } = await fetchTallyPage(db, collectionName, kind, pageIndex);
    if (pageDocs.length === 0) {
      listEl.innerHTML = pageIndex === 0
        ? '<p class="tq-leaderboard-note">No data yet — be the first!</p>'
        : '<p class="tq-leaderboard-note">No more entries.</p>';
      return;
    }
    insightPaging[kind].page = pageIndex;
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
    renderTallyPagination(pagEl, db, kind, pageIndex, hasNext);
  } catch (err) {
    listEl.innerHTML = '<p class="tq-leaderboard-note">Could not load insights.</p>';
    console.error("Time Quiz History: renderTallyPage failed", err);
  }
}

function loadInsights(db) {
  return Promise.all([renderTallyPage(db, "city", 0), renderTallyPage(db, "country", 0)]);
}

// ---- My Attempts / All Players -----------------------------------------

let currentView = "mine"; // "mine" | "all" — "all" only ever reachable by a master uid

async function loadMyRuns(db, uid) {
  const statusEl = document.getElementById("tqhStatus");
  const bestSectionEl = document.getElementById("tqhBestSection");
  const bestEl = document.getElementById("tqhBest");
  const listEl = document.getElementById("tqhList");
  bestSectionEl.style.display = "";
  document.getElementById("tqhListTitle").textContent = "All Attempts";

  const snap = await db.collection("timeQuizRuns")
    .where("uid", "==", uid)
    .orderBy("playedAt", "desc")
    .limit(RUNS_LIMIT)
    .get();

  if (snap.empty) {
    statusEl.innerHTML = 'No quizzes recorded on this browser yet — play a round of <a href="timeQuiz.html">Time Quiz</a> first.';
    bestSectionEl.style.display = "none";
    listEl.innerHTML = "";
    return;
  }

  const runs = snap.docs.map((doc) => doc.data());
  statusEl.textContent = runs.length === RUNS_LIMIT
    ? `Showing your ${RUNS_LIMIT} most recent attempts.`
    : `${runs.length} attempt${runs.length === 1 ? "" : "s"} on this account.`;

  // Same "no second query" reasoning as GeoStreak's single-best-run comment
  // in historyPage.js, extended from one run to ten: sort the RUNS_LIMIT
  // most-recent-by-playedAt runs by score client-side and take the top 10,
  // rather than a separate uid+score composite-index query.
  const best10 = [...runs].sort((a, b) => b.score - a.score).slice(0, 10);
  bestEl.innerHTML = best10.map((r) => buildRunCard(r, { best: true })).join("");
  listEl.innerHTML = runs.map((r) => buildRunCard(r)).join("");
  wireRunToggles(bestEl);
  wireRunToggles(listEl);
  wireExportButtons(bestEl);
  wireExportButtons(listEl);
}

// Master-only: every player's attempts, most recent first, system-wide —
// same shape as GeoStreak's own loadAllRuns().
async function loadAllRuns(db) {
  const statusEl = document.getElementById("tqhStatus");
  const bestSectionEl = document.getElementById("tqhBestSection");
  const listEl = document.getElementById("tqhList");
  bestSectionEl.style.display = "none";
  document.getElementById("tqhListTitle").textContent = "All Players — Recent Attempts";

  const snap = await db.collection("timeQuizRuns")
    .orderBy("playedAt", "desc")
    .limit(RUNS_LIMIT)
    .get();

  if (snap.empty) {
    statusEl.textContent = "No attempts recorded by anyone yet.";
    listEl.innerHTML = "";
    return;
  }

  const runs = snap.docs.map((doc) => doc.data());
  statusEl.textContent = runs.length === RUNS_LIMIT
    ? `Showing the ${RUNS_LIMIT} most recent attempts across every player.`
    : `${runs.length} attempt${runs.length === 1 ? "" : "s"} recorded across every player.`;

  listEl.innerHTML = runs.map((r) => buildRunCard(r, { showNickname: true })).join("");
  wireRunToggles(listEl);
  wireExportButtons(listEl);
}

function reload(db, uid) {
  const promise = currentView === "all" ? loadAllRuns(db) : loadMyRuns(db, uid);
  promise.catch((err) => reportLoadError(err));
}

function wireHistoryTabs(db, uid) {
  const tabsEl = document.getElementById("tqhTabs");
  const mineBtn = document.getElementById("tqhTabMine");
  const allBtn = document.getElementById("tqhTabAll");
  if (!MASTER_UIDS.includes(uid) || !tabsEl || !mineBtn || !allBtn) return;

  tabsEl.style.display = "flex";
  mineBtn.addEventListener("click", () => {
    if (currentView === "mine") return;
    currentView = "mine";
    mineBtn.classList.add("gs-tab-active");
    allBtn.classList.remove("gs-tab-active");
    reload(db, uid);
  });
  allBtn.addEventListener("click", () => {
    if (currentView === "all") return;
    currentView = "all";
    allBtn.classList.add("gs-tab-active");
    mineBtn.classList.remove("gs-tab-active");
    reload(db, uid);
  });
}

function reportLoadError(err) {
  console.error("Time Quiz History: load failed", err);
  const bestSectionEl = document.getElementById("tqhBestSection");
  if (bestSectionEl) bestSectionEl.style.display = "none";
  const statusEl = document.getElementById("tqhStatus");
  if (!statusEl) return;
  if (err && err.code === "failed-precondition") {
    // Same Firestore behavior GeoStreak's own historyPage.js relies on —
    // the real "create this index" link only shows up in the browser
    // console (err.message), specific to this project.
    statusEl.textContent = "This query needs a Firestore index — open the browser console for a one-click link to create it.";
  } else {
    statusEl.textContent = "Could not load history.";
  }
}

async function main() {
  const statusEl = document.getElementById("tqhStatus");
  const bestSectionEl = document.getElementById("tqhBestSection");

  if (!configured) {
    statusEl.textContent = "History isn't configured yet — see firebaseConfig.js.";
    bestSectionEl.style.display = "none";
    document.getElementById("tqhCityList").innerHTML = '<p class="tq-leaderboard-note">Not configured yet.</p>';
    document.getElementById("tqhCountryList").innerHTML = '<p class="tq-leaderboard-note">Not configured yet.</p>';
    return;
  }

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  try {
    await auth.signInAnonymously();
    const user = await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((u) => {
        if (!u) return;
        unsubscribe();
        resolve(u);
      });
    });

    wireCopyUidLink(user.uid);
    wireHistoryTabs(db, user.uid);
    await Promise.all([loadMyRuns(db, user.uid), loadInsights(db)]);
  } catch (err) {
    reportLoadError(err);
  }
}

main();
