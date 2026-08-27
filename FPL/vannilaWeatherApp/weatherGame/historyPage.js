// GeoStreak run history — reads from Firestore's geostreakRuns collection,
// scoped to the signed-in player's own runs by firestore.rules (a player
// can only read documents where uid == their own auth uid). Entirely
// read-only: this page never writes anything.
//
// Self-contained like southernHemisphere/app.js — its own small
// escapeHtml/flagEmoji helpers rather than loading ../ui.js, since this
// page doesn't need the rest of what that file does.

// How many of the most recent runs to pull per visit. "Personal best" is
// computed client-side from whatever this fetches, not a separate query —
// see the README's Leaderboard section for why (avoids needing a second
// Firestore index) and what 100 reads per visit actually costs.
const RUNS_LIMIT = 100;

// Anonymous-auth UIDs allowed to see the "All Players" tab — everyone
// else only ever sees their own runs, same as before this existed. This
// is UX only (hiding a tab that wouldn't work anyway): the actual gate is
// firestore.rules' isMaster(), which has to list the exact same UIDs —
// keep the two in sync by hand, there's no shared source between a
// Firestore rules file and a browser script. A UID goes in this list
// after someone clicks "Copy my player ID" (below) from that browser and
// hands it to whoever maintains this file.
const MASTER_UIDS = ["B0N7TfmkrXTaYjB2TBCVOBVtIhM2", "MsRKlqcPecOBng8SHekRF5YCVFJ3", "WmoVyIkr2eVCtQHMPwoiTnKWZQp1"];

const configured = typeof firebaseConfig !== "undefined"
  && firebaseConfig.apiKey
  && !firebaseConfig.apiKey.startsWith("REPLACE_ME");

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function flagEmoji(iso2) {
  const cc = String(iso2 || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (cc.length !== 2) return "";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function formatCondition(round) {
  const dir = round.direction === "above" ? "ABOVE" : "BELOW";
  const hemi = round.hemisphere
    ? (round.hemisphere === "north" ? "Northern, " : "Southern, ")
    : "";
  return `${hemi}${dir} ${round.threshold}°C`;
}

function formatResultBadge(round) {
  if (round.timedOut) return '<span class="gs-badge gs-badge-timeout">TIMED OUT</span>';
  if (round.correct) return '<span class="gs-badge gs-badge-correct">CORRECT</span>';

  // Tough rounds fail one of two independent conditions (temperature,
  // hemisphere) — runs recorded before this breakdown existed have
  // tempCorrect/hemisphereCorrect as undefined, so this only annotates
  // rounds where we actually know which one broke.
  let reason = "";
  if (round.hemisphere && round.tempCorrect != null && round.hemisphereCorrect != null) {
    if (!round.tempCorrect && !round.hemisphereCorrect) reason = " (temp &amp; hemisphere)";
    else if (!round.tempCorrect) reason = " (temp)";
    else if (!round.hemisphereCorrect) reason = " (hemisphere)";
  }
  return `<span class="gs-badge gs-badge-incorrect">INCORRECT${reason}</span>`;
}

// How close the reading landed to the threshold it was judged against —
// independent of correct/incorrect, since a near-miss and a comfortable
// pass are both worth calling out differently from an ordinary result.
// Exactly AT the threshold is the closest a reading can get (gold); within
// 2 degrees either side is still a close margin (green); anything wider
// gets no special color.
function tempClosenessClass(r) {
  if (r.timedOut || r.temp == null || r.threshold == null) return "";
  const diff = Math.abs(r.temp - r.threshold);
  if (diff === 0) return "gs-temp-gold";
  if (diff <= 2) return "gs-temp-green";
  return "";
}

// Great-circle distance (km) between two lat/lon points, via the haversine
// formula. Duplicated from ui.js rather than loaded — see the top-of-file
// note on why this page stays self-contained.
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // mean Earth radius, km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Running total of the distance strung across the cities guessed so far
// this run, city to city in order — 0 on the first guessed city, and by
// the last row the whole run's traveled distance. Each entry also keeps
// `step`, that round's own hop from the previous city (null on whichever
// round starts the chain — the very first guess, or the first guess
// after a gap — since there's nothing before it to measure from), so the
// table can show both "how far so far" and "how far just now" without a
// second pass over the rounds.
//
// A round with no coordinates (timed out, or an older run recorded
// before coordinates were saved) breaks the chain right there rather
// than guessing at it — its own cell shows nothing, and the running
// total picks back up (with step reset to null) from the next round that
// does have them.
function buildDistanceColumn(rounds) {
  let total = 0;
  let last = null;
  return rounds.map((r) => {
    if (r.lat == null || r.lon == null) {
      last = null;
      return null;
    }
    let step = null;
    if (last) {
      step = haversineKm(last.lat, last.lon, r.lat, r.lon);
      total += step;
    }
    last = r;
    return { total: Math.round(total), step: step != null ? Math.round(step) : null };
  });
}

function buildRoundsTable(rounds) {
  const distances = buildDistanceColumn(rounds);
  const rows = rounds.map((r, i) => {
    const guess = r.timedOut
      ? "&mdash;"
      : `${flagEmoji(r.country)} ${escapeHtml(r.resolvedCity || "")}`;
    const temp = r.temp != null
      ? `<span class="${tempClosenessClass(r)}">${Math.round(r.temp)}°C</span>`
      : "&mdash;";
    const d = distances[i];
    const distance = d != null
      ? `${d.total.toLocaleString()} km${d.step != null ? ` (+${d.step.toLocaleString()} km)` : ""}`
      : "&mdash;";
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(formatCondition(r))}</td>
        <td>${guess}</td>
        <td>${temp}</td>
        <td>${formatResultBadge(r)}</td>
        <td>${distance}</td>
      </tr>
    `;
  }).join("");

  return `
    <table class="gs-round-table">
      <thead>
        <tr><th>#</th><th>Condition</th><th>Guess</th><th>Temp</th><th>Result</th><th>Distance</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function formatPlayedAt(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "just now";
  return timestamp.toDate().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// `showNickname` is the only difference between "my own runs" (where
// whose run it is goes without saying) and the master-only "All Players"
// tab, where the nickname is the first thing worth knowing about a row.
function buildRunCard(run, { best = false, showNickname = false } = {}) {
  const reasonLabel = run.reason === "time" ? "Time's Up" : "Game Over";
  const roundWord = run.roundCount === 1 ? "round" : "rounds";
  const meta = showNickname
    ? `${escapeHtml(run.nickname || "Anonymous")} &middot; ${escapeHtml(reasonLabel)} &middot; ${run.roundCount} ${roundWord} &middot; ${formatPlayedAt(run.playedAt)}`
    : `${escapeHtml(reasonLabel)} &middot; ${run.roundCount} ${roundWord} &middot; ${formatPlayedAt(run.playedAt)}`;
  return `
    <div class="gs-run-card${best ? " gs-run-card-best" : ""}">
      <div class="gs-run-header-row">
        <button type="button" class="gs-run-toggle" aria-expanded="false">
          <span class="gs-run-streak">${run.finalStreak}</span>
          <span class="gs-run-meta">${meta}</span>
          <span class="gs-run-caret">&#9656;</span>
        </button>
        <button type="button" class="gs-run-export-btn" title="Export this run as PDF">&#128196;</button>
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
      // Not nextElementSibling — the toggle now sits inside .gs-run-header-row
      // alongside the export button, so .gs-run-detail is its card's child,
      // not its own sibling.
      const detail = btn.closest(".gs-run-card").querySelector(".gs-run-detail");
      const opening = detail.style.display === "none";
      detail.style.display = opening ? "block" : "none";
      btn.setAttribute("aria-expanded", String(opening));
      btn.querySelector(".gs-run-caret").innerHTML = opening ? "&#9662;" : "&#9656;";
    });
  });
}

// Exports just ONE run — not the whole page — as a PDF via the browser's
// native print dialog ("Save as PDF" as the destination, no library, no
// server round-trip). `body.gs-printing-one` + `.gs-print-target` (set
// here, read by the @media print rules in history.html) hide every other
// run card for the duration of the print. The clicked run's own detail is
// forced open first so a never-expanded card still exports in full, and
// its open/closed state is put back afterward exactly as the player left it.
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
  const link = document.getElementById("hCopyUid");
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

async function loadMyRuns(db, uid) {
  const statusEl = document.getElementById("hStatus");
  const bestSectionEl = document.getElementById("hBestSection");
  const bestEl = document.getElementById("hBest");
  const listEl = document.getElementById("hList");
  bestSectionEl.style.display = "";
  document.getElementById("hListTitle").textContent = "All Runs";

  const snap = await db.collection("geostreakRuns")
    .where("uid", "==", uid)
    .orderBy("playedAt", "desc")
    .limit(RUNS_LIMIT)
    .get();

  if (snap.empty) {
    statusEl.innerHTML = 'No runs recorded on this browser yet — play a round of <a href="geoStreakGame.html">GeoStreak</a> first.';
    bestSectionEl.style.display = "none";
    listEl.innerHTML = "";
    return;
  }

  const runs = snap.docs.map((doc) => doc.data());
  const best = runs.reduce((a, b) => (b.finalStreak > a.finalStreak ? b : a), runs[0]);

  statusEl.textContent = runs.length === RUNS_LIMIT
    ? `Showing your ${RUNS_LIMIT} most recent runs.`
    : `${runs.length} run${runs.length === 1 ? "" : "s"} on this account.`;

  bestEl.innerHTML = buildRunCard(best, { best: true });
  listEl.innerHTML = runs.map((r) => buildRunCard(r)).join("");
  wireRunToggles(bestEl);
  wireRunToggles(listEl);
  wireExportButtons(bestEl);
  wireExportButtons(listEl);
}

// Master-only: every player's runs, most recent first, system-wide —
// not per-player, so no "Personal Best" pin (whose would it be?) and no
// uid filter on the query, which is exactly the difference firestore.rules'
// isMaster() has to allow for this uid and no one else's. Same RUNS_LIMIT
// as loadMyRuns(), just spread across everyone instead of one player — a
// recent-activity feed, not a complete archive.
async function loadAllRuns(db) {
  const statusEl = document.getElementById("hStatus");
  const bestSectionEl = document.getElementById("hBestSection");
  const listEl = document.getElementById("hList");
  bestSectionEl.style.display = "none";
  document.getElementById("hListTitle").textContent = "All Players — Recent Runs";

  const snap = await db.collection("geostreakRuns")
    .orderBy("playedAt", "desc")
    .limit(RUNS_LIMIT)
    .get();

  if (snap.empty) {
    statusEl.textContent = "No runs recorded by anyone yet.";
    listEl.innerHTML = "";
    return;
  }

  const runs = snap.docs.map((doc) => doc.data());
  statusEl.textContent = runs.length === RUNS_LIMIT
    ? `Showing the ${RUNS_LIMIT} most recent runs across every player.`
    : `${runs.length} run${runs.length === 1 ? "" : "s"} recorded across every player.`;

  listEl.innerHTML = runs.map((r) => buildRunCard(r, { showNickname: true })).join("");
  wireRunToggles(listEl);
  wireExportButtons(listEl);
}

function wireHistoryTabs(db, uid) {
  const tabsEl = document.getElementById("hTabs");
  const mineBtn = document.getElementById("hTabMine");
  const allBtn = document.getElementById("hTabAll");
  if (!MASTER_UIDS.includes(uid) || !tabsEl || !mineBtn || !allBtn) return;

  tabsEl.style.display = "flex";
  mineBtn.addEventListener("click", () => {
    mineBtn.classList.add("gs-tab-active");
    allBtn.classList.remove("gs-tab-active");
    loadMyRuns(db, uid).catch((err) => reportLoadError(err));
  });
  allBtn.addEventListener("click", () => {
    allBtn.classList.add("gs-tab-active");
    mineBtn.classList.remove("gs-tab-active");
    loadAllRuns(db).catch((err) => reportLoadError(err));
  });
}

function reportLoadError(err) {
  console.error("History: load failed", err);
  document.getElementById("hBestSection").style.display = "none";
  const statusEl = document.getElementById("hStatus");
  if (err && err.code === "failed-precondition") {
    // Firestore's own error for this includes a direct link to
    // auto-create the missing composite index — that link only shows up
    // in the real browser console (err.message), not here, since it's
    // specific to this Firebase project.
    statusEl.textContent = "This query needs a Firestore index — open the browser console for a one-click link to create it.";
  } else {
    statusEl.textContent = "Could not load history.";
  }
}

async function main() {
  const statusEl = document.getElementById("hStatus");
  const bestSectionEl = document.getElementById("hBestSection");

  if (!configured) {
    statusEl.textContent = "History isn't configured yet — see firebaseConfig.js.";
    bestSectionEl.style.display = "none";
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
    await loadMyRuns(db, user.uid);
  } catch (err) {
    reportLoadError(err);
  }
}

main();
