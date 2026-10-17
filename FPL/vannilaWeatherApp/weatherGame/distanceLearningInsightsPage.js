// DistanceLearningQuiz's Insights page — stats computed in the browser from
// runs and attempts, filterable by round (Overall / India / World / Europe).
//
// "My Insights" is the union of this browser's localStorage tables and the
// player's uploaded Firestore records (merged by runId / attemptId), so it
// still works offline or from a file:// page, and still shows history
// uploaded before this browser's storage was cleared.
//
// Master accounts also get "All Players" (everyone combined) and "By
// Player" (pick anyone). Those read every player's records, which
// firestore.rules only allows for isMaster().

// Same allowlist as the history pages; must match isMaster() in
// firestore.rules. This copy only decides whether the master views show.
const MASTER_UIDS = ["B0N7TfmkrXTaYjB2TBCVOBVtIhM2", "MsRKlqcPecOBng8SHekRF5YCVFJ3", "WmoVyIkr2eVCtQHMPwoiTnKWZQp1", "M9odxs0JSTPAnFuewYOCB2BEPR03"];

// Round filter tabs: Overall plus the open rounds.
const ROUND_TABS = [["overall", "Overall"], ["india", "India"], ["world", "World"], ["europe", "Europe"]];

const ROUND_LABELS = {
  india: "India", world: "World", europe: "Europe", na: "North America",
  asia: "Asia", australia: "Australia", africa: "Africa",
};
const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const ARROWS = { N: "↑", NE: "↗", E: "→", SE: "↘", S: "↓", SW: "↙", W: "←", NW: "↖" };
const OUTCOMES = [
  ["scored", "Scored"],
  ["not_found", "City not found"],
  ["wrong_region", "Outside the round's region"],
  ["already_used", "Already used / centre"],
  ["timeout", "Time ran out"],
];
// Target-distance bands, km (World goes up to 15,000).
const BANDS = [
  [100, 499, "100–499 km"],
  [500, 999, "500–999 km"],
  [1000, 1499, "1,000–1,499 km"],
  [1500, 2000, "1,500–2,000 km"],
  [2001, 5000, "2,001–5,000 km"],
  [5001, 15000, "5,001–15,000 km"],
];

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

function place(p) {
  return p ? `${flagEmoji(p.country)} ${escapeHtml(p.name)}, ${escapeHtml(p.country)}` : "";
}

function fmt1(n) {
  return (Math.round(n * 10) / 10).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function fmtInt(n) {
  return Math.round(n).toLocaleString();
}

function avg(list) {
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
}

function formatDuration(ms) {
  const totalSeconds = Math.round(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

function mergeById(lists, key) {
  const byId = new Map();
  lists.flat().forEach((r) => { if (r && r[key]) byId.set(r[key], r); });
  return [...byId.values()];
}

// ---- Rendering helpers --------------------------------------------------------

function tile(label, value, sub = "") {
  return `
    <div class="dli-tile">
      <span class="dli-tile-label">${label}</span>
      <span class="dli-tile-value">${value}</span>
      ${sub ? `<span class="dli-tile-sub">${sub}</span>` : ""}
    </div>`;
}

// A single-series horizontal bar list: label, bar, value written out.
function barList(rows, { valueLabel = (v) => fmtInt(v), title = (r) => "" } = {}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return `
    <ul class="dli-bars">
      ${rows.map((r) => `
        <li title="${escapeHtml(title(r))}">
          <span class="dli-bar-label">${r.label}</span>
          <span class="dli-bar-track"><span class="dli-bar" style="width: ${(r.value / max) * 100}%"></span></span>
          <span class="dli-bar-value">${valueLabel(r.value, r)}</span>
        </li>`).join("")}
    </ul>`;
}

function section(title, body, note = "") {
  return `
    <section class="dli-section">
      <h2 class="dli-section-title">${title}</h2>
      ${note ? `<p class="dli-note">${note}</p>` : ""}
      ${body}
    </section>`;
}

// ---- Stats ---------------------------------------------------------------------

// Wording for whose stats these are: you, everyone, or one named player.
function wordsFor(who) {
  if (who.kind === "me") {
    return { tends: "You tend", poss: "your", heads: "Directions you head", submissions: "What happened to your submissions", best: "Your 10 best answers", typed: "Every city you typed" };
  }
  if (who.kind === "all") {
    return { tends: "Players tend", poss: "all", heads: "Directions players head", submissions: "What happened to everyone's submissions", best: "Top 10 answers, all players", typed: "Every city anyone typed" };
  }
  const name = escapeHtml(who.name);
  return { tends: `${name} tends`, poss: `${name}'s`, heads: `Directions ${name} heads`, submissions: `What happened to ${name}'s submissions`, best: `${name}'s 10 best answers`, typed: `Every city ${name} typed` };
}

function render(runs, attempts, who = { kind: "me" }) {
  const el = document.getElementById("dliContent");
  const w = wordsFor(who);
  const showPlayer = who.kind === "all";
  if (!runs.length && !attempts.length) {
    el.innerHTML = who.kind === "me"
      ? '<p class="dli-note">No quizzes here yet &mdash; play a round of <a href="distanceLearningQuiz.html">DistanceLearningQuiz</a> and come back.</p>'
      : '<p class="dli-note">No quizzes here yet.</p>';
    return;
  }

  const questions = runs.flatMap((r) => (r.questions || []).map((q) => ({ ...q, roundKey: r.roundKey, nickname: r.nickname })));
  const scored = questions.filter((q) => q.status === "scored");
  const best = runs.reduce((b, r) => (!b || r.totalScore > b.totalScore ? r : b), null);
  const fullRuns = runs.filter((r) => !r.quitEarly);
  const totalPoints = runs.reduce((sum, r) => sum + r.totalScore, 0);
  const totalTime = runs.reduce((sum, r) => sum + (r.durationMs || 0), 0);

  // Overview
  const players = new Set(runs.map((r) => r.uid).filter(Boolean)).size;
  const overview = `
    <div class="dli-tiles">
      ${showPlayer ? tile("Players", fmtInt(players), "with at least one uploaded quiz") : ""}
      ${tile("Quizzes played", fmtInt(runs.length), `${fmtInt(fullRuns.length)} finished, ${fmtInt(runs.length - fullRuns.length)} quit`)}
      ${tile("Best score", best ? fmt1(best.totalScore) : "&ndash;", best ? `${showPlayer && best.nickname ? `${escapeHtml(best.nickname)} &middot; ` : ""}${ROUND_LABELS[best.roundKey] || best.roundKey} &middot; out of 1,500` : "")}
      ${tile("Average score", fullRuns.length ? fmt1(avg(fullRuns.map((r) => r.totalScore))) : "&ndash;", "per finished quiz")}
      ${tile("Total points", fmt1(totalPoints))}
      ${tile("Questions scored", `${fmtInt(scored.length)} / ${fmtInt(questions.length)}`, questions.length ? `${fmtInt((scored.length / questions.length) * 100)}% got a valid answer in` : "")}
      ${tile("Avg points per answer", scored.length ? fmt1(avg(scored.map((q) => q.points))) : "&ndash;", "scored answers only")}
      ${tile("Time played", formatDuration(totalTime))}
      ${tile("Avg answer time", scored.length ? `${fmt1(avg(scored.map((q) => q.timeTakenMs || 0)) / 1000)}s` : "&ndash;", "scored answers only")}
    </div>`;

  // Accuracy
  const withDistance = scored.filter((q) => q.distanceKm != null);
  const errors = withDistance.map((q) => Math.abs(q.distanceKm - q.targetKm));
  const over = withDistance.filter((q) => q.distanceKm > q.targetKm).length;
  const short = withDistance.filter((q) => q.distanceKm < q.targetKm).length;
  const nearPerfect = scored.filter((q) => q.points >= 95).length;
  const zeroes = scored.filter((q) => q.points === 0).length;
  let tendency = "No answers yet to judge.";
  if (withDistance.length) {
    // Compared against each other, so exact hits don't count either way.
    const overPct = (over / withDistance.length) * 100;
    const shortPct = (short / withDistance.length) * 100;
    tendency = over > short * 1.2 ? `${w.tends} to <b>overshoot</b>: ${fmtInt(overPct)}% of ${w.poss} answers were further than the target.`
      : short > over * 1.2 ? `${w.tends} to <b>undershoot</b>: ${fmtInt(shortPct)}% of ${w.poss} answers were closer than the target.`
      : "Balanced: about as many answers too far as too close.";
  }
  const accuracy = `
    <div class="dli-tiles">
      ${tile("Average miss", withDistance.length ? `${fmtInt(avg(errors))} km` : "&ndash;", "|target &minus; actual|")}
      ${tile("Average miss, % of target", withDistance.length ? `${fmtInt(avg(withDistance.map((q) => Math.abs(q.distanceKm - q.targetKm) / q.targetKm)) * 100)}%` : "&ndash;")}
      ${tile("Too far / too close", `${fmtInt(over)} / ${fmtInt(short)}`)}
      ${tile("95+ point answers", fmtInt(nearPerfect), `${fmtInt(zeroes)} scored answers got 0`)}
    </div>
    <p class="dli-callout">${tendency}</p>`;

  // By round
  const roundRows = Object.keys(ROUND_LABELS).map((key) => {
    const rr = runs.filter((r) => r.roundKey === key);
    if (!rr.length) return "";
    const rq = questions.filter((q) => q.roundKey === key && q.status === "scored");
    const bestScore = Math.max(...rr.map((r) => r.totalScore));
    const finished = rr.filter((r) => !r.quitEarly);
    return `
      <tr>
        <td>${ROUND_LABELS[key]}</td>
        <td>${fmtInt(rr.length)}</td>
        <td class="dli-strong">${fmt1(bestScore)}</td>
        <td>${finished.length ? fmt1(avg(finished.map((r) => r.totalScore))) : "&ndash;"}</td>
        <td>${rq.length ? fmt1(avg(rq.map((q) => q.points))) : "&ndash;"}</td>
        <td>${rq.length ? `${fmtInt(avg(rq.map((q) => Math.abs(q.distanceKm - q.targetKm))))} km` : "&ndash;"}</td>
      </tr>`;
  }).join("");
  const byRound = `
    <div class="dli-table-wrap">
      <table class="dli-table">
        <thead><tr><th>Round</th><th>Quizzes</th><th>Best</th><th>Avg score</th><th>Avg pts / answer</th><th>Avg miss</th></tr></thead>
        <tbody>${roundRows}</tbody>
      </table>
    </div>`;

  // By target distance
  const bandRows = BANDS.map(([lo, hi, label]) => {
    const inBand = scored.filter((q) => q.targetKm >= lo && q.targetKm <= hi);
    return inBand.length ? { label, value: avg(inBand.map((q) => q.points)), count: inBand.length } : null;
  }).filter(Boolean);
  const byBand = bandRows.length
    ? barList(bandRows, {
      valueLabel: (v, r) => `${fmt1(v)} pts <span class="dli-muted">&middot; ${r.count}</span>`,
      title: (r) => `${r.label}: ${fmt1(r.value)} average points over ${r.count} answers`,
    })
    : '<p class="dli-note">No scored answers yet.</p>';

  // Directions
  const dirRows = DIRECTIONS.map((d) => {
    const inDir = scored.filter((q) => q.direction === d);
    return { label: `<span class="dli-arrow">${ARROWS[d]}</span> ${d}`, value: inDir.length, avgPts: avg(inDir.map((q) => q.points)), dir: d };
  });
  const byDirection = scored.some((q) => q.direction)
    ? barList(dirRows, {
      valueLabel: (v, r) => `${fmtInt(v)} <span class="dli-muted">&middot; ${v ? `${fmt1(r.avgPts)} avg pts` : "&ndash;"}</span>`,
      title: (r) => `${r.dir}: ${r.value} answers, ${fmt1(r.avgPts)} average points`,
    })
    : '<p class="dli-note">No directions recorded yet.</p>';

  // Attempt outcomes
  const outcomeRows = OUTCOMES.map(([key, label]) => ({ label, value: attempts.filter((a) => a.outcome === key).length }));
  const byOutcome = attempts.length
    ? barList(outcomeRows, {
      valueLabel: (v) => `${fmtInt(v)} <span class="dli-muted">&middot; ${fmtInt((v / attempts.length) * 100)}%</span>`,
      title: (r) => `${r.label}: ${r.value} of ${attempts.length} submissions`,
    })
    : '<p class="dli-note">No attempts recorded yet.</p>';

  // Best answers
  const topAnswers = [...scored].sort((a, b) => b.points - a.points).slice(0, 10);
  const bestAnswers = topAnswers.length ? `
    <div class="dli-table-wrap">
      <table class="dli-table">
        <thead><tr><th>#</th>${showPlayer ? "<th>Player</th>" : ""}<th>From</th><th>Answer</th><th>Target</th><th>Actual</th><th>Pts</th><th>Round</th></tr></thead>
        <tbody>
          ${topAnswers.map((q, i) => `
            <tr class="${i === 0 ? "dli-row-top" : ""}">
              <td>${i === 0 ? "&#127942;" : i + 1}</td>
              ${showPlayer ? `<td>${escapeHtml(q.nickname || "Anonymous")}</td>` : ""}
              <td>${place(q.centre)}</td>
              <td>${place(q.answer)}</td>
              <td>${fmtInt(q.targetKm)} km</td>
              <td>${fmtInt(q.distanceKm)} km</td>
              <td class="dli-strong">${fmt1(q.points)}</td>
              <td>${ROUND_LABELS[q.roundKey] || q.roundKey}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>` : '<p class="dli-note">No scored answers yet.</p>';

  // Most used cities and countries
  const tally = (keyFn, labelFn) => {
    const counts = new Map();
    scored.forEach((q) => {
      if (!q.answer) return;
      const k = keyFn(q.answer);
      const entry = counts.get(k) || { label: labelFn(q.answer), value: 0 };
      entry.value += 1;
      counts.set(k, entry);
    });
    return [...counts.values()].sort((a, b) => b.value - a.value).slice(0, 10);
  };
  const cities = tally((p) => `${p.name}|${p.country}`, place);
  const countries = tally((p) => p.country, (p) => `${flagEmoji(p.country)} ${escapeHtml(p.country)}`);
  const used = `
    <div class="dli-two-col">
      <div>
        <h3 class="dli-sub-title">Cities</h3>
        ${cities.length ? barList(cities, { title: (r) => `${r.value} answers` }) : '<p class="dli-note">None yet.</p>'}
      </div>
      <div>
        <h3 class="dli-sub-title">Countries</h3>
        ${countries.length ? barList(countries, { title: (r) => `${r.value} answers` }) : '<p class="dli-note">None yet.</p>'}
      </div>
    </div>`;

  el.innerHTML = [
    section("Overview", overview),
    section("Accuracy", accuracy, "How far the real distance landed from the target, over every scored answer."),
    section("By round", byRound),
    section("Average points by target distance", byBand, "Which target lengths are judged best. The small number is how many answers."),
    section(w.heads, byDirection, "Compass direction from the centre to the answer, with the average points in each."),
    section(w.submissions, byOutcome, `${w.typed}, including warnings and timeouts.`),
    section(w.best, bestAnswers),
    section("Most used answers", used),
  ].join("");
}

// ---- Views and round filter ----------------------------------------------------

const state = {
  view: "me", // "me" | "all" | "player" — the last two for masters only
  round: "overall",
  playerUid: null,
  mine: { runs: [], attempts: [] },
  all: null, // every player's records, loaded on first use by a master
  mineSource: "", // where "My Insights" data came from, for the status line
};

function countText(runs, attempts) {
  return `${runs.length} quiz${runs.length === 1 ? "" : "zes"} and ${attempts.length} submission${attempts.length === 1 ? "" : "s"}`;
}

function forRound(data) {
  if (state.round === "overall") return data;
  return {
    runs: data.runs.filter((r) => r.roundKey === state.round),
    attempts: data.attempts.filter((a) => a.roundKey === state.round),
  };
}

// Players who have uploaded a run, most quizzes first; nickname from their
// latest run.
function playerList() {
  const byUid = new Map();
  state.all.runs.forEach((r) => {
    const p = byUid.get(r.uid) || { uid: r.uid, name: r.nickname || "Anonymous", runs: 0, latest: "" };
    p.runs += 1;
    if (String(r.finishedAt) > p.latest) {
      p.latest = String(r.finishedAt);
      p.name = r.nickname || p.name;
    }
    byUid.set(r.uid, p);
  });
  return [...byUid.values()].sort((a, b) => b.runs - a.runs || a.name.localeCompare(b.name));
}

function roundLabel() {
  return state.round === "overall" ? "" : ` &middot; ${ROUND_LABELS[state.round]} only`;
}

function show() {
  const statusEl = document.getElementById("dliStatus");
  const select = document.getElementById("dliPlayer");
  select.style.display = state.view === "player" ? "" : "none";
  document.getElementById("dliTitle").textContent = state.view === "all" ? "All Players" : state.view === "player" ? "Player Insights" : "Your Insights";

  if (state.view === "me") {
    const data = forRound(state.mine);
    render(data.runs, data.attempts, { kind: "me" });
    statusEl.innerHTML = `${countText(data.runs, data.attempts)}${roundLabel()}, ${state.mineSource}`;
    return;
  }
  if (!state.all) {
    statusEl.textContent = "Loading every player's quizzes…";
    document.getElementById("dliContent").innerHTML = "";
    return;
  }
  if (state.view === "all") {
    const data = forRound(state.all);
    render(data.runs, data.attempts, { kind: "all" });
    const players = new Set(data.runs.map((r) => r.uid)).size;
    statusEl.innerHTML = `${countText(data.runs, data.attempts)} from ${players} player${players === 1 ? "" : "s"}${roundLabel()}.`;
    return;
  }
  const player = playerList().find((p) => p.uid === state.playerUid);
  if (!player) {
    document.getElementById("dliContent").innerHTML = '<p class="dli-note">No players have uploaded a quiz yet.</p>';
    statusEl.textContent = "";
    return;
  }
  const data = forRound({
    runs: state.all.runs.filter((r) => r.uid === player.uid),
    attempts: state.all.attempts.filter((a) => a.uid === player.uid),
  });
  render(data.runs, data.attempts, { kind: "player", name: player.name });
  statusEl.innerHTML = `${escapeHtml(player.name)}: ${countText(data.runs, data.attempts)}${roundLabel()}.`;
}

function fillPlayerSelect() {
  const select = document.getElementById("dliPlayer");
  const players = playerList();
  select.innerHTML = players.map((p) => `<option value="${escapeHtml(p.uid)}">${escapeHtml(p.name)} (${p.runs} quiz${p.runs === 1 ? "" : "zes"})</option>`).join("");
  if (!state.playerUid && players.length) state.playerUid = players[0].uid;
  select.value = state.playerUid || "";
}

async function loadAll() {
  if (state.all) return;
  try {
    state.all = await DistanceLearningBoard.loadAllData();
  } catch (err) {
    console.error("DistanceLearningQuiz Insights: loadAllData failed", err);
  }
  if (!state.all) {
    document.getElementById("dliStatus").textContent = "Could not load every player's quizzes.";
    return;
  }
  fillPlayerSelect();
}

function wireTabs(containerId, onPick) {
  const container = document.getElementById(containerId);
  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("button").forEach((b) => b.classList.toggle("dli-tab-active", b === btn));
      onPick(btn.dataset.key);
    });
  });
}

function buildControls() {
  document.getElementById("dliRounds").innerHTML = ROUND_TABS
    .map(([key, label]) => `<button type="button" class="dli-tab${key === state.round ? " dli-tab-active" : ""}" data-key="${key}">${label}</button>`).join("");
  wireTabs("dliRounds", (key) => { state.round = key; show(); });
}

async function main() {
  const local = { runs: DistanceLearningStore.getRuns(), attempts: DistanceLearningStore.getAttempts() };
  // Show this browser's data straight away, then fold in the cloud copy.
  state.mine = local;
  state.mineSource = "from this browser (checking your uploaded history…)";
  buildControls();
  show();

  let cloud = null;
  try {
    cloud = await DistanceLearningBoard.loadMyData();
  } catch (err) {
    console.error("DistanceLearningQuiz Insights: cloud load failed", err);
  }
  if (!cloud) {
    state.mineSource = `from this browser only. ${DistanceLearningBoard.offlineNote || "Couldn't reach Firebase."}`;
    show();
    return;
  }
  state.mine = {
    runs: mergeById([cloud.runs, local.runs], "runId"),
    attempts: mergeById([cloud.attempts, local.attempts], "attemptId"),
  };
  state.mineSource = "from this browser and your uploaded history.";
  show();

  const uid = await DistanceLearningBoard.getUid();
  if (MASTER_UIDS.includes(uid)) {
    const views = document.getElementById("dliViews");
    views.querySelector(".dli-master-note").textContent = "Master view";
    buildControlsMaster();
  }
}

// Master controls are wired separately so the round tabs aren't wired twice.
function buildControlsMaster() {
  const views = document.getElementById("dliViews");
  views.style.display = "";
  wireTabs("dliViewTabs", async (key) => {
    state.view = key;
    show();
    if (key !== "me" && !state.all) {
      await loadAll();
      show();
    }
  });
  document.getElementById("dliPlayer").addEventListener("change", (e) => {
    state.playerUid = e.target.value;
    show();
  });
}

main();
