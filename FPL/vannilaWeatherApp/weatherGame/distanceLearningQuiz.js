// DistanceLearningQuiz — a distance-judging companion to GeoStreak and
// Time Quiz. Each round starts at a capital; every question asks for a city
// roughly N km (random, within that round's range — see ROUNDS) from the
// current centre, and the city you name becomes the next question's centre, so the
// quiz walks across the map one answer at a time.
//
// Scoring is how close the real distance lands to the target:
//   points = 100 * (1 - |target - distance| / target), floored at 0
// e.g. target 500 km, answer 150 km away -> off by 350 -> 150/500 -> 30 pts;
//      target 800 km, answer 940 km away -> off by 140 -> 660/800 -> 82.5 pts.
//
// Distances are great-circle (haversine) between the coordinates
// OpenWeatherMap resolves each city to — the same lookup GeoStreak uses.
//
// Data lives in localStorage for now via DistanceLearningStore
// (distanceLearningStore.js), laid out for a later Firebase migration.

const QUESTION_COUNT = 15;
const QUESTION_SECONDS = 20;
const MAX_POINTS = 100;
// Target distance range per round, overridable on each ROUNDS entry.
const DEFAULT_RANGE = { min: 100, max: 2000, step: 100 };
const GAP_SECONDS = 8; // pause on each question's result before the next one; "Next" skips it
// One warning per question: the first not-found or out-of-region answer
// only shows a hint; the second ends the question with 0 points.
const MAX_INVALID_TRIES = 2;
// Rounds open to everyone for now; anything after this index shows as
// locked. Unlocking rules come later.
const UNLOCKED_ROUND_COUNT = 3;
// An answer this close to the current centre is treated as naming the
// centre itself (e.g. "Delhi" while the centre is New Delhi).
const SAME_PLACE_KM = 5;

// ---- Capitals used as each round's starting centre ----------------------
const CAPITALS = {
  europe: [
    ["London", "GB", 51.5074, -0.1278], ["Paris", "FR", 48.8566, 2.3522], ["Berlin", "DE", 52.52, 13.405],
    ["Madrid", "ES", 40.4168, -3.7038], ["Rome", "IT", 41.9028, 12.4964], ["Lisbon", "PT", 38.7223, -9.1393],
    ["Amsterdam", "NL", 52.3676, 4.9041], ["Brussels", "BE", 50.8503, 4.3517], ["Vienna", "AT", 48.2082, 16.3738],
    ["Bern", "CH", 46.948, 7.4474], ["Warsaw", "PL", 52.2297, 21.0122], ["Prague", "CZ", 50.0755, 14.4378],
    ["Budapest", "HU", 47.4979, 19.0402], ["Stockholm", "SE", 59.3293, 18.0686], ["Oslo", "NO", 59.9139, 10.7522],
    ["Copenhagen", "DK", 55.6761, 12.5683], ["Helsinki", "FI", 60.1699, 24.9384], ["Dublin", "IE", 53.3498, -6.2603],
    ["Athens", "GR", 37.9838, 23.7275], ["Bucharest", "RO", 44.4268, 26.1025], ["Sofia", "BG", 42.6977, 23.3219],
    ["Belgrade", "RS", 44.7866, 20.4489], ["Zagreb", "HR", 45.815, 15.9819], ["Kyiv", "UA", 50.4501, 30.5234],
    ["Vilnius", "LT", 54.6872, 25.2797], ["Riga", "LV", 56.9496, 24.1052], ["Tallinn", "EE", 59.437, 24.7536],
    ["Ljubljana", "SI", 46.0569, 14.5058], ["Bratislava", "SK", 48.1486, 17.1077],
  ],
  na: [
    ["Washington", "US", 38.9072, -77.0369], ["Ottawa", "CA", 45.4215, -75.6972], ["Mexico City", "MX", 19.4326, -99.1332],
    ["Havana", "CU", 23.1136, -82.3666], ["Guatemala City", "GT", 14.6349, -90.5069], ["Panama City", "PA", 8.9824, -79.5199],
    ["San José", "CR", 9.9281, -84.0907], ["Kingston", "JM", 18.0179, -76.8099], ["Santo Domingo", "DO", 18.4861, -69.9312],
    ["Tegucigalpa", "HN", 14.0723, -87.1921], ["Managua", "NI", 12.1149, -86.2362], ["San Salvador", "SV", 13.6929, -89.2182],
  ],
  asia: [
    ["New Delhi", "IN", 28.6139, 77.209], ["Tokyo", "JP", 35.6762, 139.6503], ["Beijing", "CN", 39.9042, 116.4074],
    ["Seoul", "KR", 37.5665, 126.978], ["Bangkok", "TH", 13.7563, 100.5018], ["Hanoi", "VN", 21.0278, 105.8342],
    ["Jakarta", "ID", -6.2088, 106.8456], ["Manila", "PH", 14.5995, 120.9842], ["Kuala Lumpur", "MY", 3.139, 101.6869],
    ["Dhaka", "BD", 23.8103, 90.4125], ["Kathmandu", "NP", 27.7172, 85.324], ["Islamabad", "PK", 33.6844, 73.0479],
    ["Tehran", "IR", 35.6892, 51.389], ["Riyadh", "SA", 24.7136, 46.6753], ["Abu Dhabi", "AE", 24.4539, 54.3773],
    ["Ankara", "TR", 39.9334, 32.8597], ["Tashkent", "UZ", 41.2995, 69.2401], ["Ulaanbaatar", "MN", 47.8864, 106.9057],
    ["Taipei", "TW", 25.033, 121.5654], ["Phnom Penh", "KH", 11.5564, 104.9282],
  ],
  africa: [
    ["Cairo", "EG", 30.0444, 31.2357], ["Nairobi", "KE", -1.2921, 36.8219], ["Abuja", "NG", 9.0765, 7.3986],
    ["Accra", "GH", 5.6037, -0.187], ["Addis Ababa", "ET", 9.03, 38.74], ["Pretoria", "ZA", -25.7479, 28.2293],
    ["Rabat", "MA", 34.0209, -6.8416], ["Algiers", "DZ", 36.7538, 3.0588], ["Tunis", "TN", 36.8065, 10.1815],
    ["Dakar", "SN", 14.7167, -17.4677], ["Kinshasa", "CD", -4.4419, 15.2663], ["Luanda", "AO", -8.839, 13.2894],
    ["Kampala", "UG", 0.3476, 32.5825], ["Lusaka", "ZM", -15.3875, 28.3228], ["Harare", "ZW", -17.8252, 31.0335],
    ["Maputo", "MZ", -25.9692, 32.5732], ["Khartoum", "SD", 15.5007, 32.5599], ["Bamako", "ML", 12.6392, -8.0029],
  ],
  // Only used by the World round's random pick.
  other: [
    ["Canberra", "AU", -35.2809, 149.13], ["Wellington", "NZ", -41.2865, 174.7762], ["Moscow", "RU", 55.7558, 37.6173],
    ["Buenos Aires", "AR", -34.6037, -58.3816], ["Brasília", "BR", -15.7975, -47.8919], ["Santiago", "CL", -33.4489, -70.6693],
    ["Lima", "PE", -12.0464, -77.0428], ["Bogotá", "CO", 4.711, -74.0721], ["Quito", "EC", -0.1807, -78.4678],
  ],
};

function capital([name, country, lat, lon]) {
  return { name, country, lat, lon };
}

const ALL_CAPITALS = Object.values(CAPITALS).flat();

// ---- Rounds, in campaign order -------------------------------------------
// countryCodes: null means anywhere counts. Europe and North America use
// the same lists as Time Quiz's stages. Russia is left out of both Europe
// and Asia (it spans both, and OpenWeatherMap only returns a country code).
const ROUNDS = [
  { key: "india", label: "India", countryCodes: ["IN"], range: { min: 200, max: 1800, step: 100 }, start: () => capital(["New Delhi", "IN", 28.6139, 77.209]) },
  { key: "world", label: "World", countryCodes: null, range: { min: 500, max: 15000, step: 500 }, start: () => capital(pickRandom(ALL_CAPITALS)) },
  {
    key: "europe",
    label: "Europe",
    countryCodes: [
      "FR", "DE", "IT", "ES", "PT", "NL", "BE", "LU", "CH", "AT",
      "SE", "NO", "DK", "FI", "IS", "IE", "GB", "PL", "CZ", "SK",
      "HU", "RO", "BG", "GR", "HR", "SI", "RS", "BA", "ME", "MK",
      "AL", "EE", "LV", "LT", "MT", "CY", "LI", "MC", "AD", "SM",
      "VA", "UA", "BY", "MD", "XK",
    ],
    start: () => capital(pickRandom(CAPITALS.europe)),
  },
  {
    key: "na",
    label: "North America",
    countryCodes: [
      "CA", "US", "MX",
      "BZ", "GT", "HN", "SV", "NI", "CR", "PA",
      "CU", "JM", "HT", "DO", "BS", "TT", "BB", "GD", "LC", "VC", "AG", "KN", "DM",
      "GL", "PR",
    ],
    start: () => capital(pickRandom(CAPITALS.na)),
  },
  {
    key: "asia",
    label: "Asia",
    countryCodes: [
      "CN", "JP", "KR", "KP", "MN", "TW", "HK", "MO",
      "IN", "PK", "BD", "LK", "NP", "BT", "MV", "AF",
      "IR", "IQ", "SY", "JO", "LB", "IL", "PS", "SA", "AE", "QA", "BH", "KW", "OM", "YE", "TR",
      "GE", "AM", "AZ", "KZ", "UZ", "TM", "KG", "TJ",
      "TH", "VN", "LA", "KH", "MM", "MY", "SG", "ID", "PH", "BN", "TL",
    ],
    start: () => capital(pickRandom(CAPITALS.asia)),
  },
  { key: "australia", label: "Australia", countryCodes: ["AU"], start: () => capital(["Canberra", "AU", -35.2809, 149.13]) },
  {
    key: "africa",
    label: "Africa",
    countryCodes: [
      "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CD", "CG", "CI", "DJ",
      "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE", "LS", "LR", "LY", "MG",
      "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL", "SO",
      "ZA", "SS", "SD", "TZ", "TG", "TN", "UG", "ZM", "ZW", "EH", "RE", "YT",
    ],
    start: () => capital(pickRandom(CAPITALS.africa)),
  },
];

// ---- Helpers --------------------------------------------------------------
function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function roundRange(r) {
  return r.range || DEFAULT_RANGE;
}

function randomTargetKm(r) {
  const { min, max, step } = roundRange(r);
  const steps = (max - min) / step + 1; // e.g. 200, 300, ... 1800
  return min + Math.floor(Math.random() * steps) * step;
}

function formatRange(r) {
  const { min, max } = roundRange(r);
  return `${min.toLocaleString()}&ndash;${max.toLocaleString()} km`;
}

// Initial great-circle bearing from a to b, 0-360 clockwise from north —
// the direction you'd set off in along the shortest line between them.
function bearingDeg(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const COMPASS = [
  { dir: "N", arrow: "\u2191" }, { dir: "NE", arrow: "\u2197" }, { dir: "E", arrow: "\u2192" }, { dir: "SE", arrow: "\u2198" },
  { dir: "S", arrow: "\u2193" }, { dir: "SW", arrow: "\u2199" }, { dir: "W", arrow: "\u2190" }, { dir: "NW", arrow: "\u2196" },
];

// 8-point compass: each direction covers the 45 degrees centred on it.
function compassPoint(deg) {
  return COMPASS[Math.round(deg / 45) % 8];
}

function directionHtml(direction) {
  if (!direction) return "&ndash;";
  const point = COMPASS.find((c) => c.dir === direction);
  return `<span class="dl-dir">${point.arrow} ${direction}</span>`;
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Rounded to one decimal, so 82.5 stays 82.5.
function computePoints(targetKm, distanceKm) {
  const raw = MAX_POINTS * (1 - Math.abs(targetKm - distanceKm) / targetKm);
  return Math.max(0, Math.round(raw * 10) / 10);
}

function formatPoints(points) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

function formatDuration(ms) {
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

function flagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "";
  return String.fromCodePoint(...[...countryCode.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function placeLabel(place) {
  return `${escapeHtml(place.name)}, ${place.country}`;
}

function placeKey(place) {
  return `${place.name}|${place.country}`.toLowerCase();
}

// ---- State ------------------------------------------------------------------
const ft = new Fetch();
const startEl = document.getElementById("dlStart");
const questionEl = document.getElementById("dlQuestion");
const resultEl = document.getElementById("dlResult");
const finalEl = document.getElementById("dlFinal");

let round = null; // entry from ROUNDS
let run = null; // the run record being built, saved by finishRun()
let qIndex = 0;
let centre = null; // { name, country, lat, lon } the current question measures from
let targetKm = 0;
let questionStart = 0; // performance.now() when the question appeared
let questionToken = 0; // bumps every question, so a late lookup can tell it's stale
let invalidTries = 0;
let tryNumber = 0;
let submitting = false;
let resolved = false;
let timerInterval = null;
let gapInterval = null;
let usedPlaces = new Set(); // placeKey()s of the start capital and every scored answer this run

function showOnly(el) {
  [startEl, questionEl, resultEl, finalEl].forEach((e) => {
    e.style.display = e === el ? "block" : "none";
  });
}

// ---- Start screen -------------------------------------------------------------
function renderStart() {
  const player = DistanceLearningStore.getPlayer();
  const best = player.highScore;

  const roundRows = ROUNDS.map((r, i) => {
    const roundBest = player.roundHighScores[r.key];
    const bestText = roundBest ? `${formatPoints(roundBest.score)}` : "&ndash;";
    if (i >= UNLOCKED_ROUND_COUNT) {
      return `
        <li class="dl-round dl-round-locked">
          <span class="dl-round-icon">&#128274;</span>
          <span class="dl-round-name">${i + 1}. ${r.label}</span>
          <span class="dl-round-best">locked</span>
        </li>`;
    }
    return `
      <li class="dl-round">
        <label class="dl-round-label">
          <input type="radio" name="dlRoundPick" value="${r.key}" ${i === 0 ? "checked" : ""} />
          <span class="dl-round-name">${i + 1}. ${r.label} <span class="dl-round-range">${formatRange(r)}</span></span>
          <span class="dl-round-best">best ${bestText}</span>
        </label>
      </li>`;
  }).join("");

  startEl.innerHTML = `
    <div class="dl-panel">
      <h3>DistanceLearningQuiz</h3>
      <p class="dl-panel-sub">Start at a capital. Name a city the given distance away &mdash; then it becomes the next centre.</p>
      ${player.nickname ? `<p class="dl-nickname">Playing as ${escapeHtml(player.nickname)}</p>` : ""}
      <div class="dl-round-picker">
        <p class="dl-picker-label">Pick a round</p>
        <ul class="dl-round-list">${roundRows}</ul>
      </div>
      <button type="button" id="dlStartBtn" class="btn dl-btn-orange">Start Quiz</button>
      <p class="dl-best">High score: ${best ? `${formatPoints(best.score)} / ${QUESTION_COUNT * MAX_POINTS}` : "none yet"}</p>
      <ul class="dl-howto">
        <li>${QUESTION_COUNT} questions, ${QUESTION_SECONDS} seconds each. Each round has its own target range, shown next to it above.</li>
        <li>Points = how close the real distance is to the target: spot on is ${MAX_POINTS}, off by the whole target (or more) is 0.</li>
        <li>The city must be inside the round's region. A typo or an out-of-region city gets one warning; the second one scores 0.</li>
        <li>Running out of time scores 0 and keeps the same centre.</li>
      </ul>
    </div>
  `;
  showOnly(startEl);
  document.getElementById("dlStartBtn").addEventListener("click", startRun);
}

function startRun() {
  const picked = document.querySelector('input[name="dlRoundPick"]:checked');
  round = ROUNDS.find((r) => r.key === (picked ? picked.value : "india"));
  centre = round.start();
  const player = DistanceLearningStore.getPlayer();
  run = {
    runId: DistanceLearningStore.newId(),
    playerId: player.playerId,
    roundKey: round.key,
    roundLabel: round.label,
    startCity: { ...centre },
    startedAt: DistanceLearningStore.nowIso(),
    startedAtMs: Date.now(), // dropped before saving
    finishedAt: null,
    durationMs: 0,
    totalScore: 0,
    maxScore: QUESTION_COUNT * MAX_POINTS,
    questionCount: QUESTION_COUNT,
    questionsPlayed: 0,
    quitEarly: false,
    questions: [],
  };
  qIndex = 0;
  usedPlaces = new Set([placeKey(centre)]);
  showQuestion();
}

// ---- Question screen ------------------------------------------------------------
function showQuestion() {
  targetKm = randomTargetKm(round);
  invalidTries = 0;
  tryNumber = 0;
  submitting = false;
  resolved = false;
  questionToken += 1;

  questionEl.innerHTML = `
    <p class="dl-progress">Question ${qIndex + 1} / ${QUESTION_COUNT}</p>
    <p class="dl-score-live">Score so far: ${formatPoints(run.totalScore)}</p>
    <div class="dl-timer-row">
      <p class="dl-timer" id="dlTimer">${QUESTION_SECONDS.toFixed(2)}</p>
      <button type="button" id="dlQuitBtn" class="dl-quit-btn">&#9209; Quit</button>
    </div>
    <div class="dl-timer-bar-wrap"><div class="dl-timer-bar" id="dlTimerBar" style="width: 100%;"></div></div>
    <div class="dl-condition">
      <span class="dl-region-badge">${round.label}</span>
      <p class="dl-target">${targetKm.toLocaleString()} km</p>
      <p class="dl-condition-text">from ${flagEmoji(centre.country)} ${placeLabel(centre)}</p>
    </div>
    <div class="dl-input-row">
      <input type="text" id="dlCityInput" class="form-control" placeholder="Type a city name..." autocomplete="off" />
      <button type="button" id="dlSubmitBtn" class="btn dl-btn-orange">Submit</button>
    </div>
    <p class="dl-hint" id="dlHint"></p>
  `;
  showOnly(questionEl);

  const input = document.getElementById("dlCityInput");
  input.focus();
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") submitAnswer(); });
  document.getElementById("dlSubmitBtn").addEventListener("click", submitAnswer);
  document.getElementById("dlQuitBtn").addEventListener("click", quitRun);

  questionStart = performance.now();
  startTimer();
}

function startTimer() {
  const timerEl = document.getElementById("dlTimer");
  const barEl = document.getElementById("dlTimerBar");
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const left = QUESTION_SECONDS - (performance.now() - questionStart) / 1000;
    timerEl.textContent = Math.max(0, left).toFixed(2);
    barEl.style.width = `${Math.max(0, (left / QUESTION_SECONDS) * 100)}%`;
    timerEl.classList.toggle("dl-timer-warn", left <= 10 && left > 5);
    timerEl.classList.toggle("dl-timer-danger", left <= 5);
    if (left <= 0) {
      clearInterval(timerInterval);
      if (!resolved) {
        recordAttempt({ input: "", outcome: "timeout", resolvedPlace: null, distanceKm: null, points: 0 });
        endQuestion({ status: "timeout", answer: null, distanceKm: null, points: 0 });
      }
    }
  }, 31);
}

function setHint(text) {
  document.getElementById("dlHint").textContent = text;
}

function elapsedMs() {
  return Math.round(performance.now() - questionStart);
}

function recordAttempt({ input, outcome, resolvedPlace, distanceKm, points, bearing = null, direction = null }) {
  tryNumber += 1;
  DistanceLearningStore.saveAttempt({
    runId: run.runId,
    playerId: run.playerId,
    roundKey: round.key,
    questionNumber: qIndex + 1,
    tryNumber,
    centre: { ...centre },
    targetKm,
    input,
    outcome,
    resolved: resolvedPlace,
    distanceKm,
    bearingDeg: bearing,
    direction,
    points,
    elapsedMs: elapsedMs(),
  });
}

// Country check for region-restricted rounds. The weather lookup's own
// country code alone let "Dhaka,IN" through in the India round — the ",IN"
// steers OpenWeather to a village called Dhāka in Bihar — so two more
// checks run alongside it:
//   1. reverse-geocode the resolved coordinates — the country the point
//      actually sits in;
//   2. if the player typed a ",XX" suffix, look the bare name up too: if
//      that resolves outside the region ("Dhaka" -> BD), the suffix was
//      just steering a famous foreign city to a same-named small town.
// The bare-name check uses the weather lookup rather than OpenWeather's
// geocoder, whose top match ranks poorly (it puts Surat in France and
// Salem in the US). A check that fails to load is skipped rather than
// blocking the answer. Returns an error message, or null when the answer
// is in the region.
async function checkRegion(typed, place) {
  const codes = round.countryCodes;
  if (!codes.includes(place.country)) {
    return `${place.name}, ${place.country} isn't in ${round.label}.`;
  }
  const bareName = typed.split(",")[0].trim();
  const [actualCountry, bare] = await Promise.all([
    ft.reverseGeocodeCountry(place.lat, place.lon),
    typed.includes(",") ? ft.getCurrentForGame(bareName) : null,
  ]);
  if (actualCountry && !codes.includes(actualCountry)) {
    return `${place.name} is actually in ${actualCountry}, not ${round.label}.`;
  }
  if (bare && !codes.includes(bare.sys.country)) {
    return `"${bareName}" is ${bare.name}, ${bare.sys.country} — not in ${round.label}.`;
  }
  return null;
}

// A not-found or out-of-region answer: first one warns, second ends the
// question with 0.
function invalidAnswer(input, outcome, resolvedPlace, message) {
  recordAttempt({ input, outcome, resolvedPlace, distanceKm: null, points: 0 });
  invalidTries += 1;
  if (invalidTries >= MAX_INVALID_TRIES) {
    endQuestion({ status: "invalid", answer: null, distanceKm: null, points: 0, note: message });
    return;
  }
  setHint(`${message} One more try — the next miss scores 0.`);
  document.getElementById("dlSubmitBtn").disabled = false;
  document.getElementById("dlCityInput").select();
}

async function submitAnswer() {
  if (resolved || submitting) return;
  const input = document.getElementById("dlCityInput");
  const typed = input.value.trim();
  if (!typed) {
    setHint("Type a city name, or wait out the clock.");
    return;
  }

  submitting = true;
  const token = questionToken;
  document.getElementById("dlSubmitBtn").disabled = true;

  let data = null;
  try {
    data = await ft.getCurrentForGame(typed);
  } catch (err) {
    data = null;
  }
  submitting = false;
  if (token !== questionToken || resolved) return; // the clock ran out during the lookup

  if (!data) {
    invalidAnswer(typed, "not_found", null, `Nothing found for "${typed}".`);
    return;
  }

  const place = { name: data.name, country: data.sys.country, lat: data.coord.lat, lon: data.coord.lon };

  if (round.countryCodes) {
    const regionError = await checkRegion(typed, place);
    if (token !== questionToken || resolved) return;
    if (regionError) {
      invalidAnswer(typed, "wrong_region", place, regionError);
      return;
    }
  }

  // Naming the centre again, or a city already used this run, doesn't
  // count as a miss — just pick another.
  const distanceKm = Math.round(haversineKm(centre, place));
  if (usedPlaces.has(placeKey(place)) || distanceKm < SAME_PLACE_KM) {
    recordAttempt({ input: typed, outcome: "already_used", resolvedPlace: place, distanceKm, points: 0 });
    setHint(`${place.name}, ${place.country} is already used this quiz. Try a different city.`);
    document.getElementById("dlSubmitBtn").disabled = false;
    input.select();
    return;
  }

  const points = computePoints(targetKm, distanceKm);
  const bearing = Math.round(bearingDeg(centre, place));
  const direction = compassPoint(bearing).dir;
  recordAttempt({ input: typed, outcome: "scored", resolvedPlace: place, distanceKm, points, bearing, direction });
  endQuestion({ status: "scored", answer: place, distanceKm, points, bearing, direction });
}

function endQuestion({ status, answer, distanceKm, points, note, bearing = null, direction = null }) {
  resolved = true;
  clearInterval(timerInterval);
  const fromCentre = { ...centre };

  run.questions.push({
    number: qIndex + 1,
    centre: fromCentre,
    targetKm,
    status,
    answer,
    distanceKm,
    bearingDeg: bearing,
    direction,
    points,
    timeTakenMs: Math.min(elapsedMs(), QUESTION_SECONDS * 1000),
    attemptCount: tryNumber,
  });
  run.totalScore = Math.round((run.totalScore + points) * 10) / 10;

  // Only a scored answer moves the centre.
  if (status === "scored") {
    centre = answer;
    usedPlaces.add(placeKey(answer));
  }

  renderQuestionResult({ status, answer, distanceKm, points, note, fromCentre, direction });
}

function quitRun() {
  if (!confirm("Quit now? Your current score will be saved as this run's final score.")) return;
  clearInterval(timerInterval);
  resolved = true;
  questionToken += 1;
  run.quitEarly = true;
  finishRun();
}

// ---- Between questions ------------------------------------------------------------
function renderQuestionResult({ status, answer, distanceKm, points, note, fromCentre, direction }) {
  const isLast = qIndex + 1 >= QUESTION_COUNT;
  let headline;
  let detail;
  if (status === "scored") {
    const off = distanceKm - targetKm;
    headline = `+${formatPoints(points)}`;
    detail = `
      <span class="dl-result-dir">${directionHtml(direction)}</span>
      ${flagEmoji(answer.country)} ${placeLabel(answer)} is <b>${distanceKm.toLocaleString()} km ${direction}</b> of ${placeLabel(fromCentre)}
      <br />Target ${targetKm.toLocaleString()} km &middot; ${off === 0 ? "spot on" : `${Math.abs(off).toLocaleString()} km ${off > 0 ? "over" : "short"}`}`;
  } else if (status === "timeout") {
    headline = "+0";
    detail = `Time's up. The centre stays ${placeLabel(fromCentre)}.`;
  } else {
    headline = "+0";
    detail = `${escapeHtml(note || "Invalid answer.")} The centre stays ${placeLabel(fromCentre)}.`;
  }

  resultEl.innerHTML = `
    <div class="dl-panel">
      <p class="dl-progress">Question ${qIndex + 1} / ${QUESTION_COUNT}</p>
      <span class="dl-result-badge ${status === "scored" ? "dl-result-good" : "dl-result-bad"}">${status === "scored" ? "SCORED" : status === "timeout" ? "TIME'S UP" : "INVALID"}</span>
      <p class="dl-result-points">${headline}</p>
      <p class="dl-result-detail">${detail}</p>
      <p class="dl-result-total">Score so far: ${formatPoints(run.totalScore)}</p>
      <p class="dl-timer" id="dlGapTimer">${GAP_SECONDS.toFixed(2)}</p>
      <button type="button" id="dlNextBtn" class="btn btn-secondary">${isLast ? "See results now" : "Next question now"}</button>
    </div>
  `;
  showOnly(resultEl);

  let advanced = false;
  const advance = () => {
    if (advanced) return;
    advanced = true;
    clearInterval(gapInterval);
    qIndex += 1;
    if (qIndex < QUESTION_COUNT) showQuestion();
    else finishRun();
  };
  document.getElementById("dlNextBtn").addEventListener("click", advance);

  const gapStart = performance.now();
  const gapTimerEl = document.getElementById("dlGapTimer");
  clearInterval(gapInterval);
  gapInterval = setInterval(() => {
    const left = GAP_SECONDS - (performance.now() - gapStart) / 1000;
    if (left <= 0) advance();
    else gapTimerEl.textContent = left.toFixed(2);
  }, 31);
}

// ---- Results ------------------------------------------------------------------------
function finishRun() {
  const { startedAtMs, ...record } = run;
  record.finishedAt = DistanceLearningStore.nowIso();
  record.durationMs = Date.now() - startedAtMs;
  record.questionsPlayed = record.questions.length;
  const { isHighScore, isRoundHighScore } = DistanceLearningStore.saveRun(record);

  // Highlight the best-scoring question(s); nothing to highlight if every
  // question scored 0.
  const topPoints = Math.max(0, ...record.questions.map((q) => q.points));
  const rows = record.questions.map((q) => `
    <tr class="${topPoints > 0 && q.points === topPoints ? "dl-row-top" : ""}">
      <td>${q.number}</td>
      <td>${placeLabel(q.centre)}</td>
      <td>${q.targetKm.toLocaleString()}</td>
      <td>${q.answer ? placeLabel(q.answer) : `<span class="dl-muted">${q.status === "timeout" ? "time's up" : "invalid"}</span>`}</td>
      <td>${q.distanceKm != null ? q.distanceKm.toLocaleString() : "&ndash;"}</td>
      <td>${directionHtml(q.direction)}</td>
      <td class="${q.points > 0 ? "dl-pts-good" : "dl-pts-zero"}">${formatPoints(q.points)}</td>
      <td>${(q.timeTakenMs / 1000).toFixed(1)}s</td>
    </tr>`).join("");

  finalEl.innerHTML = `
    <div class="dl-panel">
      <h3>${round.label} complete${record.quitEarly ? " (quit early)" : ""}</h3>
      <p class="dl-final-score">${formatPoints(record.totalScore)}</p>
      <p class="dl-final-sub">out of ${record.maxScore} &middot; ${record.questionsPlayed} questions &middot; round time ${formatDuration(record.durationMs)}</p>
      ${isHighScore ? `<p class="dl-highscore-note">&#127881; New high score!</p>` : isRoundHighScore ? `<p class="dl-highscore-note">&#127881; New ${round.label} best!</p>` : ""}
      <div class="dl-final-actions">
        <button type="button" id="dlReplayBtn" class="btn dl-btn-orange">Play Again</button>
        <a href="geoStreakGame.html" class="btn btn-secondary">Back to GeoStreak</a>
      </div>
      <div class="dl-table-wrap">
        <table class="dl-breakdown">
          <thead><tr><th>#</th><th>From</th><th>Target km</th><th>Answer</th><th>Actual km</th><th>Dir</th><th>Pts</th><th>Time</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  showOnly(finalEl);
  document.getElementById("dlReplayBtn").addEventListener("click", renderStart);
}

renderStart();
