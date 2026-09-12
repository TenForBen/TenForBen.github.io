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
const QUESTION_SECONDS = 20;
const MAX_POINTS = 1000;
// Wait between questions grows as the quiz goes on: 5s after Q1, 7s after
// Q2 (5+2), 10s from Q3 onward (7+3 already hits the cap) — see
// gapSecondsAfterQuestion() below.
const GAP_SECONDS_MAX = 10;
// A stage stays active until a completed quiz on it hits either bar —
// proving a base level of comfort before advancing. Permanent once
// cleared (checked once per finished quiz in renderFinal(), never
// re-locked) — see `playerState.stageIndex` below. Same bar at every
// stage, World through the Hemisphere Challenge.
const UNLOCK_CORRECT_COUNT = 10; // out of QUESTION_COUNT (15)
const UNLOCK_SCORE = 8000;
// Minimum spacing enforced between two SAME-direction thresholds (see
// buildQuestions()'s lastThresholdByDirection) — raised from an earlier
// version's 4, which compared against the immediately-previous question
// overall (any direction) rather than the previous same-direction one.
const MIN_THRESHOLD_GAP = 5;

// ---- Global bounds World's own range stays inside — GeoStreak's own
// normal-mode MIN/MAX_THRESHOLD is 5-32; this mirrors that rather than
// the wider, more extreme spread an earlier version of this table used
// (down to 2°C, up to 41°C), which produced genuinely unfair questions
// at the edges.
const GLOBAL_MIN = 6;
const GLOBAL_MAX = 32;

// ---- Stages: a strict, linear progression — exactly ONE stage is ever
// playable at a time (`playerState.stageIndex`), each with its own flat
// [min, max] temperature range. Unlike an earlier version of this page,
// there's no moderate/tough split within a quiz anymore and no
// multi-region checkbox picker — the stage itself IS the difficulty
// step, and clearing one advances to exactly the next.
//
// The final stage borrows GeoStreak's own tough-round mechanic wholesale
// (`hemisphere: true`) rather than reinventing it — see buildQuestions()
// and resolveAnswer() below for the hemisphere handling, ported from
// app.js's own nextHemisphere/hemisphereCorrect logic.
const STAGES = [
  // No country restriction (countryCodes: null) — any resolved city
  // counts. GLOBAL_MIN/MAX rather than a narrower range, since "no
  // restriction on where" is what already made this the easiest stage.
  { key: "world", label: "World", countryCodes: null, min: GLOBAL_MIN, max: GLOBAL_MAX, hemisphere: false },
  {
    key: "india",
    label: "India",
    countryCodes: ["IN"],
    min: 10,
    max: 30,
    hemisphere: false,
    // India during the day is hot enough almost everywhere that "name a
    // city BELOW 10°C" has no fair answer outside a couple of Himalayan
    // valleys; at night the reverse is true for "ABOVE 30°C". Rather
    // than reworking the whole range, stageRangeForDirection() just nudges
    // the wrong-for-the-time-of-day direction's own edge in by one degree
    // so that single extreme value is never picked — see that function.
    daynight: { timezone: "Asia/Kolkata", dayStartHour: 11, dayEndHour: 18 },
  },
  {
    key: "europe",
    label: "Europe",
    countryCodes: [
      "FR", "DE", "IT", "ES", "PT", "NL", "BE", "LU", "CH", "AT",
      "SE", "NO", "DK", "FI", "IS", "IE", "GB", "PL", "CZ", "SK",
      "HU", "RO", "BG", "GR", "HR", "SI", "RS", "BA", "ME", "MK",
      "AL", "EE", "LV", "LT", "MT", "CY", "LI", "MC", "AD", "SM",
      "VA", "UA", "BY", "MD",
    ],
    min: 7,
    max: 30,
    hemisphere: false,
  },
  {
    key: "na",
    label: "North America",
    // Full continent, not just US/Canada — Mexico, Central America, the
    // Caribbean, and Greenland (on the North American plate/continent
    // geographically, despite being Danish territory — and it already
    // comes up constantly in this app's own insights, e.g. Nuuk).
    // Deliberately excludes Venezuela/Colombia even though their own
    // northern coasts are climatically similar — OpenWeatherMap only
    // returns a country code, not which part of the country a city is
    // in, so there's no clean way to admit "northern VE/CO" without a
    // separate latitude check; simpler to just leave both out entirely.
    countryCodes: [
      "CA", "US", "MX",
      "BZ", "GT", "HN", "SV", "NI", "CR", "PA",
      "CU", "JM", "HT", "DO", "BS", "TT", "BB", "GD", "LC", "VC", "AG", "KN", "DM",
      "GL",
    ],
    min: 5,
    max: 30,
    hemisphere: false,
  },
  {
    key: "sa",
    label: "South America",
    countryCodes: ["AR", "BR", "CL", "CO", "PE", "VE", "EC", "BO", "PY", "UY", "GY", "SR"],
    min: 5,
    max: 30,
    hemisphere: false,
  },
  // The finale: no country restriction (world-wide, same as the World
  // stage) but every question also pins a hemisphere requirement on top
  // of the temperature one — a resolved city has to be in the right
  // half of the globe AND satisfy the threshold. See resolveAnswer().
  { key: "hemisphere", label: "Hemisphere Challenge", countryCodes: null, min: 5, max: 30, hemisphere: true },
];

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

// Ported from GeoStreak's own pickThreshold() in app.js: a random
// integer from [min, max] that hasn't already come out of this exact
// `usedSet` — once every value in the range has been asked, the set
// clears and the cycle starts over. That's what produces real "mixing":
// a wide range plus no-repeat-until-exhausted, not a handful of
// hardcoded numbers to draw from.
//
// `avoidNear`/`minGap` are this page's own addition, not in GeoStreak's
// version: candidates within `minGap` of `avoidNear` are excluded first —
// but only if that still leaves at least one option; a narrow range
// shouldn't be able to lock the picker out entirely. buildQuestions()
// below feeds this the previous SAME-direction threshold, not just
// whatever question came immediately before.
function pickThreshold(usedSet, min, max, rng, avoidNear = null, minGap = MIN_THRESHOLD_GAP) {
  const remaining = [];
  for (let t = min; t <= max; t++) {
    if (!usedSet.has(t)) remaining.push(t);
  }
  if (remaining.length === 0) {
    usedSet.clear();
    for (let t = min; t <= max; t++) remaining.push(t);
  }
  let candidates = remaining;
  if (avoidNear != null) {
    const farEnough = remaining.filter((t) => Math.abs(t - avoidNear) >= minGap);
    if (farEnough.length > 0) candidates = farEnough;
  }
  const threshold = candidates[Math.floor(rng() * candidates.length)];
  usedSet.add(threshold);
  return threshold;
}

// Time-of-day awareness — only India (`daynight` in STAGES) has this
// configured today; a stage without it just returns its own flat
// [min, max] unchanged. During the configured local daytime window, the
// coldest "below" edge is nudged in by one (never asks BELOW stage.min);
// outside it (nighttime), the hottest "above" edge is nudged in by one
// (never asks ABOVE stage.max) — `hourCycle: "h23"` rather than relying
// on `hour12: false` alone, which some engines still render as "24" at
// midnight instead of "0".
function stageRangeForDirection(stage, direction) {
  let [min, max] = [stage.min, stage.max];
  if (!stage.daynight) return [min, max];
  const hour = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: stage.daynight.timezone,
    hourCycle: "h23",
    hour: "numeric",
  }).format(new Date()));
  const isDaytime = hour >= stage.daynight.dayStartHour && hour < stage.daynight.dayEndHour;
  if (isDaytime && direction === "below") min += 1;
  if (!isDaytime && direction === "above") max -= 1;
  return [min, max];
}

// 15 questions, all from the SAME stage — a strict linear progression
// means exactly one stage is ever active, so there's no region cycling
// to do anymore. Direction (above/below) strictly ALTERNATES question to
// question, same as GeoStreak's own nextDirection — not a fresh coin
// flip each time — with the starting side randomised per quiz. On the
// Hemisphere Challenge stage, hemisphere alternates the same way, as its
// own independent sequence (ported from app.js's nextHemisphere), so the
// two together produce all four combinations (N+above, N+below, S+above,
// S+below) across a quiz rather than always pairing the same two.
function buildQuestions(seed, stage) {
  const rng = mulberry32(seed);
  let direction = rng() < 0.5 ? "above" : "below";
  let hemisphere = stage.hemisphere ? (rng() < 0.5 ? "north" : "south") : null;
  const usedThresholds = { above: new Set(), below: new Set() };
  // Fed to pickThreshold() as avoidNear — the previous threshold from
  // the SAME direction (always 2 questions back, since direction
  // strictly alternates), not the immediately-previous question overall.
  // A1 -> B -> A2 only needs A2 kept >= MIN_THRESHOLD_GAP from A1; the B
  // in between doesn't factor in, since it already reads as a different
  // question by virtue of its own direction.
  const lastThresholdByDirection = { above: null, below: null };

  const questions = [];
  for (let i = 0; i < QUESTION_COUNT; i++) {
    const [min, max] = stageRangeForDirection(stage, direction);
    const threshold = pickThreshold(usedThresholds[direction], min, max, rng, lastThresholdByDirection[direction]);
    questions.push({ direction, threshold, hemisphere });
    lastThresholdByDirection[direction] = threshold;
    direction = direction === "above" ? "below" : "above"; // strictly alternate for the next question
    if (stage.hemisphere) hemisphere = hemisphere === "north" ? "south" : "north";
  }
  return questions;
}

function conditionText(q, stage) {
  const dirWord = q.direction === "above" ? "ABOVE" : "BELOW";
  if (q.hemisphere) {
    const hemiWord = q.hemisphere === "north" ? "NORTHERN" : "SOUTHERN";
    return `Name a city in the ${hemiWord} HEMISPHERE ${dirWord} ${q.threshold}°C`;
  }
  return `Name a city in ${stage.label.toUpperCase()} ${dirWord} ${q.threshold}°C`;
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

// The gap timer only needs to read as "a real countdown", not a scoring
// clock — 2 decimals rather than the question timer's 3.
function formatGapTimer(secondsLeft) {
  return Math.max(0, secondsLeft).toFixed(2);
}

// Wait time between questions grows with the quiz: 5s after Q1, then each
// next question's gap is the previous gap plus that question's own
// (1-based) number, capped at GAP_SECONDS_MAX — 5, 7, 10, 10, 10, ... A
// player who's been going a few questions gets a little more breathing
// room before the next one, rather than a flat pause throughout.
function gapSecondsAfterQuestion(questionNumber) {
  let gap = 5;
  for (let n = 2; n <= questionNumber; n++) {
    gap = Math.min(GAP_SECONDS_MAX, gap + n);
  }
  return gap;
}

// Same idea as GeoStreak's own tempClosenessClass() in historyPage.js —
// how close the actual reading landed to the threshold it was judged
// against, independent of correct/incorrect (a near-miss and a
// comfortable pass both worth calling out). Exactly at the threshold is
// gold; within 2 degrees either side is green; anything wider (or no
// reading at all, e.g. a timeout) gets no color.
function tempClosenessClass(temp, threshold) {
  if (temp == null || threshold == null) return "";
  const diff = Math.abs(temp - threshold);
  if (diff === 0) return "tq-temp-gold";
  if (diff <= 2) return "tq-temp-green";
  return "";
}

// Emoji flag from a country code (regional-indicator letters), e.g.
// "NZ" -> 🇳🇿 — same technique ui.js's flagEmoji() uses, duplicated here
// per this page's own no-build-step convention.
function flagEmoji(countryCode) {
  const cc = String(countryCode || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (cc.length !== 2) return "";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

// Same shape as ui.js's updateCountryTally() — "🇧🇷 BR ×2 | 🇦🇷 AR ×1" —
// ported here rather than shared: it writes straight into an element
// there, but this page rebuilds the whole result panel's innerHTML each
// question, so this returns a string to be spliced in instead.
function buildTallyHtml(countryCitiesMap) {
  if (countryCitiesMap.size === 0) return "";
  const chips = [...countryCitiesMap.entries()]
    .map(([code, cities]) => `
      <span class="tq-tally-chip" tabindex="0">
        ${flagEmoji(code)} ${escapeHtml(code)} &times;${cities.length}
        <span class="tq-tally-popover">${cities.map(escapeHtml).join("<br>")}</span>
      </span>
    `)
    .join(" &nbsp;|&nbsp; ");
  return `<p class="tq-tally">${chips}</p>`;
}

// Same nickname as GeoStreak itself — same localStorage key
// timeQuizLeaderboard.js's getNickname() reads/writes (and GeoStreak's own
// leaderboard.js also writes), so whichever page a name was set on just
// shows up on the other with no separate entry flow. `let`, not `const`:
// this page's header shows/edits it too (the static #tqPlayerBar/
// #tqHeaderNicknameWrap in timeQuiz.html, wired once in init() below via
// TimeQuizBoard.wireNicknameInput()), and its onSave callback keeps this
// in sync the moment a name is saved there. Computed once at load and
// reused everywhere it's shown, rather than re-read per render —
// getNickname() falls back to a *fresh* random name on every call when
// none is saved yet, which would otherwise show a different placeholder
// name on the start screen than on the final screen.
let nickname = TimeQuizBoard.getNickname();

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
let countryCities = new Map(); // ISO country code -> city names used from it this quiz, for the tally shown during the gap
let currentStage = STAGES[0]; // set in startQuiz() from the picked radio — read by conditionText()/resolveAnswer()/showQuestion()
let pickedStageIndex = 0; // same moment, read by renderFinal() to gate whether this run can advance playerState.stageIndex

// Best score, lifetime totals, and progress through STAGES — one
// Firestore document (`timeQuizPlayers/{uid}`, see
// timeQuizLeaderboard.js), not a handful of separate localStorage keys.
// Fetched once via init() below and kept in memory from there: mutated
// directly as a quiz plays out (recordAttempt(), renderFinal()) and
// flushed back to Firestore in one write per finished quiz
// (TimeQuizBoard.savePlayerState()), rather than round-tripping to
// Firestore on every read. If Firebase is unreachable this stays at its
// all-zero default for the whole session — no local fallback anymore,
// by design (see the README's Leaderboard section for the tradeoff).
let playerState = { bestScore: 0, totalCorrect: 0, totalAttempts: 0, totalRuns: 0, stageIndex: 0 };

// "Attempts" means questions faced, not just correct guesses — every
// question increments it exactly once, whether answered right, wrong, or
// timed out. In-memory only; the actual Firestore write happens once, at
// the end of the quiz (renderFinal() -> TimeQuizBoard.savePlayerState()).
function recordAttempt(correct) {
  playerState.totalAttempts += 1;
  if (correct) playerState.totalCorrect += 1;
}

const startEl = document.getElementById("tqStart");
const questionEl = document.getElementById("tqQuestion");
const resultEl = document.getElementById("tqResult");
const finalEl = document.getElementById("tqFinal");

function showOnly(el) {
  [startEl, questionEl, resultEl, finalEl].forEach((e) => {
    e.style.display = e === el ? "block" : "none";
  });
}

// Clamped in every place playerState.stageIndex is read, not just here —
// a value that predates STAGES growing/shrinking (or a stray out-of-range
// write) should degrade to "the last real stage" rather than an
// undefined array access.
function clampStageIndex(index) {
  return Math.max(0, Math.min(STAGES.length - 1, index));
}

function renderStart() {
  const best = playerState.bestScore;
  const stageIndex = clampStageIndex(playerState.stageIndex);
  const stage = STAGES[stageIndex];
  const isFinalStage = stageIndex === STAGES.length - 1;

  // One line per stage. Anything already unlocked (index <= stageIndex)
  // is a real radio choice — clearing a new stage doesn't retire the
  // ones before it, so a player can go back and replay an earlier one
  // any time. Anything beyond stageIndex stays a plain locked row, not a
  // choice. Defaults to the frontier stage (the highest unlocked one),
  // same as the only option that existed before this picker did.
  const roadmapHtml = `
    <ol class="tq-stage-roadmap">
      ${STAGES.map((s, i) => {
        if (i > stageIndex) {
          return `
            <li class="tq-stage-locked">
              <span class="tq-stage-icon">&#128274;</span> ${s.label}
            </li>
          `;
        }
        const cleared = i < stageIndex;
        return `
          <li class="tq-stage-selectable ${cleared ? "tq-stage-cleared" : "tq-stage-current"}">
            <label class="tq-stage-radio-label">
              <input type="radio" name="tqStagePick" class="tq-stage-radio" value="${i}" ${i === stageIndex ? "checked" : ""} />
              <span class="tq-stage-icon">${cleared ? "&#10003;" : "&#9654;"}</span> ${s.label}
            </label>
          </li>
        `;
      }).join("")}
    </ol>
  `;
  const stagePanelHtml = `
    <div class="tq-region-picker">
      <p class="tq-region-picker-label">${stageIndex > 0 ? "Pick a stage to play" : "Stage"} (${stageIndex + 1} / ${STAGES.length} unlocked)</p>
      ${roadmapHtml}
      <p class="tq-region-locked-note">
        ${isFinalStage
          ? "Final stage — every question also pins a hemisphere, on top of the temperature condition."
          : `Get ${UNLOCK_CORRECT_COUNT}/${QUESTION_COUNT} correct or score ${UNLOCK_SCORE.toLocaleString()}+ on ${stage.label} to advance to ${STAGES[stageIndex + 1].label}. Replaying an earlier stage never advances you further.`}
      </p>
    </div>
  `;
  startEl.innerHTML = `
    <div class="tq-panel">
      <h3>Time Quiz</h3>
      <p class="tq-panel-sub">
        ${QUESTION_COUNT} questions, ${QUESTION_SECONDS}s each. Name a city
        matching the current stage and temperature condition — the faster
        you answer, the more it's worth.
      </p>
      ${stagePanelHtml}
      <button type="button" id="tqStartBtn" class="btn btn-primary">Start Quiz</button>
      <ul class="tq-howto">
        <li>Each correct answer is worth up to ${MAX_POINTS} points, sliding down to 0 as the clock runs out.</li>
        <li>A wrong city, or one outside the current stage, scores 0 for that question.</li>
        <li>No streak, no elimination — all ${QUESTION_COUNT} questions play out regardless of how you're doing.</li>
        <li>Stages unlock one at a time — you're always playing exactly one, never a mix.</li>
        <li>The wait between questions grows as you go: 5s, 7s, then 10s from question 3 onward.</li>
      </ul>
      ${best > 0 ? `<p class="tq-best">Best score, this browser: ${best.toLocaleString()}</p>` : ""}
    </div>

    <div id="tqLeaderboardPanel" style="margin-top: 18px;"></div>

    <div class="tq-panel" style="margin-top: 18px;">
      <h3>Your Best 10</h3>
      <div id="tqBestRunsBody"><p class="tq-leaderboard-note">Loading&hellip;</p></div>
    </div>
  `;
  document.getElementById("tqStartBtn").addEventListener("click", startQuiz);
  TimeQuizBoard.renderLeaderboardPanel("tqLeaderboardPanel");
  TimeQuizBoard.renderMyBestRuns("tqBestRunsBody");
  showOnly(startEl);
}

function startQuiz() {
  // Reads whichever radio the player picked on the start screen (see
  // renderStart()'s roadmap) — defaults to the frontier stage if
  // something went wrong and nothing's checked. `pickedStageIndex` is
  // remembered separately from `currentStage` so renderFinal() can tell
  // "played the frontier stage" (eligible to advance) apart from
  // "replayed an earlier one" (never advances further), even though a
  // full page reload before finishing would lose that distinction —
  // same tradeoff every other in-progress, unsaved game state here has.
  const checkedRadio = document.querySelector('input[name="tqStagePick"]:checked');
  pickedStageIndex = checkedRadio ? Number(checkedRadio.value) : clampStageIndex(playerState.stageIndex);
  currentStage = STAGES[pickedStageIndex];
  questions = buildQuestions(Date.now() ^ Math.floor(Math.random() * 0xffffffff), currentStage);
  qIndex = 0;
  totalScore = 0;
  answers = [];
  usedCities = new Set();
  countryCities = new Map();
  showQuestion();
}

function showQuestion() {
  submitted = false;
  const q = questions[qIndex];
  questionEl.innerHTML = `
    <p class="tq-progress">Question ${qIndex + 1} / ${QUESTION_COUNT}</p>
    <p class="tq-score-live">Score so far: ${totalScore.toLocaleString()}</p>
    <div class="tq-timer-row">
      <p class="tq-timer" id="tqTimer">${formatTimer(QUESTION_SECONDS)}</p>
      <button type="button" id="tqQuitBtn" class="tq-quit-btn">&#9209; Quit</button>
    </div>
    <p class="tq-points-preview" id="tqPointsPreview">${MAX_POINTS.toLocaleString()} pts if correct now</p>
    <div class="tq-timer-bar-wrap"><div class="tq-timer-bar" id="tqTimerBar" style="width: 100%;"></div></div>
    <div class="tq-condition">
      <span class="tq-region-badge">${currentStage.label}</span>
      <p class="tq-condition-text">${conditionText(q, currentStage)}</p>
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
  document.getElementById("tqQuitBtn").addEventListener("click", quitQuiz);

  questionStartTime = performance.now();
  startTimer();
}

// Ends the quiz right here, mid-question — whatever's been scored on
// already-answered questions (`answers`, `totalScore`) stands as final;
// the question in progress when Quit was clicked is simply dropped, not
// scored as wrong or timed-out. A native confirm() rather than a custom
// dialog, since this is the only destructive/irreversible action in this
// page and doesn't warrant its own UI.
function quitQuiz() {
  if (!confirm("Quit now? Your current score will be locked in as your final score.")) return;
  clearInterval(timerInterval);
  submitted = true; // guards against a stray timer tick firing resolveAnswer() after this
  renderFinal();
}

function startTimer() {
  const timerEl = document.getElementById("tqTimer");
  const barEl = document.getElementById("tqTimerBar");
  const pointsEl = document.getElementById("tqPointsPreview");
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = (performance.now() - questionStartTime) / 1000;
    const left = QUESTION_SECONDS - elapsed;
    if (!timerEl || !barEl) return; // question already moved on
    timerEl.textContent = formatTimer(left);
    barEl.style.width = `${Math.max(0, (left / QUESTION_SECONDS) * 100)}%`;
    timerEl.classList.toggle("tq-timer-warn", left <= 10 && left > 5);
    timerEl.classList.toggle("tq-timer-danger", left <= 5);
    // Same computePoints() the real submit uses (correct=true, so this
    // is "what you'd score if you were right this instant") — never a
    // separate formula to keep in sync by hand.
    if (pointsEl) {
      const pointsNow = computePoints(true, elapsed);
      pointsEl.textContent = `${pointsNow.toLocaleString()} pts if correct now`;
      pointsEl.classList.toggle("tq-timer-warn", left <= 10 && left > 5);
      pointsEl.classList.toggle("tq-timer-danger", left <= 5);
    }
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

  // Not found (a typo, most likely) is a lookup failure, not a wrong
  // answer — same as GeoStreak's own submitGuess(), which just hints
  // and lets the player try again rather than ending the round. The
  // question is only actually over once the 20s clock itself runs out
  // (startTimer()'s own resolveAnswer(null) call, not this one).
  if (!data) {
    submitted = false;
    document.getElementById("tqSubmitBtn").disabled = false;
    hintEl.textContent = `Nothing found for "${typed}". Try another city — the clock's still running.`;
    input.focus();
    return;
  }

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
  if (!countryCities.has(data.sys.country)) countryCities.set(data.sys.country, []);
  countryCities.get(data.sys.country).push(data.name);
  TimeQuizBoard.recordCityUsage(data.name, data.sys.country); // fire-and-forget global tally, correct or not

  resolveAnswer(data, elapsedAtSubmit);
}

// `data` is the OpenWeatherMap response, or null — which, now that
// submitAnswer() handles a not-found lookup itself (hint + retry, never
// reaching here), only ever means the 20s clock ran out with nothing
// resolved. `elapsedSeconds` is omitted by that one remaining caller
// (startTimer()'s timeout branch), so it defaults to the full 20s.
// Double-resolution is already prevented upstream — submitAnswer() sets
// `submitted` synchronously before its network await, and startTimer()'s
// timeout branch only calls this when `!submitted` — so nothing further
// to guard here.
function resolveAnswer(data, elapsedSeconds) {
  submitted = true;
  clearInterval(timerInterval);
  const elapsed = elapsedSeconds != null ? elapsedSeconds : QUESTION_SECONDS;
  const q = questions[qIndex];
  const stage = currentStage;

  let correct = false;
  let detail;
  let temp = null;
  if (!data) {
    detail = "Time's up — no answer";
  } else {
    const inRegion = stage.countryCodes === null || stage.countryCodes.includes(data.sys.country);
    temp = Math.round(data.main.temp);
    const tempOk = q.direction === "above" ? temp >= q.threshold : temp <= q.threshold;
    // Hemisphere Challenge questions (q.hemisphere set) need the temperature
    // AND the hemisphere condition both satisfied — ported straight from
    // GeoStreak's own tough-round check in app.js. Equator (lat 0) counts
    // as northern, same >= 0 convention ui.js already uses elsewhere.
    let hemisphereOk = true;
    if (q.hemisphere) {
      const northern = data.coord.lat >= 0;
      hemisphereOk = q.hemisphere === "north" ? northern : !northern;
    }
    correct = inRegion && tempOk && hemisphereOk;
    detail = `${data.name}, ${data.sys.country} — ${temp}°C`;
    if (!inRegion) detail += ` (not in ${stage.label})`;
    else if (!hemisphereOk) detail += ` (wrong hemisphere)`;
  }

  const points = computePoints(correct, elapsed);
  totalScore += points;
  answers.push({
    region: stage.label,
    condition: `${q.hemisphere ? (q.hemisphere === "north" ? "Northern, " : "Southern, ") : ""}${q.direction === "above" ? "Above" : "Below"} ${q.threshold}°C`,
    detail,
    correct,
    elapsed,
    points,
    temp,
    threshold: q.threshold,
  });
  recordAttempt(correct); // lifetime counters, every question — answered, wrong, or timed out
  // Fire-and-forget, same as recordCityUsage() above — feeds the
  // dedicated Insights page's global "Top 10 Fastest Responses" ranking.
  // Only a scored (correct) answer is worth ranking there.
  if (correct) TimeQuizBoard.recordFastestAnswer(points, elapsed, data.name, data.sys.country);

  renderQuestionResult(correct, detail, points, data);
}

// Signed decimal degrees -> "19.07° N" / "72.88° E", same N/S-E/W
// convention southernHemisphere/app.js's formatCoord() uses.
function formatCoord(value, isLatitude) {
  const direction = isLatitude ? (value >= 0 ? "N" : "S") : (value >= 0 ? "E" : "W");
  return `${Math.abs(value).toFixed(2)}&deg; ${direction}`;
}

// A snapshot of that city's local clock right now — not ticking, this
// panel is only on screen for a few seconds. `timezone` is OpenWeatherMap's
// offset in seconds from UTC.
function formatLocalTimeAt(timezoneOffsetSeconds) {
  const d = new Date(Date.now() + timezoneOffsetSeconds * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

function formatDayLength(sunrise, sunset) {
  const totalSeconds = Math.max(0, sunset - sunrise);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// Extra context beyond city/temp for the result panel — coordinates
// (linked out to Google Maps, same ?api=1&query=lat,lon pattern used
// throughout this site), local time and day length (both computable
// straight from the weather response already in hand), and elevation,
// which isn't part of that response — see loadElevation() below, which
// fills it in asynchronously once (if) it arrives.
function buildResultDetailRows(data) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${data.coord.lat},${data.coord.lon}`;
  const coordsText = `${formatCoord(data.coord.lat, true)}, ${formatCoord(data.coord.lon, false)}`;
  const rows = [
    ["Coordinates", `<a href="${mapsUrl}" target="_blank" rel="noopener">${coordsText}</a>`],
    ["Elevation", `<span id="tqElevation">&hellip;</span>`],
    ["Local time", formatLocalTimeAt(data.timezone)],
    ["Day length", formatDayLength(data.sys.sunrise, data.sys.sunset)],
  ];
  return `
    <div class="tq-result-details">
      ${rows.map(([label, value]) => `
        <div class="tq-result-detail-row">
          <span class="tq-result-detail-label">${label}</span>
          <span class="tq-result-detail-value">${value}</span>
        </div>
      `).join("")}
    </div>
  `;
}

// Best-effort, same as everywhere else this API is used (see
// fetch.js#getElevation) — never blocks the result panel from showing,
// and the `tqElevation` existence check covers the case where the
// player's already moved on to the next question before this resolves.
async function loadElevation(lat, lon) {
  const meters = await ft.getElevation(lat, lon);
  const el = document.getElementById("tqElevation");
  if (!el) return;
  el.textContent = meters != null ? `${meters.toLocaleString()} m` : "&mdash;";
}

// Shared by the gap screen's running recap and the final results table —
// same columns either way, just a different (and growing, question to
// question) slice of `answers`. Temp is colored via tempClosenessClass(),
// independent of correct/incorrect, same as GeoStreak's own history table.
function buildBreakdownRows(list) {
  // Newest question on top — the row a player just answered (or is
  // reviewing right after finishing) is the one most worth seeing without
  // scrolling. `num` is captured before reversing so it still reads as
  // the real question number (1-15), not the reversed display position.
  return list
    .map((a, i) => ({ a, num: i + 1 }))
    .reverse()
    .map(({ a, num }) => `
      <tr class="${a.correct ? "tq-row-correct" : "tq-row-wrong"}">
        <td>${num}</td>
        <td>${a.region}</td>
        <td>${a.condition}</td>
        <td>${a.detail}</td>
        <td>${a.temp != null ? `<span class="${tempClosenessClass(a.temp, a.threshold)}">${a.temp}&deg;C</span>` : "&mdash;"}</td>
        <td>${a.elapsed.toFixed(2)}s</td>
        <td>${a.points}</td>
      </tr>
    `).join("");
}

const BREAKDOWN_HEADER_ROW = `<tr><th>#</th><th>Region</th><th>Condition</th><th>Your answer</th><th>Temp</th><th>Time</th><th>Points</th></tr>`;

function renderQuestionResult(correct, detail, points, data) {
  // Wait time itself grows with the quiz — see gapSecondsAfterQuestion().
  const gapSeconds = gapSecondsAfterQuestion(qIndex + 1);

  resultEl.innerHTML = `
    <div class="tq-result-panel">
      <p class="tq-progress">Question ${qIndex + 1} / ${QUESTION_COUNT}</p>
      <span class="tq-result-badge ${correct ? "tq-result-correct" : "tq-result-wrong"}">${correct ? "CORRECT" : "INCORRECT"}</span>
      <p class="tq-result-detail">${detail}</p>
      ${data ? buildResultDetailRows(data) : ""}
      <p class="tq-result-points">+${points.toLocaleString()}</p>
      <p class="tq-result-total">Score so far: ${totalScore.toLocaleString()}</p>
      ${buildTallyHtml(countryCities)}
      <p class="tq-timer" id="tqGapTimer">${formatGapTimer(gapSeconds)}</p>
      <p class="tq-next-note">
        ${qIndex + 1 < QUESTION_COUNT ? "until the next question" : "until your results"}
      </p>
      <button type="button" id="tqNextBtn" class="btn btn-secondary">
        ${qIndex + 1 < QUESTION_COUNT ? "Next question now" : "See results now"}
      </button>
      <h4 class="tq-recap-title">Questions so far</h4>
      <table class="tq-breakdown tq-recap-table">
        <thead>${BREAKDOWN_HEADER_ROW}</thead>
        <tbody>${buildBreakdownRows(answers)}</tbody>
      </table>
    </div>
  `;
  showOnly(resultEl);
  if (data) loadElevation(data.coord.lat, data.coord.lon);

  document.getElementById("tqNextBtn").addEventListener("click", advance);

  // Auto-advance after `gapSeconds` — shown as a live, 2-decimal countdown
  // (performance.now()-based, same technique startTimer() uses for the
  // question clock, not a 1-second setInterval ticking whole numbers) so
  // it reads as a real countdown rather than an afterthought. A click on
  // Next (above) fires it early rather than forcing a full wait every
  // single time.
  const gapStart = performance.now();
  const gapTimerEl = document.getElementById("tqGapTimer");
  const gapInterval = setInterval(() => {
    const left = gapSeconds - (performance.now() - gapStart) / 1000;
    if (!document.getElementById("tqGapTimer")) { clearInterval(gapInterval); return; } // already advanced
    if (left <= 0) {
      clearInterval(gapInterval);
      advance();
    } else {
      gapTimerEl.textContent = formatGapTimer(left);
    }
  }, 31);

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
  const correctCount = answers.filter((a) => a.correct).length;
  const questionsPlayed = answers.length; // < QUESTION_COUNT when quitQuiz() ended it early
  const quitEarly = questionsPlayed < QUESTION_COUNT;

  // All of this quiz's contribution to lifetime state, folded into the
  // one in-memory object and flushed to Firestore in a single write below
  // — no per-field localStorage calls anymore.
  const wasStageIndex = clampStageIndex(playerState.stageIndex);
  if (totalScore > playerState.bestScore) playerState.bestScore = totalScore;
  playerState.totalRuns += 1;
  const clearedStage = correctCount >= UNLOCK_CORRECT_COUNT || totalScore >= UNLOCK_SCORE;
  // Only clearing the bar on the FRONTIER stage (the highest one already
  // unlocked) can push it further — replaying an earlier, already-
  // unlocked stage never advances progress, no matter the score. Without
  // this check, grinding an easy early stage could unlock far harder
  // ones without ever attempting them.
  const wasPlayingFrontier = pickedStageIndex === wasStageIndex;
  if (clearedStage && wasPlayingFrontier && wasStageIndex < STAGES.length - 1) {
    playerState.stageIndex = wasStageIndex + 1;
  }
  const newStageIndex = clampStageIndex(playerState.stageIndex);
  const justAdvanced = newStageIndex > wasStageIndex;
  const nextStage = STAGES[newStageIndex];

  // Fire-and-forget, same as GeoStreak's own Game Over write — never
  // blocks or delays showing the results screen below. `questionsPlayed`,
  // not QUESTION_COUNT, so a quit-early run's stored questionCount matches
  // `rounds.length` (firestore.rules requires exactly that).
  const stats = { totalCorrect: playerState.totalCorrect, totalAttempts: playerState.totalAttempts, totalRuns: playerState.totalRuns };
  TimeQuizBoard.submitScore(totalScore, stats);
  TimeQuizBoard.submitDailyScore(totalScore, stats);
  TimeQuizBoard.submitRunHistory(totalScore, correctCount, questionsPlayed, [currentStage.label], answers);
  TimeQuizBoard.savePlayerState(playerState);

  finalEl.innerHTML = `
    <div class="tq-panel">
      <h3>Quiz complete${quitEarly ? " (quit early)" : ""}</h3>
      <p class="tq-nickname">${nickname}'s score</p>
      <p class="tq-final-score">${totalScore.toLocaleString()}</p>
      <p class="tq-final-sub">${correctCount} / ${questionsPlayed} correct${quitEarly ? ` &middot; quit after ${questionsPlayed} of ${QUESTION_COUNT}` : ""} &middot; best score, this browser: ${playerState.bestScore.toLocaleString()}</p>
      ${justAdvanced ? `<p class="tq-unlock-note">&#127881; ${nextStage.label} unlocked — your next quiz starts there.</p>` : ""}
      <div class="tq-final-actions">
        <button type="button" id="tqReplayBtn" class="btn btn-primary">Play Again</button>
        <a href="geoStreakGame.html" class="btn btn-secondary">Back to GeoStreak</a>
      </div>
      <table class="tq-breakdown">
        <thead>${BREAKDOWN_HEADER_ROW}</thead>
        <tbody>${buildBreakdownRows(answers)}</tbody>
      </table>
    </div>

    <div id="tqLeaderboardPanel" style="margin-top: 18px;"></div>

    <div class="tq-panel" style="margin-top: 18px;">
      <h3>Your Best 10</h3>
      <div id="tqBestRunsBody"><p class="tq-leaderboard-note">Loading&hellip;</p></div>
    </div>
  `;
  showOnly(finalEl);
  // Back to the start screen, not straight into another quiz — the start
  // screen is what actually decides which stage is active
  // (renderStart() reads playerState.stageIndex), so this is what makes
  // an advance earned just now actually reachable on the very next
  // attempt, exactly as described on this screen's own unlock note above.
  // (Previously wired straight to startQuiz() with a region checkbox
  // picker that only existed on the start screen's own DOM — a
  // now-removed bug from when regions were still player-picked.)
  document.getElementById("tqReplayBtn").addEventListener("click", renderStart);
  TimeQuizBoard.renderLeaderboardPanel("tqLeaderboardPanel");
  TimeQuizBoard.renderMyBestRuns("tqBestRunsBody");
}

// playerState has to be fetched from Firestore before the very first
// renderStart() — unlike before, there's no synchronous localStorage read
// to fall back on for that initial paint. loadPlayerState() itself never
// throws (not configured / offline / brand-new player all resolve to the
// same all-zero default), so this always reaches renderStart().
//
// wireNicknameInput() is called here, once — not inside renderStart() —
// since #tqPlayerBar/#tqHeaderNicknameWrap are now static markup in
// timeQuiz.html (not rebuilt on every renderStart() call), same as
// GeoStreak's own #gsPlayerBar/#gsHeaderNicknameWrap.
async function init() {
  TimeQuizBoard.wireNicknameInput((newName) => { nickname = newName; });
  playerState = await TimeQuizBoard.loadPlayerState();
  renderStart();
}
init();
