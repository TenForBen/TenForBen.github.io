// DistanceLearningQuiz's Run History page — reads dlqRuns (and, on demand,
// dlqAttempts) from Firestore. Everyone sees their own runs; a master uid
// also gets an "All Players" tab with every player's runs. Read-only.
//
// Self-contained like timeQuizHistoryPage.js: its own sign-in and small
// renderers rather than loading the quiz page's scripts.

const RUNS_LIMIT = 100;

// Same hardcoded allowlist as historyPage.js and timeQuizHistoryPage.js.
// This copy only decides whether the "All Players" tab is shown; the real
// enforcement is isMaster() in firestore.rules, which must list the same
// UIDs. A UID goes in all of them after its owner clicks "Copy my player
// ID" below and hands it over.
const MASTER_UIDS = ["B0N7TfmkrXTaYjB2TBCVOBVtIhM2", "MsRKlqcPecOBng8SHekRF5YCVFJ3", "WmoVyIkr2eVCtQHMPwoiTnKWZQp1", "M9odxs0JSTPAnFuewYOCB2BEPR03"];

const ROUND_LABELS = {
  india: "India", world: "World", europe: "Europe", na: "North America",
  asia: "Asia", australia: "Australia", africa: "Africa",
};

const OUTCOME_LABELS = {
  scored: "Scored",
  not_found: "Not found",
  wrong_region: "Wrong region",
  already_used: "Already used",
  timeout: "Time's up",
};

const ARROWS = { N: "↑", NE: "↗", E: "→", SE: "↘", S: "↓", SW: "↙", W: "←", NW: "↖" };

const configured = typeof firebaseConfig !== "undefined"
  && firebaseConfig.apiKey
  && !firebaseConfig.apiKey.startsWith("REPLACE_ME");

let db = null;
let myUid = null;
let currentView = "mine"; // "mine" | "all" — "all" only for a master uid

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

function formatPoints(points) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

function formatDuration(ms) {
  const totalSeconds = Math.round((ms || 0) / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

function formatWhen(run) {
  const date = run.finishedAt ? new Date(run.finishedAt) : run.playedAt && run.playedAt.toDate ? run.playedAt.toDate() : null;
  return date ? date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
}

function place(p) {
  return p ? `${flagEmoji(p.country)} ${escapeHtml(p.name)}, ${escapeHtml(p.country)}` : "";
}

function direction(dir) {
  return dir ? `<span class="dlh-dir">${ARROWS[dir] || ""} ${dir}</span>` : "&ndash;";
}

// ---- Run cards -------------------------------------------------------------

function buildQuestionsTable(questions) {
  const top = Math.max(0, ...questions.map((q) => q.points));
  const rows = questions.map((q) => `
    <tr class="${top > 0 && q.points === top ? "dlh-row-top" : ""}">
      <td>${q.number}</td>
      <td>${place(q.centre)}</td>
      <td>${q.targetKm.toLocaleString()}</td>
      <td>${q.answer ? place(q.answer) : `<span class="dlh-muted">${q.status === "timeout" ? "time's up" : "invalid"}</span>`}</td>
      <td>${q.distanceKm != null ? q.distanceKm.toLocaleString() : "&ndash;"}</td>
      <td>${direction(q.direction)}</td>
      <td class="${q.points > 0 ? "dlh-pts-good" : "dlh-pts-zero"}">${formatPoints(q.points)}</td>
      <td>${((q.timeTakenMs || 0) / 1000).toFixed(1)}s</td>
      <td>${q.attemptCount ?? "&ndash;"}</td>
    </tr>`).join("");
  return `
    <div class="dlh-table-wrap">
      <table class="dlh-table">
        <thead><tr><th>#</th><th>From</th><th>Target km</th><th>Answer</th><th>Actual km</th><th>Dir</th><th>Pts</th><th>Time</th><th>Tries</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function buildAttemptsTable(attempts) {
  const rows = attempts.map((a) => `
    <tr>
      <td>${a.questionNumber}.${a.tryNumber}</td>
      <td>${a.input ? escapeHtml(a.input) : '<span class="dlh-muted">&ndash;</span>'}</td>
      <td><span class="dlh-outcome dlh-outcome-${a.outcome}">${OUTCOME_LABELS[a.outcome] || escapeHtml(a.outcome)}</span></td>
      <td>${a.resolved ? place(a.resolved) : "&ndash;"}</td>
      <td>${a.targetKm.toLocaleString()}</td>
      <td>${a.distanceKm != null ? a.distanceKm.toLocaleString() : "&ndash;"}</td>
      <td>${formatPoints(a.points)}</td>
      <td>${((a.elapsedMs || 0) / 1000).toFixed(1)}s</td>
    </tr>`).join("");
  return `
    <div class="dlh-table-wrap">
      <table class="dlh-table">
        <thead><tr><th>Q.try</th><th>Typed</th><th>Outcome</th><th>Resolved to</th><th>Target km</th><th>Actual km</th><th>Pts</th><th>At</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function buildRunCard(run, { showNickname = false, best = false } = {}) {
  const meta = [
    showNickname ? `<b>${escapeHtml(run.nickname || "Anonymous")}</b>` : "",
    escapeHtml(ROUND_LABELS[run.roundKey] || run.roundLabel || run.roundKey),
    `${run.questionsPlayed}/${run.questionCount} questions${run.quitEarly ? " (quit)" : ""}`,
    formatDuration(run.durationMs),
    formatWhen(run),
  ].filter(Boolean).join(" &middot; ");
  return `
    <div class="dlh-card${best ? " dlh-card-best" : ""}" data-run-id="${escapeHtml(run.runId)}" data-uid="${escapeHtml(run.uid)}">
      <button type="button" class="dlh-card-toggle" aria-expanded="false">
        <span class="dlh-card-score">${formatPoints(run.totalScore)}</span>
        <span class="dlh-card-meta">${meta}</span>
        <span class="dlh-card-caret">&#9656;</span>
      </button>
      <div class="dlh-card-detail" style="display: none;">
        <p class="dlh-detail-start">Started at ${place(run.startCity)}</p>
        ${buildQuestionsTable(run.questions || [])}
        <button type="button" class="dlh-attempts-btn">Show every attempt</button>
        <div class="dlh-attempts"></div>
      </div>
    </div>`;
}

function wireCards(container) {
  container.querySelectorAll(".dlh-card-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const detail = btn.closest(".dlh-card").querySelector(".dlh-card-detail");
      const opening = detail.style.display === "none";
      detail.style.display = opening ? "block" : "none";
      btn.setAttribute("aria-expanded", String(opening));
      btn.querySelector(".dlh-card-caret").innerHTML = opening ? "&#9662;" : "&#9656;";
    });
  });
  container.querySelectorAll(".dlh-attempts-btn").forEach((btn) => {
    btn.addEventListener("click", () => loadAttempts(btn));
  });
}

// Every submission for one run, loaded only when asked for. Filtering on
// uid as well as runId is what lets the rules allow it for the owner
// (both equality filters, so no composite index is needed).
async function loadAttempts(btn) {
  const card = btn.closest(".dlh-card");
  const out = card.querySelector(".dlh-attempts");
  btn.disabled = true;
  out.innerHTML = '<p class="dlh-note">Loading&hellip;</p>';
  try {
    const snap = await db.collection("dlqAttempts")
      .where("uid", "==", card.dataset.uid)
      .where("runId", "==", card.dataset.runId)
      .get();
    const attempts = snap.docs.map((d) => d.data())
      .sort((a, b) => a.questionNumber - b.questionNumber || a.tryNumber - b.tryNumber);
    out.innerHTML = attempts.length ? buildAttemptsTable(attempts) : '<p class="dlh-note">No attempts uploaded for this run.</p>';
    btn.style.display = "none";
  } catch (err) {
    console.error("DistanceLearningQuiz History: loadAttempts failed", err);
    out.innerHTML = '<p class="dlh-note">Could not load attempts.</p>';
    btn.disabled = false;
  }
}

// ---- Views -------------------------------------------------------------------

function renderRoundBests(runs) {
  const best = {};
  runs.forEach((r) => {
    if (!best[r.roundKey] || r.totalScore > best[r.roundKey].totalScore) best[r.roundKey] = r;
  });
  const keys = Object.keys(ROUND_LABELS).filter((k) => best[k]);
  if (!keys.length) return "";
  return keys.map((k) => `
    <div class="dlh-best-tile">
      <span class="dlh-best-label">${ROUND_LABELS[k]}</span>
      <span class="dlh-best-score">${formatPoints(best[k].totalScore)}</span>
    </div>`).join("");
}

async function loadMyRuns() {
  const statusEl = document.getElementById("dlhStatus");
  const bestEl = document.getElementById("dlhBest");
  const listEl = document.getElementById("dlhList");
  document.getElementById("dlhListTitle").textContent = "Your Runs";

  // Sorted here rather than with orderBy, so no composite index is needed.
  const snap = await db.collection("dlqRuns").where("uid", "==", myUid).limit(500).get();
  const runs = snap.docs.map((d) => d.data())
    .sort((a, b) => String(b.finishedAt).localeCompare(String(a.finishedAt)))
    .slice(0, RUNS_LIMIT);

  if (!runs.length) {
    statusEl.innerHTML = 'No runs uploaded from this browser yet &mdash; play a round of <a href="distanceLearningQuiz.html">DistanceLearningQuiz</a> first.';
    bestEl.innerHTML = "";
    document.getElementById("dlhBestSection").style.display = "none";
    listEl.innerHTML = "";
    return;
  }
  statusEl.textContent = `${runs.length} run${runs.length === 1 ? "" : "s"} on this account${runs.length === RUNS_LIMIT ? " (most recent shown)" : ""}.`;
  document.getElementById("dlhBestSection").style.display = "";
  bestEl.innerHTML = renderRoundBests(runs);
  const topScore = Math.max(...runs.map((r) => r.totalScore));
  listEl.innerHTML = runs.map((r) => buildRunCard(r, { best: r.totalScore === topScore })).join("");
  wireCards(listEl);
}

// Master only: every player's runs, newest first.
async function loadAllRuns() {
  const statusEl = document.getElementById("dlhStatus");
  const listEl = document.getElementById("dlhList");
  document.getElementById("dlhBestSection").style.display = "none";
  document.getElementById("dlhListTitle").textContent = "All Players — Recent Runs";

  const snap = await db.collection("dlqRuns").orderBy("playedAt", "desc").limit(RUNS_LIMIT).get();
  const runs = snap.docs.map((d) => d.data());
  if (!runs.length) {
    statusEl.textContent = "No runs uploaded by anyone yet.";
    listEl.innerHTML = "";
    return;
  }
  const players = new Set(runs.map((r) => r.uid)).size;
  statusEl.textContent = `${runs.length} most recent run${runs.length === 1 ? "" : "s"} from ${players} player${players === 1 ? "" : "s"}.`;
  listEl.innerHTML = runs.map((r) => buildRunCard(r, { showNickname: true })).join("");
  wireCards(listEl);
}

function reload() {
  const promise = currentView === "all" ? loadAllRuns() : loadMyRuns();
  promise.catch(reportLoadError);
}

function wireTabs() {
  const tabsEl = document.getElementById("dlhTabs");
  const mineBtn = document.getElementById("dlhTabMine");
  const allBtn = document.getElementById("dlhTabAll");
  if (!MASTER_UIDS.includes(myUid)) return;
  tabsEl.style.display = "flex";
  const select = (view) => {
    if (currentView === view) return;
    currentView = view;
    mineBtn.classList.toggle("dlh-tab-active", view === "mine");
    allBtn.classList.toggle("dlh-tab-active", view === "all");
    reload();
  };
  mineBtn.addEventListener("click", () => select("mine"));
  allBtn.addEventListener("click", () => select("all"));
}

function wireCopyUid() {
  const link = document.getElementById("dlhCopyUid");
  link.style.display = "inline";
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(myUid).then(() => {
      const original = link.textContent;
      link.textContent = "Copied!";
      setTimeout(() => { link.textContent = original; }, 1500);
    });
  });
}

function renderHeaderNickname(isMaster) {
  let name = null;
  try { name = localStorage.getItem("geoStreakGame_nickname"); } catch (err) { /* ignore */ }
  if (!name) return;
  const el = document.getElementById("dlhNickname");
  el.textContent = isMaster ? `${name} · master` : name;
  el.classList.toggle("dlh-nickname-master", isMaster);
  el.style.display = "inline";
}

function reportLoadError(err) {
  console.error("DistanceLearningQuiz History: load failed", err);
  const statusEl = document.getElementById("dlhStatus");
  document.getElementById("dlhBestSection").style.display = "none";
  statusEl.textContent = err && err.code === "permission-denied"
    ? "Firestore refused the request — the DistanceLearningQuiz rules may not be published yet (see README)."
    : "Could not load history.";
}

async function main() {
  const statusEl = document.getElementById("dlhStatus");
  if (!configured) {
    statusEl.textContent = "History isn't configured yet — see firebaseConfig.js.";
    return;
  }
  // Firebase sign-in hangs on a page opened straight from disk.
  if (location.protocol === "file:") {
    statusEl.textContent = "History needs the page served over http(s), not opened from a file.";
    return;
  }
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  const auth = firebase.auth();
  try {
    await auth.signInAnonymously();
    const user = await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((u) => {
        if (!u) return;
        unsubscribe();
        resolve(u);
      });
    });
    myUid = user.uid;
    const isMaster = MASTER_UIDS.includes(myUid);
    wireCopyUid();
    wireTabs();
    renderHeaderNickname(isMaster);
    await loadMyRuns();
  } catch (err) {
    reportLoadError(err);
  }
}

main();
