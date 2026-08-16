// Morning Checklist — a personal daily habit tracker, built from "7
// morning mistakes" (checking your phone first thing, coffee before
// water, no morning sunlight, a high-carb breakfast, eating too soon
// after waking, sitting straight back down after eating, starting the day
// in survival mode). Each item is phrased as the win, not the mistake —
// checking a box means you avoided it today, not that you did it.
//
// Storage is localStorage for now — one browser, one person, no sign-in.
// Firebase (matching GeoStreak's project/collection already prepped in
// firestore.rules) is planned as a follow-up so history can be reached
// from other devices; see this folder's README.md.

const ITEMS = [
  { title: "Phone stayed down", subtitle: "didn't check it the second I woke up" },
  { title: "Water before coffee", subtitle: "hydrated before caffeinating" },
  { title: "Got morning sunlight", subtitle: "outside light within the first hour" },
  { title: "Skipped the carb-heavy breakfast", subtitle: "protein & fat over cereal or toast" },
  { title: "Waited to eat", subtitle: "didn't eat the instant I woke up" },
  { title: "Moved after eating", subtitle: "didn't sit straight back down" },
  { title: "Started the day calm", subtitle: "not full survival mode" },
];

const STORAGE_PREFIX = "morningChecklist_";
const STREAK_LOOKBACK_DAYS = 90; // bounds the worst-case loop length of computeStreak()

// Local calendar day, not a fixed timezone like GeoStreak's daily
// leaderboard — this is a single person's own routine, so "today" should
// just mean today wherever they actually are.
function localDateStr(date) {
  return new Intl.DateTimeFormat("en-CA").format(date);
}

function addDays(dateStr, delta) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d); // local midnight, not UTC — avoids an off-by-one on the date string
  dt.setDate(dt.getDate() + delta);
  return localDateStr(dt);
}

function formatDisplayDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });
}

function readDay(dateStr) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + dateStr);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) return ITEMS.map((_, i) => !!parsed[i]);
  } catch (err) {
    console.error("Checklist: readDay failed", err);
  }
  return new Array(ITEMS.length).fill(false);
}

function writeDay(dateStr, checkedArr) {
  try {
    localStorage.setItem(STORAGE_PREFIX + dateStr, JSON.stringify(checkedArr));
  } catch (err) {
    console.error("Checklist: writeDay failed", err);
  }
}

let viewedDate = localDateStr(new Date());
let checked = new Array(ITEMS.length).fill(false);

const listEl = document.getElementById("mcList");
const statusEl = document.getElementById("mcStatus");
const dateValueEl = document.getElementById("mcDateValue");
const dateLabelEl = document.getElementById("mcDateLabel");
const prevBtn = document.getElementById("mcPrevDay");
const nextBtn = document.getElementById("mcNextDay");
const todayBtn = document.getElementById("mcTodayBtn");
const streakEl = document.getElementById("mcStreak");
const sceneCaptionEl = document.getElementById("mcSceneCaption");
const sunEl = document.getElementById("mcSun");
const sunGlowEl = document.getElementById("mcSunGlow");
const raysEl = document.getElementById("mcRays");

// The sun's height is a direct readout of today's progress: 0/7 sits
// below the horizon, 7/7 sits near the top. Rays fade in only once every
// item is checked, as a small payoff for actually finishing.
function updateSunScene(count) {
  const total = ITEMS.length;
  const t = count / total;
  const y = 150 - t * 120;
  sunEl.setAttribute("cy", y);
  sunGlowEl.setAttribute("cy", y);
  raysEl.style.opacity = count === total ? "1" : "0";
  sceneCaptionEl.textContent = `${count} / ${total} today`;

  if (raysEl.childElementCount === 0) {
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const ray = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ray.setAttribute("x1", 200 + Math.cos(angle) * 34);
      ray.setAttribute("y1", 30 + Math.sin(angle) * 34);
      ray.setAttribute("x2", 200 + Math.cos(angle) * 46);
      ray.setAttribute("y2", 30 + Math.sin(angle) * 46);
      ray.setAttribute("stroke", "#ffe9a8");
      ray.setAttribute("stroke-width", "3");
      ray.setAttribute("stroke-linecap", "round");
      ray.setAttribute("class", "mc-ray");
      raysEl.appendChild(ray);
    }
  }
}

function renderList() {
  listEl.innerHTML = ITEMS.map((item, i) => `
    <li class="mc-item${checked[i] ? " mc-checked" : ""}" data-index="${i}" role="checkbox" aria-checked="${checked[i]}" tabindex="0">
      <span class="mc-checkbox">
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4.5" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <span class="mc-item-text">
        <span class="mc-item-title">${item.title}</span>
        <span class="mc-item-subtitle">${item.subtitle}</span>
      </span>
    </li>
  `).join("");

  listEl.querySelectorAll(".mc-item").forEach((el) => {
    const toggle = () => toggleItem(Number(el.dataset.index));
    el.addEventListener("click", toggle);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });

  updateSunScene(checked.filter(Boolean).length);
}

function updateDateBar() {
  const today = localDateStr(new Date());
  dateLabelEl.textContent = viewedDate === today ? "Today" : formatDisplayDate(viewedDate).split(",")[0];
  dateValueEl.textContent = formatDisplayDate(viewedDate);
  nextBtn.disabled = viewedDate >= today;
  todayBtn.disabled = viewedDate === today;
}

function loadDay(dateStr) {
  viewedDate = dateStr;
  updateDateBar();
  checked = readDay(dateStr);
  renderList();
  statusEl.textContent = "";
}

function saveDay() {
  writeDay(viewedDate, checked);
  renderStreak(); // today's own state feeds into the streak, so refresh it after every save
}

function toggleItem(index) {
  checked[index] = !checked[index];
  renderList();
  saveDay();
}

// Walks backward from today, one localStorage read per day. Stops at the
// first incomplete day, except today itself: a not-yet-finished today
// shouldn't zero out an otherwise-real streak while the day is still in
// progress, so that one day is skipped rather than treated as a break.
function computeStreak() {
  let streak = 0;
  let cursor = localDateStr(new Date());
  for (let i = 0; i < STREAK_LOOKBACK_DAYS; i++) {
    const dayChecked = cursor === viewedDate ? checked : readDay(cursor);
    const complete = dayChecked.length === ITEMS.length && dayChecked.every(Boolean);
    if (!complete) {
      if (i === 0) { cursor = addDays(cursor, -1); continue; } // today in progress: skip, don't break
      break;
    }
    streak++;
    cursor = addDays(cursor, -1);
  }
  streakEl.textContent = streak > 0 ? `🔥 ${streak} day${streak === 1 ? "" : "s"} in a row` : "";
}

function renderStreak() {
  computeStreak();
}

function goToDay(dateStr) {
  const today = localDateStr(new Date());
  if (dateStr > today) return; // no peeking into the future
  loadDay(dateStr);
  renderStreak();
}

prevBtn.addEventListener("click", () => goToDay(addDays(viewedDate, -1)));
nextBtn.addEventListener("click", () => goToDay(addDays(viewedDate, 1)));
todayBtn.addEventListener("click", () => goToDay(localDateStr(new Date())));

updateDateBar();
loadDay(viewedDate);
renderStreak();
