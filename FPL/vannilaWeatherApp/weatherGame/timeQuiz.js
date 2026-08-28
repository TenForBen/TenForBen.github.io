// Time Quiz — a Kahoot-style companion to GeoStreak: same core loop
// (type a city whose current temperature matches a condition, judged
// live against OpenWeatherMap), but a fixed 15-question quiz instead of
// an infinite streak, each question region-scoped, scored by how fast
// you answer rather than how long you survive.
//
// Standalone for now — one browser, no shared/live multiplayer session.
// Questions are still generated from a seed (defaulting to a random one
// per play) so a future "same quiz for everyone" mode just has to
// broadcast that seed rather than restructuring question generation.
//
// Self-contained like historyPage.js / checklist/app.js — no build step
// to import ui.js's GeoStreak-specific renderers from, and this page's
// UI is simple enough not to need them.

const QUESTION_COUNT = 15;
const MODERATE_COUNT = 10; // first 10 easier, last 5 tougher — same shape as GeoStreak's own question-11-gets-tough rule
const QUESTION_SECONDS = 20;
const MAX_POINTS = 1000;
const GAP_SECONDS = 5; // pause between questions before auto-advancing
const BEST_SCORE_KEY = "timeQuiz_bestScore";

// ---- Regions: which countries qualify, and which temperature RANGES are
// fair game right now (August/September — northern-hemisphere late
// summer, southern-hemisphere late winter). Deliberately season-aware
// rather than just "anything above/below X": an unreachable condition
// (e.g. "Australia above 28°C" in their winter) isn't a hard question,
// it's an unfair one.
//
// Each region/tier/direction is a [min, max] RANGE, not a short fixed
// list — questions are meant to feel different from each other, and a
// handful of discrete choices repeated across 10-15 questions doesn't.
// `pickThreshold()` below draws a random integer from that range the
// same way GeoStreak's own pickThreshold() does: tracked in a per-
// region/tier/direction "already asked" set that doesn't allow a repeat
// until the whole range is exhausted (then refills). Country-code lists
// are broad-coverage, not exhaustive — easy to extend.
const REGIONS = {
  india: {
    label: "India",
    countryCodes: ["IN"],
    // August in India is hot almost everywhere (25-35°C+) except
    // Himalayan hill stations — so the moderate range stays on the
    // "still hot" side, and the tough "below" range only has an answer
    // at real altitude (Leh, Manali, Darjeeling). That's the example
    // this whole region table is built around. Also the fallback region
    // when nothing is picked on the start screen — see
    // DEFAULT_REGION_KEYS below.
    moderate: { above: [26, 34], below: [18, 24] },
    tough: { above: [35, 40], below: [3, 9] },
  },
  us: {
    label: "United States",
    countryCodes: ["US"],
    moderate: { above: [18, 26], below: [22, 29] },
    tough: { above: [34, 39], below: [2, 11] }, // above: Southwest desert; below: Alaska, high Rockies
  },
  canada: {
    label: "Canada",
    countryCodes: ["CA"],
    // August is full summer in populated southern Canada but the
    // northern territories stay cool even now — the tough "below" range
    // leans on Yukon/NWT/Nunavut the same way India's leans on
    // Himalayan altitude.
    moderate: { above: [16, 23], below: [22, 29] },
    tough: { above: [29, 34], below: [2, 9] },
  },
  europe: {
    label: "Europe",
    countryCodes: [
      "FR", "DE", "IT", "ES", "PT", "NL", "BE", "LU", "CH", "AT",
      "SE", "NO", "DK", "FI", "IS", "IE", "GB", "PL", "CZ", "SK",
      "HU", "RO", "BG", "GR", "HR", "SI", "RS", "BA", "ME", "MK",
      "AL", "EE", "LV", "LT", "MT", "CY", "LI", "MC", "AD", "SM",
      "VA", "UA", "BY", "MD",
    ],
    moderate: { above: [18, 25], below: [23, 29] },
    tough: { above: [31, 36], below: [3, 11] }, // above: southern-Europe heatwave; below: Scandinavia/Iceland
  },
  southAmerica: {
    label: "South America",
    countryCodes: ["AR", "BR", "CL", "CO", "PE", "VE", "EC", "BO", "PY", "UY", "GY", "SR"],
    // Southern-hemisphere winter in the southern cone (Argentina, Chile,
    // Uruguay) at the same time the equatorial north (Colombia,
    // Venezuela, Ecuador, northern Brazil) stays warm year-round —
    // unlike Australia/NZ, this continent genuinely spans both right
    // now, so both directions are fair game at the moderate tier too.
    moderate: { above: [23, 29], below: [15, 21] },
    tough: { above: [31, 36], below: [2, 9] },
  },
  africa: {
    label: "Africa",
    countryCodes: [
      "DZ", "EG", "LY", "TN", "MA", "SD", "SS", "ET", "KE", "TZ",
      "UG", "RW", "BI", "SO", "DJ", "ER", "NG", "GH", "CI", "SN",
      "ML", "NE", "TD", "CM", "CD", "CG", "GA", "GQ", "CF", "ZA",
      "NA", "BW", "ZW", "ZM", "MW", "MZ", "AO", "LS", "SZ", "MG", "MU",
    ],
    // Same hot-north/cold-south split as South America right now: North
    // Africa is scorching in August, southern Africa (South Africa,
    // Namibia, Lesotho) is in winter and genuinely cool, sometimes
    // near-freezing overnight at altitude.
    moderate: { above: [24, 31], below: [17, 23] },
    tough: { above: [36, 41], below: [2, 9] },
  },
};

const REGION_KEYS = Object.keys(REGIONS);
// If the player starts a quiz with no region checked, this is what runs
// instead of refusing to start.
const DEFAULT_REGION_KEYS = ["india"];

// ---- Seeded RNG (mulberry32) — deterministic given a seed, so a future
// "same quiz for everyone" mode just needs to share the seed. Falls back
// to a random seed per play otherwise; nothing else here needs to know
// the difference.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Ported straight from GeoStreak's own pickThreshold() in app.js: a
// random integer from [min, max] that hasn't already come out of this
// exact `usedSet` — once every value in the range has been asked, the
// set clears and the cycle starts over. This is what actually produces
// "mixing": a wide range plus no-repeat-until-exhausted, not a handful
// of hardcoded numbers to draw from.
function pickThreshold(usedSet, min, max, rng) {
  const remaining = [];
  for (let t = min; t <= max; t++) {
    if (!usedSet.has(t)) remaining.push(t);
  }
  if (remaining.length === 0) {
    usedSet.clear();
    for (let t = min; t <= max; t++) remaining.push(t);
  }
  const threshold = remaining[Math.floor(rng() * remaining.length)];
  usedSet.add(threshold);
  return threshold;
}

// 15 questions, cycling through `regionKeys` in shuffled order (repeating
// as needed — e.g. 15 questions over 2 selected regions means each shows
// up 7-8 times), avoiding an immediate repeat where possible. First
// MODERATE_COUNT questions draw from each region's `moderate` range, the
// rest from `tough`. Direction (above/below) strictly ALTERNATES question
// to question, same as GeoStreak's own nextDirection — not a fresh coin
// flip each time — with the starting side randomised per quiz.
//
// With exactly one region selected (India alone, the default — or any
// single checkbox), "avoid an immediate repeat" can never be satisfied
// after the first question, since there's no other region to fall back
// to — the loop below would spin forever trying anyway. That case is
// special-cased instead of feeding it through the general loop.
function buildQuestions(seed, regionKeys = REGION_KEYS) {
  const rng = mulberry32(seed);
  const activeKeys = regionKeys.length > 0 ? regionKeys : DEFAULT_REGION_KEYS;

  let regionCycle;
  if (activeKeys.length <= 1) {
    regionCycle = new Array(QUESTION_COUNT).fill(activeKeys[0]);
  } else {
    regionCycle = [];
    while (regionCycle.length < QUESTION_COUNT) {
      for (const key of shuffle(activeKeys, rng)) {
        if (regionCycle[regionCycle.length - 1] === key) continue; // avoid an immediate repeat when possible
        regionCycle.push(key);
        if (regionCycle.length >= QUESTION_COUNT) break;
      }
    }
  }

  let direction = rng() < 0.5 ? "above" : "below";
  const usedThresholds = {}; // "region|tier|direction" -> Set, one pool per combo, same split GeoStreak keeps between normal/tough

  return regionCycle.map((regionKey, i) => {
    const tier = i < MODERATE_COUNT ? "moderate" : "tough";
    const [min, max] = REGIONS[regionKey][tier][direction];
    const poolKey = `${regionKey}|${tier}|${direction}`;
    if (!usedThresholds[poolKey]) usedThresholds[poolKey] = new Set();
    const threshold = pickThreshold(usedThresholds[poolKey], min, max, rng);
    const question = { regionKey, tier, direction, threshold };
    direction = direction === "above" ? "below" : "above"; // strictly alternate for the next question
    return question;
  });
}

function conditionText(q) {
  const region = REGIONS[q.regionKey];
  return `Name a city in ${region.label.toUpperCase()} ${q.direction === "above" ? "ABOVE" : "BELOW"} ${q.threshold}°C`;
}

// ---- Scoring — 20 seconds split into 1000 points, straight line: 1s
// costs 50 points, 5s costs 250, and so on. A wrong answer (or a timeout)
// is 0 regardless of how fast it was "answered".
function computePoints(correct, elapsedSeconds) {
  if (!correct) return 0;
  const clamped = Math.max(0, Math.min(QUESTION_SECONDS, elapsedSeconds));
  return Math.round(MAX_POINTS * (1 - clamped / QUESTION_SECONDS));
}

function formatTimer(secondsLeft) {
  return Math.max(0, secondsLeft).toFixed(3);
}

// Same nickname as GeoStreak itself — same localStorage key
// leaderboard.js's getNickname() reads/writes, duplicated here rather
// than shared (Leaderboard's IIFE doesn't expose it, and this page has
// no build step to import it from another file anyway). Read-only here:
// editing a nickname stays GeoStreak's own page's job. Computed once and
// cached rather than re-read per render — leaderboard.js's own
// getNickname() falls back to a *fresh* random name on every call when
// none is saved, which would show a different placeholder name on the
// start screen vs. the final screen if this page called it more than once.
function randomNickname() {
  return `Player${Math.floor(1000 + Math.random() * 9000)}`;
}
const NICKNAME_KEY = "geoStreakGame_nickname";
const nickname = localStorage.getItem(NICKNAME_KEY) || randomNickname();

// ---- State ----------------------------------------------------------

const ft = new Fetch();

let questions = [];
let qIndex = 0;
let totalScore = 0;
let answers = []; // one entry per answered question, for the final breakdown table
let questionStartTime = null; // performance.now() when the current question appeared
let timerInterval = null;
let submitted = false; // guards against a stray Enter/click after the question already resolved
let usedCities = new Set(); // reset each startQuiz() — same-city-twice-this-quiz gets flagged, not silently accepted

const startEl = document.getElementById("tqStart");
const questionEl = document.getElementById("tqQuestion");
const resultEl = document.getElementById("tqResult");
const finalEl = document.getElementById("tqFinal");

function getBestScore() {
  return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
}
function saveBestScore(score) {
  if (score > getBestScore()) localStorage.setItem(BEST_SCORE_KEY, String(score));
}

function showOnly(el) {
  [startEl, questionEl, resultEl, finalEl].forEach((e) => {
    e.style.display = e === el ? "block" : "none";
  });
}

const LAST_REGIONS_KEY = "timeQuiz_lastRegions";

function loadLastRegions() {
  try {
    const raw = JSON.parse(localStorage.getItem(LAST_REGIONS_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((k) => REGION_KEYS.includes(k)) : [];
  } catch (err) {
    return [];
  }
}

function renderStart() {
  const best = getBestScore();
  const lastRegions = loadLastRegions();
  startEl.innerHTML = `
    <div class="tq-panel">
      <h3>Time Quiz</h3>
      <p class="tq-nickname">Playing as ${nickname}</p>
      <p class="tq-panel-sub">
        ${QUESTION_COUNT} questions, ${QUESTION_SECONDS}s each. Name a city
        matching the region and temperature condition — the faster you
        answer, the more it's worth.
      </p>
      <div class="tq-region-picker">
        <p class="tq-region-picker-label">Regions (pick any — none picked plays India only)</p>
        <div class="tq-region-checks">
          ${REGION_KEYS.map((key) => `
            <label class="tq-region-check-label">
              <input type="checkbox" class="tq-region-check" value="${key}" ${lastRegions.includes(key) ? "checked" : ""} />
              ${REGIONS[key].label}
            </label>
          `).join("")}
        </div>
      </div>
      <button type="button" id="tqStartBtn" class="btn btn-primary">Start Quiz</button>
      <ul class="tq-howto">
        <li>Each correct answer is worth up to ${MAX_POINTS} points, sliding down to 0 as the clock runs out.</li>
        <li>A wrong city, or one outside the named region, scores 0 for that question.</li>
        <li>No streak, no elimination — all ${QUESTION_COUNT} questions play out regardless of how you're doing.</li>
        <li>Questions 1&ndash;${MODERATE_COUNT} stay moderate; ${MODERATE_COUNT + 1}&ndash;${QUESTION_COUNT} get tougher.</li>
        <li>Every question comes from exactly one region — never mixed within a single question.</li>
      </ul>
      ${best > 0 ? `<p class="tq-best">Best score, this browser: ${best.toLocaleString()}</p>` : ""}
    </div>
  `;
  document.getElementById("tqStartBtn").addEventListener("click", startQuiz);
  showOnly(startEl);
}

function startQuiz() {
  const checked = Array.from(document.querySelectorAll(".tq-region-check:checked")).map((el) => el.value);
  const activeRegions = checked.length > 0 ? checked : DEFAULT_REGION_KEYS;
  localStorage.setItem(LAST_REGIONS_KEY, JSON.stringify(checked)); // remembers the actual checkboxes, not the India fallback
  questions = buildQuestions(Date.now() ^ Math.floor(Math.random() * 0xffffffff), activeRegions);
  qIndex = 0;
  totalScore = 0;
  answers = [];
  usedCities = new Set();
  showQuestion();
}

function showQuestion() {
  submitted = false;
  const q = questions[qIndex];
  questionEl.innerHTML = `
    <p class="tq-progress">Question ${qIndex + 1} / ${QUESTION_COUNT}</p>
    <p class="tq-score-live">Score so far: ${totalScore.toLocaleString()}</p>
    <p class="tq-timer" id="tqTimer">${formatTimer(QUESTION_SECONDS)}</p>
    <div class="tq-timer-bar-wrap"><div class="tq-timer-bar" id="tqTimerBar" style="width: 100%;"></div></div>
    <div class="tq-condition">
      <span class="tq-region-badge">${REGIONS[q.regionKey].label}</span>
      <p class="tq-condition-text">${conditionText(q)}</p>
    </div>
    <div class="tq-input-row">
      <input type="text" id="tqCityInput" class="form-control" placeholder="Type a city name..." autocomplete="off" />
      <button type="button" id="tqSubmitBtn" class="btn btn-primary">Submit</button>
    </div>
    <p class="tq-hint" id="tqHint"></p>
  `;
  showOnly(questionEl);

  const input = document.getElementById("tqCityInput");
  input.focus();
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") submitAnswer(); });
  document.getElementById("tqSubmitBtn").addEventListener("click", submitAnswer);

  questionStartTime = performance.now();
  startTimer();
}

function startTimer() {
  const timerEl = document.getElementById("tqTimer");
  const barEl = document.getElementById("tqTimerBar");
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = (performance.now() - questionStartTime) / 1000;
    const left = QUESTION_SECONDS - elapsed;
    if (!timerEl || !barEl) return; // question already moved on
    timerEl.textContent = formatTimer(left);
    barEl.style.width = `${Math.max(0, (left / QUESTION_SECONDS) * 100)}%`;
    timerEl.classList.toggle("tq-timer-warn", left <= 10 && left > 5);
    timerEl.classList.toggle("tq-timer-danger", left <= 5);
    if (left <= 0) {
      clearInterval(timerInterval);
      if (!submitted) resolveAnswer(null); // timed out — no city typed
    }
  }, 31);
}

// Same city, twice, this quiz — flagged rather than silently accepted,
// same as GeoStreak's own submitGuess(). Checked BOTH before the network
// call (the raw typed string, lowercased) and after it resolves (the
// canonical "name|country" key — catches "Auckland" then "Auckland,NZ"
// as the same place even though the raw strings differ). Either way
// this is a flag-and-retry, not a wrong answer: the clock keeps
// running, nothing is submitted, and the player gets another attempt at
// the same question.
async function submitAnswer() {
  if (submitted) return;
  const input = document.getElementById("tqCityInput");
  const hintEl = document.getElementById("tqHint");
  const typed = input.value.trim();
  if (!typed) {
    hintEl.textContent = "Type a city name, or just wait out the clock.";
    return;
  }
  if (usedCities.has(typed.toLowerCase())) {
    hintEl.textContent = `You've already used "${typed}" this quiz. Try a different city.`;
    return;
  }

  submitted = true; // lock in the elapsed time now, before the network round-trip
  const elapsedAtSubmit = (performance.now() - questionStartTime) / 1000;
  document.getElementById("tqSubmitBtn").disabled = true;

  let data = null;
  try {
    data = await ft.getCurrentForGame(typed);
  } catch (err) {
    data = null;
  }

  if (data) {
    const resolvedKey = `${data.name}|${data.sys.country}`.toLowerCase();
    if (usedCities.has(resolvedKey)) {
      submitted = false; // give the attempt back — this one didn't count
      document.getElementById("tqSubmitBtn").disabled = false;
      hintEl.textContent = `You've already used ${data.name}, ${data.sys.country} this quiz. Try a different city.`;
      input.focus();
      return;
    }
    usedCities.add(typed.toLowerCase());
    usedCities.add(resolvedKey);
  }

  resolveAnswer(data, elapsedAtSubmit, typed);
}

// `data` is the OpenWeatherMap response (or null if not found/timed out
// or the clock ran out with nothing typed). `elapsedSeconds` defaults to
// the full 20s on a genuine timeout. Double-resolution is already
// prevented upstream — submitAnswer() sets `submitted` synchronously
// before its network await, and startTimer()'s timeout branch only
// calls this when `!submitted` — so nothing further to guard here.
function resolveAnswer(data, elapsedSeconds, typed) {
  submitted = true;
  clearInterval(timerInterval);
  const elapsed = elapsedSeconds != null ? elapsedSeconds : QUESTION_SECONDS;
  const q = questions[qIndex];
  const region = REGIONS[q.regionKey];

  let correct = false;
  let detail;
  if (!data) {
    detail = typed ? `"${typed}" not found` : "Time's up — no answer";
  } else {
    const inRegion = region.countryCodes.includes(data.sys.country);
    const temp = Math.round(data.main.temp);
    const tempOk = q.direction === "above" ? temp >= q.threshold : temp <= q.threshold;
    correct = inRegion && tempOk;
    detail = `${data.name}, ${data.sys.country} — ${temp}°C`;
    if (!inRegion) detail += ` (not in ${region.label})`;
  }

  const points = computePoints(correct, elapsed);
  totalScore += points;
  answers.push({
    region: region.label,
    condition: `${q.direction === "above" ? "≥" : "≤"} ${q.threshold}°C`,
    detail,
    correct,
    elapsed,
    points,
  });

  renderQuestionResult(correct, detail, points);
}

function renderQuestionResult(correct, detail, points) {
  resultEl.innerHTML = `
    <div class="tq-result-panel">
      <span class="tq-result-badge ${correct ? "tq-result-correct" : "tq-result-wrong"}">${correct ? "CORRECT" : "INCORRECT"}</span>
      <p class="tq-result-detail">${detail}</p>
      <p class="tq-result-points">+${points.toLocaleString()}</p>
      <p class="tq-result-total">Score so far: ${totalScore.toLocaleString()}</p>
      <p class="tq-timer" id="tqGapTimer">${GAP_SECONDS}</p>
      <p class="tq-next-note">
        ${qIndex + 1 < QUESTION_COUNT ? "until the next question" : "until your results"}
      </p>
      <button type="button" id="tqNextBtn" class="btn btn-secondary">
        ${qIndex + 1 < QUESTION_COUNT ? "Next question now" : "See results now"}
      </button>
    </div>
  `;
  showOnly(resultEl);

  document.getElementById("tqNextBtn").addEventListener("click", advance);

  // Auto-advance after GAP_SECONDS — the fixed "gap between questions" —
  // shown as the same big countdown style as the question timer itself
  // (`.tq-timer`), not a small text note, so it reads as a real
  // countdown rather than an afterthought. A click on Next (above) fires
  // it early rather than forcing a full wait every single time.
  let remaining = GAP_SECONDS;
  const gapTimerEl = document.getElementById("tqGapTimer");
  const gapInterval = setInterval(() => {
    remaining -= 1;
    if (!document.getElementById("tqGapTimer")) { clearInterval(gapInterval); return; } // already advanced
    if (remaining <= 0) {
      clearInterval(gapInterval);
      advance();
    } else {
      gapTimerEl.textContent = String(remaining);
    }
  }, 1000);

  // Both the Next button and the auto-timer call this — clearInterval()
  // makes a second call from the timer harmless in the normal case, but
  // `advanced` guards the (very unlikely, e.g. a throttled background
  // tab catching up on queued timers) case of both firing before either
  // one's effects are visible to the other.
  let advanced = false;
  function advance() {
    if (advanced) return;
    advanced = true;
    clearInterval(gapInterval);
    qIndex += 1;
    if (qIndex < QUESTION_COUNT) {
      showQuestion();
    } else {
      renderFinal();
    }
  }
}

function renderFinal() {
  saveBestScore(totalScore);
  const correctCount = answers.filter((a) => a.correct).length;
  const rows = answers.map((a, i) => `
    <tr class="${a.correct ? "tq-row-correct" : "tq-row-wrong"}">
      <td>${i + 1}</td>
      <td>${a.region}</td>
      <td>${a.condition}</td>
      <td>${a.detail}</td>
      <td>${a.elapsed.toFixed(2)}s</td>
      <td>${a.points}</td>
    </tr>
  `).join("");

  finalEl.innerHTML = `
    <div class="tq-panel">
      <h3>Quiz complete</h3>
      <p class="tq-nickname">${nickname}'s score</p>
      <p class="tq-final-score">${totalScore.toLocaleString()}</p>
      <p class="tq-final-sub">${correctCount} / ${QUESTION_COUNT} correct &middot; best this browser: ${getBestScore().toLocaleString()}</p>
      <div class="tq-final-actions">
        <button type="button" id="tqReplayBtn" class="btn btn-primary">Play Again</button>
        <a href="geoStreakGame.html" class="btn btn-secondary">Back to GeoStreak</a>
      </div>
      <table class="tq-breakdown">
        <thead><tr><th>#</th><th>Region</th><th>Condition</th><th>Your answer</th><th>Time</th><th>Points</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
  showOnly(finalEl);
  document.getElementById("tqReplayBtn").addEventListener("click", startQuiz);
}

renderStart();
