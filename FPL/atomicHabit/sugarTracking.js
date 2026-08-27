// Sugar Control — a personal habit tracker in the spirit of Atomic
// Habits' "make it obvious, make it satisfying": three checkboxes a day
// (Morning / Afternoon / Evening), one per stretch of the day spent
// sugar-free. Checking a box means sugar was successfully avoided during
// that stretch, not that it was eaten.
//
// Storage is localStorage — one browser, no sign-in, same as
// ../weatherGame/checklist (see that folder's README for the Firebase
// follow-up shape if this ever needs to sync across devices).
//
// Self-contained: own copies of the date-string helpers
// ../weatherGame/checklist/app.js already has, since this page has no
// build step to import from another file with.

const PERIODS = ["Morning", "Afternoon", "Evening"];
// Hour (in the viewer's own local time) at which each period is
// considered "over" — used only to decide whether an unchecked period
// is still in progress (don't break the streak on it) or genuinely
// missed (do). Morning ends at noon, afternoon at 5pm, evening at
// midnight — adjust here if that split doesn't match your actual day.
const PERIOD_END_HOUR = [12, 17, 24];

const STORAGE_PREFIX = "sugarTracking_";
const STREAK_LOOKBACK_DAYS = 365; // bounds the worst-case loop length of computeStreak()

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
    if (Array.isArray(parsed)) return PERIODS.map((_, i) => !!parsed[i]);
  } catch (err) {
    console.error("Sugar Control: readDay failed", err);
  }
  return new Array(PERIODS.length).fill(false);
}

function writeDay(dateStr, checkedArr) {
  try {
    localStorage.setItem(STORAGE_PREFIX + dateStr, JSON.stringify(checkedArr));
  } catch (err) {
    console.error("Sugar Control: writeDay failed", err);
  }
}

// Which period "now" falls in — the one still open for a decision today.
function currentPeriodIndex(now) {
  const hour = now.getHours();
  for (let i = 0; i < PERIOD_END_HOUR.length; i++) {
    if (hour < PERIOD_END_HOUR[i]) return i;
  }
  return PERIODS.length - 1;
}

// Walks backward from "now", one PERIOD at a time (not one day at a
// time like checklist's day-level streak) — Evening, Afternoon, Morning
// for each day, oldest day last. A checked period always counts, even
// one checked "early" (before its own window technically started — an
// unusual way to use the page, but not wrong). An UNCHECKED period only
// breaks the streak once its window has actually closed; today's
// currently-open period (and anything later today) is still undecided,
// not a miss, so it's skipped rather than breaking anything. A real
// break — checked=false on a period whose window is over — stops the
// count immediately: nothing further back gets partial credit, even
// periods earlier that same day that were themselves checked, since the
// streak is "how far back does the unbroken run go", not a per-day tally.
function computeStreak(getDayFn, todayDateStr, now) {
  let streak = 0;
  let cursor = todayDateStr;
  const curPeriod = currentPeriodIndex(now);
  for (let dayOffset = 0; dayOffset < STREAK_LOOKBACK_DAYS; dayOffset++) {
    const dayChecked = getDayFn(cursor);
    const isToday = dayOffset === 0;
    let dayBroken = false;
    for (let p = PERIODS.length - 1; p >= 0; p--) {
      if (dayChecked[p]) { streak++; continue; }
      if (isToday && p >= curPeriod) continue; // still in progress or not started — not a miss yet
      dayBroken = true;
      break;
    }
    if (dayBroken) break;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

let viewedDate = localDateStr(new Date());
let checked = new Array(PERIODS.length).fill(false);

const listEl = document.getElementById("stList");
const statusEl = document.getElementById("stStatus");
const dateValueEl = document.getElementById("stDateValue");
const dateLabelEl = document.getElementById("stDateLabel");
const prevBtn = document.getElementById("stPrevDay");
const nextBtn = document.getElementById("stNextDay");
const todayBtn = document.getElementById("stTodayBtn");
const calendarBtn = document.getElementById("stCalendarBtn");
const dateInput = document.getElementById("stDateInput");
const streakEl = document.getElementById("stStreak");
const progressEl = document.getElementById("stProgress");

dateInput.max = localDateStr(new Date()); // no backdating into the future

function renderProgress(count) {
  progressEl.querySelectorAll(".ah-progress-seg").forEach((seg, i) => {
    seg.classList.toggle("ah-progress-fill", i < count);
  });
}

function renderList() {
  listEl.innerHTML = PERIODS.map((title, i) => `
    <li class="ah-item${checked[i] ? " ah-checked" : ""}" data-index="${i}" role="checkbox" aria-checked="${checked[i]}" tabindex="0">
      <span class="ah-checkbox">
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4.5" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <span class="ah-item-text">
        <span class="ah-item-title">${title}</span>
        <span class="ah-item-subtitle">No sugar this stretch</span>
      </span>
    </li>
  `).join("");

  listEl.querySelectorAll(".ah-item").forEach((el) => {
    const toggle = () => toggleItem(Number(el.dataset.index));
    el.addEventListener("click", toggle);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });

  renderProgress(checked.filter(Boolean).length);
}

function updateDateBar() {
  const today = localDateStr(new Date());
  dateLabelEl.textContent = viewedDate === today ? "Today" : formatDisplayDate(viewedDate).split(",")[0];
  dateValueEl.textContent = formatDisplayDate(viewedDate);
  nextBtn.disabled = viewedDate >= today;
  todayBtn.disabled = viewedDate === today;
  dateInput.value = viewedDate;
}

function loadDay(dateStr) {
  viewedDate = dateStr;
  updateDateBar();
  checked = readDay(dateStr);
  renderList();
  statusEl.textContent = "";
}

function renderStreak() {
  const streak = computeStreak(readDay, localDateStr(new Date()), new Date());
  streakEl.textContent = streak > 0 ? `🔥 ${streak} sugar-free stretch${streak === 1 ? "" : "es"} in a row` : "";
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

function goToDay(dateStr) {
  const today = localDateStr(new Date());
  if (dateStr > today) return; // no peeking into the future
  loadDay(dateStr);
  renderStreak();
}

prevBtn.addEventListener("click", () => goToDay(addDays(viewedDate, -1)));
nextBtn.addEventListener("click", () => goToDay(addDays(viewedDate, 1)));
todayBtn.addEventListener("click", () => goToDay(localDateStr(new Date())));

calendarBtn.addEventListener("click", () => {
  if (typeof dateInput.showPicker === "function") {
    dateInput.showPicker();
  } else {
    dateInput.focus();
    dateInput.click(); // older browsers: this at least opens the native picker on most platforms
  }
});
dateInput.addEventListener("change", () => {
  if (dateInput.value) goToDay(dateInput.value);
});

updateDateBar();
loadDay(viewedDate);
renderStreak();
