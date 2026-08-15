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
  return round.correct
    ? '<span class="gs-badge gs-badge-correct">CORRECT</span>'
    : '<span class="gs-badge gs-badge-incorrect">INCORRECT</span>';
}

function buildRoundsTable(rounds) {
  const rows = rounds.map((r, i) => {
    const guess = r.timedOut
      ? "&mdash;"
      : `${flagEmoji(r.country)} ${escapeHtml(r.resolvedCity || "")}`;
    const temp = r.temp != null ? `${Math.round(r.temp)}°C` : "&mdash;";
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(formatCondition(r))}</td>
        <td>${guess}</td>
        <td>${temp}</td>
        <td>${formatResultBadge(r)}</td>
      </tr>
    `;
  }).join("");

  return `
    <table class="gs-round-table">
      <thead>
        <tr><th>#</th><th>Condition</th><th>Guess</th><th>Temp</th><th>Result</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function formatPlayedAt(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "just now";
  return timestamp.toDate().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function buildRunCard(run, { best = false } = {}) {
  const reasonLabel = run.reason === "time" ? "Time's Up" : "Game Over";
  const roundWord = run.roundCount === 1 ? "round" : "rounds";
  return `
    <div class="gs-run-card${best ? " gs-run-card-best" : ""}">
      <button type="button" class="gs-run-toggle" aria-expanded="false">
        <span class="gs-run-streak">${run.finalStreak}</span>
        <span class="gs-run-meta">${escapeHtml(reasonLabel)} &middot; ${run.roundCount} ${roundWord} &middot; ${formatPlayedAt(run.playedAt)}</span>
        <span class="gs-run-caret">&#9656;</span>
      </button>
      <div class="gs-run-detail" style="display: none;">
        ${buildRoundsTable(run.rounds || [])}
      </div>
    </div>
  `;
}

function wireRunToggles(container) {
  container.querySelectorAll(".gs-run-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const detail = btn.nextElementSibling;
      const opening = detail.style.display === "none";
      detail.style.display = opening ? "block" : "none";
      btn.setAttribute("aria-expanded", String(opening));
      btn.querySelector(".gs-run-caret").innerHTML = opening ? "&#9662;" : "&#9656;";
    });
  });
}

async function main() {
  const statusEl = document.getElementById("hStatus");
  const bestSectionEl = document.getElementById("hBestSection");
  const bestEl = document.getElementById("hBest");
  const listEl = document.getElementById("hList");

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

    const snap = await db.collection("geostreakRuns")
      .where("uid", "==", user.uid)
      .orderBy("playedAt", "desc")
      .limit(RUNS_LIMIT)
      .get();

    if (snap.empty) {
      statusEl.innerHTML = 'No runs recorded on this browser yet — play a round of <a href="geoStreakGame.html">GeoStreak</a> first.';
      bestSectionEl.style.display = "none";
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
  } catch (err) {
    console.error("History: load failed", err);
    bestSectionEl.style.display = "none";
    if (err && err.code === "failed-precondition") {
      // Firestore's own error for this includes a direct link to
      // auto-create the missing composite index — that link only shows up
      // in the real browser console (err.message), not here, since it's
      // specific to this Firebase project.
      statusEl.textContent = "This query needs a Firestore index — open the browser console for a one-click link to create it.";
    } else {
      statusEl.textContent = "Could not load your history.";
    }
  }
}

main();
