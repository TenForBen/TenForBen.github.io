// DistanceLearningQuiz's Insights page — the player's own stats, computed
// in the browser from their runs and attempts.
//
// Data is the union of this browser's localStorage tables and the player's
// uploaded Firestore records (merged by runId / attemptId), so it still
// works offline or from a file:// page, and still shows history uploaded
// before this browser's storage was cleared.

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

function render(runs, attempts) {
  const el = document.getElementById("dliContent");
  if (!runs.length && !attempts.length) {
    el.innerHTML = '<p class="dli-note">No quizzes yet &mdash; play a round of <a href="distanceLearningQuiz.html">DistanceLearningQuiz</a> and come back.</p>';
    return;
  }

  const questions = runs.flatMap((r) => (r.questions || []).map((q) => ({ ...q, roundKey: r.roundKey })));
  const scored = questions.filter((q) => q.status === "scored");
  const best = runs.reduce((b, r) => (!b || r.totalScore > b.totalScore ? r : b), null);
  const fullRuns = runs.filter((r) => !r.quitEarly);
  const totalPoints = runs.reduce((sum, r) => sum + r.totalScore, 0);
  const totalTime = runs.reduce((sum, r) => sum + (r.durationMs || 0), 0);

  // Overview
  const overview = `
    <div class="dli-tiles">
      ${tile("Quizzes played", fmtInt(runs.length), `${fmtInt(fullRuns.length)} finished, ${fmtInt(runs.length - fullRuns.length)} quit`)}
      ${tile("Best score", best ? fmt1(best.totalScore) : "&ndash;", best ? `${ROUND_LABELS[best.roundKey] || best.roundKey} &middot; out of 1,500` : "")}
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
    tendency = over > short * 1.2 ? `You tend to <b>overshoot</b>: ${fmtInt(overPct)}% of your answers were further than the target.`
      : short > over * 1.2 ? `You tend to <b>undershoot</b>: ${fmtInt(shortPct)}% of your answers were closer than the target.`
      : "You're balanced: about as many answers too far as too close.";
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
        <thead><tr><th>#</th><th>From</th><th>Answer</th><th>Target</th><th>Actual</th><th>Pts</th><th>Round</th></tr></thead>
        <tbody>
          ${topAnswers.map((q, i) => `
            <tr class="${i === 0 ? "dli-row-top" : ""}">
              <td>${i === 0 ? "&#127942;" : i + 1}</td>
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
    section("Average points by target distance", byBand, "Which target lengths you judge best. The small number is how many answers."),
    section("Directions you head", byDirection, "Compass direction from the centre to your answer, with your average points in each."),
    section("What happened to your submissions", byOutcome, "Every city you typed, including warnings and timeouts."),
    section("Your 10 best answers", bestAnswers),
    section("Most used answers", used),
  ].join("");
}

async function main() {
  const statusEl = document.getElementById("dliStatus");
  const local = { runs: DistanceLearningStore.getRuns(), attempts: DistanceLearningStore.getAttempts() };
  // Show this browser's data straight away, then fold in the cloud copy.
  render(local.runs, local.attempts);
  statusEl.textContent = `From this browser: ${local.runs.length} quiz${local.runs.length === 1 ? "" : "zes"}.`;

  let cloud = null;
  try {
    cloud = await DistanceLearningBoard.loadMyData();
  } catch (err) {
    console.error("DistanceLearningQuiz Insights: cloud load failed", err);
  }
  if (!cloud) {
    statusEl.textContent = `From this browser only (${local.runs.length} quiz${local.runs.length === 1 ? "" : "zes"}). ${DistanceLearningBoard.offlineNote || "Couldn't reach Firebase."}`;
    return;
  }
  const runs = mergeById([cloud.runs, local.runs], "runId");
  const attempts = mergeById([cloud.attempts, local.attempts], "attemptId");
  render(runs, attempts);
  statusEl.textContent = `${runs.length} quiz${runs.length === 1 ? "" : "zes"} and ${attempts.length} submissions, from this browser and your uploaded history.`;
}

main();
