// Abbotsford — a general daily task tracker using the same "move a rock
// from one pile to another" mechanic as Paperclip, just for whatever
// tasks you add that day instead of timed Pomodoros. Named for the same
// Trent Dyrsmid story Paperclip is (see this folder's README) — a bank
// in Abbotsford, Canada, where he worked.
//
// Storage is localStorage — one browser, no sign-in, same as
// sugarTracking.js in this folder. Self-contained: own copies of the
// date-string helpers sugarTracking.js already has, since this page has
// no build step to import from another file with.

const STORAGE_PREFIX = "abbotsford_";

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

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

// A task worth more than CLIP_BONUS_THRESHOLD_MINUTES gets multiple
// clips instead of a flat one — one per MINUTES_PER_CLIP, floored — so
// the finished pile reflects actual meaningful time invested, not just a
// raw count of checked-off tasks. Examples from the original ask: 32 min
// -> 3 clips, 29 min -> 2 clips; 20 min or less always stays at 1 clip
// regardless of how the division would round.
const MINUTES_PER_CLIP = 10;
const CLIP_BONUS_THRESHOLD_MINUTES = 20;

function clipsForMinutes(minutes) {
  return minutes > CLIP_BONUS_THRESHOLD_MINUTES ? Math.floor(minutes / MINUTES_PER_CLIP) : 1;
}

// One localStorage entry per local calendar day, holding that day's own
// task list — { name, completed, completedAt, createdAt, minutes, clips }
// per task. completedAt is the actual point of this page's own ask:
// knowing WHEN each task was finished, not just that it eventually was.
// `minutes`/`clips` are absent on a task that isn't completed yet (or
// one completed before this feature existed).
function readDay(dateStr) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + dateStr);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed.tasks)) return parsed.tasks;
  } catch (err) {
    console.error("Abbotsford: readDay failed", err);
  }
  return [];
}

function writeDay(dateStr, dayTasks) {
  try {
    localStorage.setItem(STORAGE_PREFIX + dateStr, JSON.stringify({ tasks: dayTasks }));
  } catch (err) {
    console.error("Abbotsford: writeDay failed", err);
  }
}

let viewedDate = localDateStr(new Date());
let tasks = []; // this viewedDate's own task list

const listEl = document.getElementById("abTaskList");
const statusEl = document.getElementById("abStatus");
const dateValueEl = document.getElementById("abDateValue");
const dateLabelEl = document.getElementById("abDateLabel");
const prevBtn = document.getElementById("abPrevDay");
const nextBtn = document.getElementById("abNextDay");
const todayBtn = document.getElementById("abTodayBtn");
const calendarBtn = document.getElementById("abCalendarBtn");
const dateInput = document.getElementById("abDateInput");
const newTaskInput = document.getElementById("abNewTaskInput");
const addTaskBtn = document.getElementById("abAddTaskBtn");
const remainingCountEl = document.getElementById("abRemainingCount");
const remainingGridEl = document.getElementById("abRemainingGrid");
const finishedCountEl = document.getElementById("abFinishedCount");
const finishedGridEl = document.getElementById("abFinishedGrid");

dateInput.max = localDateStr(new Date()); // no backdating into the future

function formatCompletedAt(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// Clips are anonymous counts, not tied to which specific task they
// represent — same convention Paperclip's own basket grids use. The
// finished pile's count is a SUM of each completed task's own `clips`
// (defaulting to 1 for a task completed before this feature existed),
// not a plain task count — a single 32-minute task shows as 3 clips
// here, same as three separate quick ones would. `animateNew` highlights
// one newly-finished clip right after a completion; omitted on a plain
// day-load/add so existing clips don't replay the landing animation
// every render.
function renderRocks(animateNew) {
  const remaining = tasks.filter((t) => !t.completed).length;
  const finished = tasks
    .filter((t) => t.completed)
    .reduce((sum, t) => sum + (t.clips || 1), 0);
  remainingCountEl.textContent = `${remaining}`;
  finishedCountEl.textContent = `${finished}`;
  remainingGridEl.innerHTML = Array.from({ length: remaining }, () => `<span class="ah-clip">&#128206;</span>`).join("");
  finishedGridEl.innerHTML = Array.from({ length: finished }, (_, i) => {
    const isNewest = animateNew && i === finished - 1;
    return `<span class="ah-clip${isNewest ? " ah-clip-new" : ""}">&#128206;</span>`;
  }).join("");
}

function taskSubtitle(t) {
  if (!t.completed) return "Not done yet";
  const when = `Completed at ${formatCompletedAt(t.completedAt)}`;
  if (t.minutes == null) return when; // completed before minutes/clips tracking existed
  const clips = t.clips || 1;
  return `${when} &middot; ${t.minutes} min &middot; ${clips} clip${clips === 1 ? "" : "s"} &#128206;`;
}

function renderList() {
  if (tasks.length === 0) {
    listEl.innerHTML = "";
    statusEl.textContent = "No tasks added for this day yet.";
    return;
  }
  statusEl.textContent = "";
  listEl.innerHTML = tasks.map((t, i) => `
    <li class="ah-item${t.completed ? " ah-checked" : ""}" data-index="${i}" role="checkbox" aria-checked="${t.completed}" tabindex="0">
      <span class="ah-checkbox">
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4.5" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <span class="ah-item-text">
        <span class="ah-item-title">${escapeHtml(t.name)}</span>
        <span class="ah-item-subtitle">${taskSubtitle(t)}</span>
      </span>
      <button type="button" class="ah-item-edit-btn" data-index="${i}" title="Edit task name" aria-label="Edit task name">&#9998;</button>
    </li>
  `).join("");

  listEl.querySelectorAll(".ah-item").forEach((el) => {
    const toggle = () => toggleTask(Number(el.dataset.index));
    el.addEventListener("click", toggle);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });

  // The edit button sits inside each .ah-item, whose own click/keydown
  // listeners (above) would otherwise treat a click here as "toggle this
  // task" too — stopPropagation() on both event types keeps editing from
  // also completing/un-completing the task it's attached to.
  listEl.querySelectorAll(".ah-item-edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      editTask(Number(btn.dataset.index));
    });
    btn.addEventListener("keydown", (e) => e.stopPropagation());
  });
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
  tasks = readDay(dateStr);
  renderRocks(false);
  renderList();
}

function saveDay() {
  writeDay(viewedDate, tasks);
}

// Un-completing is a plain, reversible undo (an accidental tap shouldn't
// be permanent) — no confirmation, no re-asking for minutes, just clears
// completedAt/minutes/clips back out. COMPLETING a task is the "commit"
// moment the original ask cares about: confirm, then log how long it
// actually took, since that's what turns a checkbox into a real record
// of the day's work rather than a plain to-do list.
function toggleTask(index) {
  const task = tasks[index];

  if (task.completed) {
    task.completed = false;
    task.completedAt = null;
    task.minutes = undefined;
    task.clips = undefined;
    renderRocks(false);
    renderList();
    saveDay();
    return;
  }

  if (!confirm("Are you sure you want to commit?")) return;

  const raw = prompt("How many minutes did this task take?");
  if (raw == null) return; // cancelled — task stays unchecked, nothing saved
  const minutes = Number(String(raw).trim());
  if (!Number.isFinite(minutes) || minutes <= 0) {
    alert("Enter a number of minutes greater than 0.");
    return;
  }

  task.completed = true;
  task.completedAt = Date.now();
  task.minutes = minutes;
  task.clips = clipsForMinutes(minutes);
  renderRocks(true);
  renderList();
  saveDay();
}

function editTask(index) {
  const task = tasks[index];
  const newName = prompt("Edit task name", task.name);
  if (newName == null) return; // cancelled
  const trimmed = newName.trim();
  if (!trimmed) return; // don't allow blanking out a task's name entirely
  task.name = trimmed;
  renderList();
  saveDay();
}

function addTask() {
  const name = newTaskInput.value.trim();
  if (!name) return;
  tasks.push({ name, completed: false, completedAt: null, createdAt: Date.now() });
  newTaskInput.value = "";
  renderRocks(false);
  renderList();
  saveDay();
  newTaskInput.focus();
}

function goToDay(dateStr) {
  const today = localDateStr(new Date());
  if (dateStr > today) return; // no peeking into the future
  loadDay(dateStr);
}

addTaskBtn.addEventListener("click", addTask);
newTaskInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });

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
