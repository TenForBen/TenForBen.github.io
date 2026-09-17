// Abbotsford — a general daily task tracker using the same "move a clip
// from one pile to another" mechanic as Paperclip, just for whatever
// tasks you add that day instead of timed Pomodoros. Named for the same
// Trent Dyrsmid story Paperclip is (see this folder's README) — a bank
// in Abbotsford, Canada, where he worked.
//
// Firestore-backed, same as Paperclip and NOT localStorage (this page
// started as a localStorage prototype; see git history for that version)
// — nickname and every task write go through the same Firebase project
// GeoStreak/Time Quiz/Paperclip already use (see
// ../vannilaWeatherApp/weatherGame/firestore.rules' Abbotsford section),
// referenced via ../vannilaWeatherApp/weatherGame/firebaseConfig.js
// rather than duplicated. Self-contained otherwise: own copies of the
// date-string helpers sugarTracking.js/paperclip.js already have, since
// this page has no build step to import from another file with.

const PROFILES_COLLECTION = "abbotsfordProfiles";
const TASKS_COLLECTION = "abbotsfordTasks";

const configured = typeof firebaseConfig !== "undefined"
  && firebaseConfig.apiKey
  && !firebaseConfig.apiKey.startsWith("REPLACE_ME");

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

function randomNickname() {
  return `Player${Math.floor(1000 + Math.random() * 9000)}`;
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

// ---- Firebase -----------------------------------------------------------

let db = null;
let uid = null;
let ready = Promise.resolve();

function initFirebase() {
  if (!configured) return;
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  const auth = firebase.auth();
  ready = auth.signInAnonymously()
    .then(() => new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) return;
        unsubscribe();
        resolve();
      });
    }))
    .catch((err) => console.error("Abbotsford: anonymous sign-in failed", err));
}

// Same `nicknameChosen` reasoning as Paperclip's own loadOrCreateProfile()
// — the placeholder itself has to be persisted right away too
// (firestore.rules never allows an empty nickname), so a separate flag is
// what actually distinguishes "still on the placeholder" from "saved a
// real name."
async function loadOrCreateProfile() {
  const doc = await db.collection(PROFILES_COLLECTION).doc(uid).get();
  if (doc.exists && doc.data().nickname) {
    const d = doc.data();
    return { nickname: d.nickname, nicknameChosen: !!d.nicknameChosen };
  }
  const placeholder = randomNickname();
  await db.collection(PROFILES_COLLECTION).doc(uid).set({
    nickname: placeholder,
    nicknameChosen: false,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return { nickname: placeholder, nicknameChosen: false };
}

async function saveNickname(trimmed) {
  await db.collection(PROFILES_COLLECTION).doc(uid).set({
    nickname: trimmed,
    nicknameChosen: true,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

// One document per task ever added (auto id) rather than one document per
// day holding a whole array — so completing, editing, or unchecking a
// single task is a small write to just that task's own doc, not a
// re-serialize of the entire day's list on every change. `date` is a
// local calendar-day string, queried with a composite index (uid + date +
// createdAt — see this folder's README for the one-time setup).
async function loadTasksForDate(dateStr) {
  const snap = await db.collection(TASKS_COLLECTION)
    .where("uid", "==", uid)
    .where("date", "==", dateStr)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name,
      completed: d.completed,
      completedAt: d.completedAt ? d.completedAt.toMillis() : null,
      minutes: d.minutes,
      clips: d.clips,
    };
  });
}

async function createTask(dateStr, name) {
  const docRef = await db.collection(TASKS_COLLECTION).add({
    uid,
    date: dateStr,
    name,
    completed: false,
    completedAt: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return { id: docRef.id, name, completed: false, completedAt: null };
}

function renameTask(taskId, trimmed) {
  return db.collection(TASKS_COLLECTION).doc(taskId).update({
    name: trimmed,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

function completeTask(taskId, minutes, clips) {
  return db.collection(TASKS_COLLECTION).doc(taskId).update({
    completed: true,
    completedAt: firebase.firestore.FieldValue.serverTimestamp(),
    minutes,
    clips,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

function uncompleteTask(taskId) {
  return db.collection(TASKS_COLLECTION).doc(taskId).update({
    completed: false,
    completedAt: null,
    minutes: firebase.firestore.FieldValue.delete(),
    clips: firebase.firestore.FieldValue.delete(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

// ---- State ----------------------------------------------------------

let nickname = "";
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

// ---- Nickname (setup-row/header-chip toggle, same as Paperclip) --------

function showSetupRow() {
  document.getElementById("abPlayerBar").style.display = "block";
  document.getElementById("abHeaderNicknameWrap").style.display = "none";
}
function showHeaderDisplay() {
  document.getElementById("abPlayerBar").style.display = "none";
  document.getElementById("abHeaderNicknameWrap").style.display = "flex";
  document.getElementById("abHeaderNickname").textContent = nickname;
}

function wireNicknameInput(nicknameChosen) {
  const input = document.getElementById("abNicknameInput");
  const saveBtn = document.getElementById("abNicknameSave");
  const changeLink = document.getElementById("abChangeNickname");
  input.value = nickname;
  if (nicknameChosen) showHeaderDisplay(); else showSetupRow();

  saveBtn.addEventListener("click", async () => {
    const trimmed = input.value.trim().slice(0, 20);
    if (!trimmed) return;
    saveBtn.disabled = true;
    try {
      await saveNickname(trimmed);
      nickname = trimmed;
      showHeaderDisplay();
    } catch (err) {
      console.error("Abbotsford: saveNickname failed", err);
    } finally {
      saveBtn.disabled = false;
    }
  });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") saveBtn.click(); });
  changeLink.addEventListener("click", (e) => {
    e.preventDefault(); // it's a styling convenience, not a real link
    showSetupRow();
    input.focus();
    input.select();
  });
}

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

async function loadDay(dateStr) {
  viewedDate = dateStr;
  updateDateBar();
  statusEl.textContent = "Loading…";
  listEl.innerHTML = "";
  try {
    tasks = await loadTasksForDate(dateStr);
  } catch (err) {
    console.error("Abbotsford: loadTasksForDate failed", err);
    statusEl.textContent = (err && err.code === "failed-precondition")
      ? "This needs a Firestore index — open the browser console for a one-click link to create it."
      : "Could not load this day's tasks.";
    return;
  }
  renderRocks(false);
  renderList();
}

// Un-completing is a plain, reversible undo (an accidental tap shouldn't
// be permanent) — no confirmation, no re-asking for minutes, just clears
// completedAt/minutes/clips back out. COMPLETING a task is the "commit"
// moment the original ask cares about: confirm, then log how long it
// actually took, since that's what turns a checkbox into a real record
// of the day's work rather than a plain to-do list. Both directions
// update optimistically (same "make it satisfying, don't wait on the
// network" reasoning as Paperclip's own completePomodoro()) and roll back
// on a failed write.
async function toggleTask(index) {
  const task = tasks[index];
  const snapshot = { ...task };

  if (task.completed) {
    task.completed = false;
    task.completedAt = null;
    task.minutes = undefined;
    task.clips = undefined;
    renderRocks(false);
    renderList();
    try {
      await uncompleteTask(task.id);
    } catch (err) {
      console.error("Abbotsford: uncompleteTask failed", err);
      Object.assign(task, snapshot);
      renderRocks(false);
      renderList();
      alert("Could not save that — try again.");
    }
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

  const clips = clipsForMinutes(minutes);
  task.completed = true;
  task.completedAt = Date.now();
  task.minutes = minutes;
  task.clips = clips;
  renderRocks(true);
  renderList();
  try {
    await completeTask(task.id, minutes, clips);
  } catch (err) {
    console.error("Abbotsford: completeTask failed", err);
    Object.assign(task, snapshot);
    renderRocks(false);
    renderList();
    alert("Could not save that — try again.");
  }
}

async function editTask(index) {
  const task = tasks[index];
  const newName = prompt("Edit task name", task.name);
  if (newName == null) return; // cancelled
  const trimmed = newName.trim();
  if (!trimmed) return; // don't allow blanking out a task's name entirely
  const previousName = task.name;
  task.name = trimmed;
  renderList();
  try {
    await renameTask(task.id, trimmed);
  } catch (err) {
    console.error("Abbotsford: renameTask failed", err);
    task.name = previousName;
    renderList();
    alert("Could not save that name — try again.");
  }
}

async function addTask() {
  const name = newTaskInput.value.trim();
  if (!name) return;
  newTaskInput.value = "";
  addTaskBtn.disabled = true;
  try {
    const task = await createTask(viewedDate, name);
    tasks.push(task);
    renderRocks(false);
    renderList();
  } catch (err) {
    console.error("Abbotsford: createTask failed", err);
    statusEl.textContent = "Could not add that task — try again.";
  } finally {
    addTaskBtn.disabled = false;
    newTaskInput.focus();
  }
}

function goToDay(dateStr) {
  const today = localDateStr(new Date());
  if (dateStr > today) return; // no peeking into the future
  loadDay(dateStr);
}

function wireControls() {
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
}

// ---- Bootstrap ------------------------------------------------------

async function main() {
  if (!configured) {
    statusEl.textContent = "Not configured yet — see ../vannilaWeatherApp/weatherGame/firebaseConfig.js.";
    return;
  }
  initFirebase();
  await ready;
  if (!uid) {
    statusEl.textContent = "Could not connect.";
    return;
  }

  const profile = await loadOrCreateProfile();
  nickname = profile.nickname;
  wireNicknameInput(profile.nicknameChosen);
  wireControls();

  updateDateBar();
  await loadDay(viewedDate);
}

main().catch((err) => {
  console.error("Abbotsford: main failed", err);
  statusEl.textContent = "Could not load Abbotsford.";
});
