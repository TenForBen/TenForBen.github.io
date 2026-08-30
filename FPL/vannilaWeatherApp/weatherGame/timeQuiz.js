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
// Region selection stays locked to World-only until a completed quiz
// hits either bar — proving a base level of comfort with the game
// before customizing it further. Permanent once unlocked (checked once
// per finished quiz in renderFinal(), never re-locked) — see
// `playerState.regionsUnlocked` below.
const UNLOCK_CORRECT_COUNT = 10; // out of QUESTION_COUNT (15)
const UNLOCK_SCORE = 8000;

// ---- Global bounds every region's ranges stay inside — GeoStreak's own
// normal-mode MIN/MAX_THRESHOLD is 5-32; this mirrors that rather than
// the wider, more extreme spread an earlier version of this table used
// (down to 2°C, up to 41°C), which produced genuinely unfair questions
// at the edges.
const GLOBAL_MIN = 6;
const GLOBAL_MAX = 32;

// ---- Regions: which countries qualify, and which temperature RANGES are
// fair game right now (August/September — northern-hemisphere late
// summer, southern-hemisphere late winter), all nested inside
// [GLOBAL_MIN, GLOBAL_MAX]. Deliberately season-aware rather than just
// "anything above/below X": an unreachable condition (e.g. "Australia
// above 28°C" in their winter) isn't a hard question, it's an unfair one.
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
  // No country restriction at all (countryCodes: null) — any resolved
  // city counts. The default when nothing's checked on the start screen;
  // see DEFAULT_REGION_KEYS below.
  world: {
    label: "World",
    countryCodes: null,
    moderate: { above: [16, 26], below: [12, 22] },
    tough: { above: [27, 32], below: [6, 11] },
  },
  india: {
    label: "India",
    countryCodes: ["IN"],
    // August in India is hot almost everywhere except Himalayan hill
    // stations — so the moderate range stays on the "still hot" side,
    // and the tough "below" range only has an answer at real altitude
    // (Leh, Manali, Darjeeling). That's the example this whole region
    // table is built around.
    moderate: { above: [24, 30], below: [14, 20] },
    tough: { above: [27, 32], below: [6, 11] },
  },
  us: {
    label: "United States",
    countryCodes: ["US"],
    moderate: { above: [18, 24], below: [16, 22] },
    tough: { above: [26, 32], below: [6, 11] }, // above: Southwest desert; below: Alaska, high Rockies
  },
  canada: {
    label: "Canada",
    countryCodes: ["CA"],
    // August is full summer in populated southern Canada but the
    // northern territories stay cool even now — the tough "below" range
    // leans on Yukon/NWT/Nunavut the same way India's leans on
    // Himalayan altitude.
    moderate: { above: [16, 22], below: [18, 24] },
    tough: { above: [24, 30], below: [6, 10] },
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
    moderate: { above: [18, 24], below: [17, 23] },
    tough: { above: [26, 32], below: [6, 11] }, // above: southern-Europe heatwave; below: Scandinavia/Iceland
  },
  southAmerica: {
    label: "South America",
    countryCodes: ["AR", "BR", "CL", "CO", "PE", "VE", "EC", "BO", "PY", "UY", "GY", "SR"],
    // Southern-hemisphere winter in the southern cone (Argentina, Chile,
    // Uruguay) at the same time the equatorial north (Colombia,
    // Venezuela, Ecuador, northern Brazil) stays warm year-round —
    // unlike Australia/NZ, this continent genuinely spans both right
    // now, so both directions are fair game at the moderate tier too.
    moderate: { above: [21, 27], below: [13, 19] },
    tough: { above: [28, 32], below: [6, 10] },
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
    moderate: { above: [22, 28], below: [15, 21] },
    tough: { above: [28, 32], below: [6, 10] },
  },
};

const REGION_KEYS = Object.keys(REGIONS);
// If the player starts a quiz with no region checked, this is what runs
// instead of refusing to start.
const DEFAULT_REGION_KEYS = ["world"];

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

// Ported from GeoStreak's own pickThreshold() in app.js: a random
// integer from [min, max] that hasn't already come out of this exact
// `usedSet` — once every value in the range has been asked, the set
// clears and the cycle starts over. That's what produces real "mixing":
// a wide range plus no-repeat-until-exhausted, not a handful of
// hardcoded numbers to draw from.
//
// `avoidNear`/`minGap` are this page's own addition, not in GeoStreak's
// version: since direction strictly alternates every question, the
// naive version could follow e.g. "ABOVE 6°C" with "BELOW 6°C" right
// after — technically two different questions, but they read as a
// jarring flip on the same number rather than genuine variety. When a
// previous threshold is passed, candidates within `minGap` of it are
// excluded first — but only if that still leaves at least one option;
// a narrow range shouldn't be able to lock the picker out entirely.
function pickThreshold(usedSet, min, max, rng, avoidNear = null, minGap = 4) {
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
  let prevThreshold = null; // fed to pickThreshold() as avoidNear, so back-to-back questions don't land on/near the same number

  return regionCycle.map((regionKey, i) => {
    const tier = i < MODERATE_COUNT ? "moderate" : "tough";
    const [min, max] = REGIONS[regionKey][tier][direction];
    const poolKey = `${regionKey}|${tier}|${direction}`;
    if (!usedThresholds[poolKey]) usedThresholds[poolKey] = new Set();
    const threshold = pickThreshold(usedThresholds[poolKey], min, max, rng, prevThreshold);
    const question = { regionKey, tier, direction, threshold };
    prevThreshold = threshold;
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

// The gap timer only needs to read as "a real countdown", not a scoring
// clock — 2 decimals rather than the question timer's 3.
function formatGapTimer(secondsLeft) {
  return Math.max(0, secondsLeft).toFixed(2);
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
// unlike before, this page now also has its own "Playing as" row (see
// renderStart()), and TimeQuizBoard.wireNicknameRow()'s onSave callback
// keeps this in sync the moment a name is saved here. Computed once at
// load and reused everywhere it's shown, rather than re-read per render —
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
let lastActiveRegionLabels = []; // set in startQuiz(), read by renderFinal()'s submitRunHistory() call
let lastCheckedRegionKeys = []; // set in startQuiz() — the raw checkbox values (before defaulting to World), persisted as playerState.lastRegions

// Best score, lifetime totals, the permanent region-unlock flag, and the
// last-picked regions — one Firestore document (`timeQuizPlayers/{uid}`,
// see timeQuizLeaderboard.js), not five separate localStorage keys.
// Fetched once via init() below and kept in memory from there: mutated
// directly as a quiz plays out (recordAttempt(), renderFinal()) and
// flushed back to Firestore in one write per finished quiz
// (TimeQuizBoard.savePlayerState()), rather than round-tripping to
// Firestore on every read. If Firebase is unreachable this stays at its
// all-zero default for the whole session — no local fallback anymore,
// by design (see the README's Leaderboard section for the tradeoff).
let playerState = { bestScore: 0, totalCorrect: 0, totalAttempts: 0, totalRuns: 0, regionsUnlocked: false, lastRegions: [] };

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

function renderStart() {
  const best = playerState.bestScore;
  const lastRegions = playerState.lastRegions.filter((k) => REGION_KEYS.includes(k));
  const unlocked = playerState.regionsUnlocked;
  const regionPickerHtml = unlocked
    ? `
      <div class="tq-region-picker">
        <p class="tq-region-picker-label">Regions (pick any — none picked plays World)</p>
        <div class="tq-region-checks">
          ${REGION_KEYS.map((key) => `
            <label class="tq-region-check-label">
              <input type="checkbox" class="tq-region-check" value="${key}" ${lastRegions.includes(key) ? "checked" : ""} />
              ${REGIONS[key].label}
            </label>
          `).join("")}
        </div>
      </div>
    `
    : `
      <div class="tq-region-picker tq-region-picker-locked">
        <p class="tq-region-picker-label">Regions: World (locked)</p>
        <p class="tq-region-locked-note">
          Get ${UNLOCK_CORRECT_COUNT}/${QUESTION_COUNT} correct or score ${UNLOCK_SCORE.toLocaleString()}+
          in a single quiz to unlock picking a region next time.
        </p>
      </div>
    `;
  startEl.innerHTML = `
    <div class="tq-panel">
      <h3>Time Quiz</h3>
      ${TimeQuizBoard.nicknameRowHtml()}
      <p class="tq-panel-sub">
        ${QUESTION_COUNT} questions, ${QUESTION_SECONDS}s each. Name a city
        matching the region and temperature condition — the faster you
        answer, the more it's worth.
      </p>
      ${regionPickerHtml}
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

    <div class="tq-panel" style="margin-top: 18px;">
      <h3>Insights</h3>
      <p class="tq-panel-sub" style="margin-bottom: 10px;">Most used across every player, worldwide.</p>
      <div class="tq-insights-row" id="tqInsightsBody"><p class="tq-leaderboard-note">Loading&hellip;</p></div>
    </div>

    <div id="tqLeaderboardPanel" style="margin-top: 18px;"></div>

    <div class="tq-panel" style="margin-top: 18px;">
      <h3>Your Best 10</h3>
      <div id="tqBestRunsBody"><p class="tq-leaderboard-note">Loading&hellip;</p></div>
    </div>
  `;
  document.getElementById("tqStartBtn").addEventListener("click", startQuiz);
  TimeQuizBoard.wireNicknameRow((newName) => { nickname = newName; });
  TimeQuizBoard.renderInsights("tqInsightsBody");
  TimeQuizBoard.renderLeaderboardPanel("tqLeaderboardPanel");
  TimeQuizBoard.renderMyBestRuns("tqBestRunsBody");
  showOnly(startEl);
}

function startQuiz() {
  // No checkboxes exist in the DOM at all while locked (see renderStart()),
  // so `checked` naturally comes back empty then — this just makes the
  // World-only behavior explicit rather than incidental.
  const checked = playerState.regionsUnlocked
    ? Array.from(document.querySelectorAll(".tq-region-check:checked")).map((el) => el.value)
    : [];
  const activeRegions = checked.length > 0 ? checked : DEFAULT_REGION_KEYS;
  lastCheckedRegionKeys = checked; // remembers the actual checkboxes, not the World fallback — persisted in renderFinal()
  lastActiveRegionLabels = activeRegions.map((key) => REGIONS[key].label);
  questions = buildQuestions(Date.now() ^ Math.floor(Math.random() * 0xffffffff), activeRegions);
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
  const region = REGIONS[q.regionKey];

  let correct = false;
  let detail;
  if (!data) {
    detail = "Time's up — no answer";
  } else {
    const inRegion = region.countryCodes === null || region.countryCodes.includes(data.sys.country);
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
  recordAttempt(correct); // lifetime counters, every question — answered, wrong, or timed out

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

function renderQuestionResult(correct, detail, points, data) {
  resultEl.innerHTML = `
    <div class="tq-result-panel">
      <p class="tq-progress">Question ${qIndex + 1} / ${QUESTION_COUNT}</p>
      <span class="tq-result-badge ${correct ? "tq-result-correct" : "tq-result-wrong"}">${correct ? "CORRECT" : "INCORRECT"}</span>
      <p class="tq-result-detail">${detail}</p>
      ${data ? buildResultDetailRows(data) : ""}
      <p class="tq-result-points">+${points.toLocaleString()}</p>
      <p class="tq-result-total">Score so far: ${totalScore.toLocaleString()}</p>
      ${buildTallyHtml(countryCities)}
      <p class="tq-timer" id="tqGapTimer">${formatGapTimer(GAP_SECONDS)}</p>
      <p class="tq-next-note">
        ${qIndex + 1 < QUESTION_COUNT ? "until the next question" : "until your results"}
      </p>
      <button type="button" id="tqNextBtn" class="btn btn-secondary">
        ${qIndex + 1 < QUESTION_COUNT ? "Next question now" : "See results now"}
      </button>
    </div>
  `;
  showOnly(resultEl);
  if (data) loadElevation(data.coord.lat, data.coord.lon);

  document.getElementById("tqNextBtn").addEventListener("click", advance);

  // Auto-advance after GAP_SECONDS — shown as a live, 2-decimal countdown
  // (performance.now()-based, same technique startTimer() uses for the
  // question clock, not a 1-second setInterval ticking whole numbers) so
  // it reads as a real countdown rather than an afterthought. A click on
  // Next (above) fires it early rather than forcing a full wait every
  // single time.
  const gapStart = performance.now();
  const gapTimerEl = document.getElementById("tqGapTimer");
  const gapInterval = setInterval(() => {
    const left = GAP_SECONDS - (performance.now() - gapStart) / 1000;
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
  const wasUnlocked = playerState.regionsUnlocked;
  if (totalScore > playerState.bestScore) playerState.bestScore = totalScore;
  playerState.totalRuns += 1;
  if (correctCount >= UNLOCK_CORRECT_COUNT || totalScore >= UNLOCK_SCORE) {
    playerState.regionsUnlocked = true;
  }
  playerState.lastRegions = lastCheckedRegionKeys;
  const justUnlocked = !wasUnlocked && playerState.regionsUnlocked;

  // Fire-and-forget, same as GeoStreak's own Game Over write — never
  // blocks or delays showing the results screen below. `questionsPlayed`,
  // not QUESTION_COUNT, so a quit-early run's stored questionCount matches
  // `rounds.length` (firestore.rules requires exactly that).
  const stats = { totalCorrect: playerState.totalCorrect, totalAttempts: playerState.totalAttempts, totalRuns: playerState.totalRuns };
  TimeQuizBoard.submitScore(totalScore, stats);
  TimeQuizBoard.submitDailyScore(totalScore, stats);
  TimeQuizBoard.submitRunHistory(totalScore, correctCount, questionsPlayed, lastActiveRegionLabels, answers);
  TimeQuizBoard.savePlayerState(playerState);

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
      <h3>Quiz complete${quitEarly ? " (quit early)" : ""}</h3>
      <p class="tq-nickname">${nickname}'s score</p>
      <p class="tq-final-score">${totalScore.toLocaleString()}</p>
      <p class="tq-final-sub">${correctCount} / ${questionsPlayed} correct${quitEarly ? ` &middot; quit after ${questionsPlayed} of ${QUESTION_COUNT}` : ""} &middot; best score, this browser: ${playerState.bestScore.toLocaleString()}</p>
      ${justUnlocked ? `<p class="tq-unlock-note">&#127881; Region selection unlocked — pick one next time.</p>` : ""}
      <div class="tq-final-actions">
        <button type="button" id="tqReplayBtn" class="btn btn-primary">Play Again</button>
        <a href="geoStreakGame.html" class="btn btn-secondary">Back to GeoStreak</a>
      </div>
      <table class="tq-breakdown">
        <thead><tr><th>#</th><th>Region</th><th>Condition</th><th>Your answer</th><th>Time</th><th>Points</th></tr></thead>
        <tbody>${rows}</tbody>
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
  // screen is what actually decides whether the region picker shows
  // (renderStart() reads playerState.regionsUnlocked), so this is what
  // makes an unlock earned just now actually reachable on the very next
  // attempt, exactly as described on this screen's own unlock note above.
  // (Previously wired straight to startQuiz(), which — reading
  // .tq-region-check:checked from a DOM that only exists on the start
  // screen — silently forced every replay back to World regardless of
  // what was unlocked or previously picked.)
  document.getElementById("tqReplayBtn").addEventListener("click", renderStart);
  TimeQuizBoard.renderLeaderboardPanel("tqLeaderboardPanel");
  TimeQuizBoard.renderMyBestRuns("tqBestRunsBody");
}

// playerState has to be fetched from Firestore before the very first
// renderStart() — unlike before, there's no synchronous localStorage read
// to fall back on for that initial paint. loadPlayerState() itself never
// throws (not configured / offline / brand-new player all resolve to the
// same all-zero default), so this always reaches renderStart().
async function init() {
  playerState = await TimeQuizBoard.loadPlayerState();
  renderStart();
}
init();
