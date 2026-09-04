// Paperclip — a Pomodoro-driven habit tracker in the spirit of Atomic
// Habits' own Trent Dyrsmid example: a paperclip moved from one jar to
// another for every sales call made. Here it's one 11-minute Pomodoro
// per clip, up to 20 clips a day, per activity — a fresh 20 every
// calendar day, not a one-time lifetime total.
//
// Firestore-backed throughout, deliberately NOT localStorage (unlike
// this folder's other habit page, sugarTracking.html) — nickname,
// activities, and daily progress all live in the same Firebase project
// GeoStreak/Time Quiz already use (see ../vannilaWeatherApp/weatherGame/
// firestore.rules' Paperclip section), referenced via
// ../vannilaWeatherApp/weatherGame/firebaseConfig.js rather than
// duplicated — same "reuse, don't copy" approach that folder's own
// checklist/ subfolder documents for the same project.

const POMODORO_SECONDS = 11 * 60;
const BASKET_SIZE = 20;
// Sequential default names for an activity created without one — first
// ever unnamed activity is "Uno", second is "Dos", and so on, based on
// how many activities already exist at creation time. Falls back to a
// plain number past ten rather than maintaining a longer list by hand.
const SPANISH_NUMBERS = ["Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve", "Diez"];

const PROFILES_COLLECTION = "paperclipProfiles";
const ACTIVITIES_COLLECTION = "paperclipActivities";
const DAYS_COLLECTION = "paperclipDays";

const configured = typeof firebaseConfig !== "undefined"
  && firebaseConfig.apiKey
  && !firebaseConfig.apiKey.startsWith("REPLACE_ME");

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

// Local calendar day, not UTC — this is a personal daily habit tool, same
// convention sugarTracking.js already uses in this folder (duplicated
// rather than shared, per this project's no-build-step convention).
function localDateStr(date) {
  return new Intl.DateTimeFormat("en-CA").format(date);
}

function defaultActivityName(existingCount) {
  return SPANISH_NUMBERS[existingCount] || `Activity ${existingCount + 1}`;
}

function randomNickname() {
  return `Player${Math.floor(1000 + Math.random() * 9000)}`;
}

function dayDocId(activityId, dateStr) {
  return `${activityId}_${dateStr}`;
}

function formatTimer(secondsLeft) {
  const s = Math.max(0, Math.ceil(secondsLeft));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
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
    .catch((err) => console.error("Paperclip: anonymous sign-in failed", err));
}

// `nicknameChosen` tells "the player actually saved a name" apart from
// "this is still the auto-generated placeholder" — GeoStreak gets that
// distinction for free from whether its localStorage key was ever
// written at all; here the placeholder itself has to be persisted too
// (firestore.rules never allows an empty nickname), so it needs this
// explicit flag instead.
async function loadOrCreateProfile() {
  const doc = await db.collection(PROFILES_COLLECTION).doc(uid).get();
  if (doc.exists && doc.data().nickname) {
    const d = doc.data();
    return {
      nickname: d.nickname,
      nicknameChosen: !!d.nicknameChosen,
      lastActiveActivityId: d.lastActiveActivityId || null,
    };
  }
  const placeholder = randomNickname();
  await db.collection(PROFILES_COLLECTION).doc(uid).set({
    nickname: placeholder,
    nicknameChosen: false,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return { nickname: placeholder, nicknameChosen: false, lastActiveActivityId: null };
}

// A plain `{merge: true}` set is safe here even though it might only send
// one of the two real fields (nickname vs. lastActiveActivityId) —
// firestore.rules' isValidPaperclipProfile() validates the document as it
// would exist AFTER the merge, not just the bytes sent, so the other
// field (already on the stored doc) still satisfies "always present."
async function saveProfile(fields) {
  try {
    await db.collection(PROFILES_COLLECTION).doc(uid).set({
      ...fields,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error("Paperclip: saveProfile failed", err);
  }
}

async function loadActivities() {
  const snap = await db.collection(ACTIVITIES_COLLECTION)
    .where("uid", "==", uid)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, name: doc.data().name }));
}

async function createActivity(rawName) {
  const trimmed = rawName.trim().slice(0, 40);
  const name = trimmed || defaultActivityName(activities.length);
  const docRef = await db.collection(ACTIVITIES_COLLECTION).add({
    uid,
    name,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  const activity = { id: docRef.id, name };
  activities.push(activity);
  return activity;
}

async function loadClipsMovedToday(activityId) {
  const doc = await db.collection(DAYS_COLLECTION).doc(dayDocId(activityId, localDateStr(new Date()))).get();
  return doc.exists ? (doc.data().clipsMoved || 0) : 0;
}

// FieldValue.increment(1) rather than a read-then-write — same technique
// (and same reasoning) as the Time Quiz tally collections: no read
// needed before the write, and firestore.rules' isValidPaperclipDayUpdate/
// Create() validate the resolved result either way.
function recordClipMoved(activityId) {
  const dateStr = localDateStr(new Date());
  return db.collection(DAYS_COLLECTION).doc(dayDocId(activityId, dateStr)).set({
    uid,
    activityId,
    date: dateStr,
    clipsMoved: firebase.firestore.FieldValue.increment(1),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

// ---- State ----------------------------------------------------------

let nickname = "";
let activities = []; // [{id, name}], oldest first
let activeActivityId = null;
let clipsMovedToday = 0;
let timerInterval = null;
let pomodoroRunning = false;
let pomodoroStartTime = null;

const statusEl = document.getElementById("ahStatus");
const activityBodyEl = document.getElementById("ahActivityBody");
const activityRowEl = document.getElementById("ahActivityRow");
const activitySelectEl = document.getElementById("ahActivitySelect");
const newActivityBtn = document.getElementById("ahNewActivityBtn");
const newActivityForm = document.getElementById("ahNewActivityForm");
const newActivityInput = document.getElementById("ahNewActivityInput");
const newActivityCreateBtn = document.getElementById("ahNewActivityCreateBtn");
const newActivityCancelBtn = document.getElementById("ahNewActivityCancelBtn");
const trackerCard = document.getElementById("ahTrackerCard");
const trackerDateEl = document.getElementById("ahTrackerDate");
const activityNameEl = document.getElementById("ahActivityName");
const basket1CountEl = document.getElementById("ahBasket1Count");
const basket1GridEl = document.getElementById("ahBasket1Grid");
const basket2CountEl = document.getElementById("ahBasket2Count");
const basket2GridEl = document.getElementById("ahBasket2Grid");
const pomodoroAreaEl = document.getElementById("ahPomodoroArea");

// ---- Nickname ---------------------------------------------------------

function showSetupRow() {
  document.getElementById("ahPlayerBar").style.display = "block";
  document.getElementById("ahHeaderNicknameWrap").style.display = "none";
}
function showHeaderDisplay() {
  document.getElementById("ahPlayerBar").style.display = "none";
  document.getElementById("ahHeaderNicknameWrap").style.display = "flex";
  document.getElementById("ahHeaderNickname").textContent = nickname;
}

function wireNicknameInput(nicknameChosen) {
  const input = document.getElementById("ahNicknameInput");
  const saveBtn = document.getElementById("ahNicknameSave");
  const changeLink = document.getElementById("ahChangeNickname");
  input.value = nickname;
  if (nicknameChosen) showHeaderDisplay(); else showSetupRow();

  saveBtn.addEventListener("click", async () => {
    const trimmed = input.value.trim().slice(0, 20);
    if (!trimmed) return;
    saveBtn.disabled = true;
    await saveProfile({ nickname: trimmed, nicknameChosen: true });
    nickname = trimmed;
    saveBtn.disabled = false;
    showHeaderDisplay();
  });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") saveBtn.click(); });
  changeLink.addEventListener("click", (e) => {
    e.preventDefault(); // it's a styling convenience, not a real link
    showSetupRow();
    input.focus();
    input.select();
  });
}

// ---- Baskets + Pomodoro -------------------------------------------------

// `animateNew` highlights only the clip that just landed in basket 2 —
// omitted on a plain reload/switch so every existing clip doesn't replay
// the landing animation each time the tracker re-renders.
function renderBaskets(animateNew) {
  const unfinished = BASKET_SIZE - clipsMovedToday;
  basket1CountEl.textContent = `${unfinished} / ${BASKET_SIZE}`;
  basket2CountEl.textContent = `${clipsMovedToday} / ${BASKET_SIZE}`;
  basket1GridEl.innerHTML = Array.from({ length: unfinished }, () => `<span class="ah-clip">&#128206;</span>`).join("");
  basket2GridEl.innerHTML = Array.from({ length: clipsMovedToday }, (_, i) => {
    const isNewest = animateNew && i === clipsMovedToday - 1;
    return `<span class="ah-clip${isNewest ? " ah-clip-new" : ""}">&#128206;</span>`;
  }).join("");
}

function renderPomodoroArea() {
  if (clipsMovedToday >= BASKET_SIZE) {
    pomodoroAreaEl.innerHTML = `<p class="ah-pomodoro-done">&#127881; All ${BASKET_SIZE} clips moved today &mdash; nice work!</p>`;
    return;
  }
  if (pomodoroRunning) {
    pomodoroAreaEl.innerHTML = `
      <p class="ah-pomodoro-timer" id="ahPomodoroTimer">${formatTimer(POMODORO_SECONDS)}</p>
      <div class="ah-pomodoro-actions">
        <button type="button" id="ahPomodoroCancelBtn" class="ah-btn ah-btn-danger">Cancel</button>
      </div>
    `;
    document.getElementById("ahPomodoroCancelBtn").addEventListener("click", cancelPomodoro);
    return;
  }
  pomodoroAreaEl.innerHTML = `
    <div class="ah-pomodoro-actions">
      <button type="button" id="ahPomodoroStartBtn" class="ah-btn ah-btn-primary">Start Pomodoro (${formatTimer(POMODORO_SECONDS)})</button>
    </div>
  `;
  document.getElementById("ahPomodoroStartBtn").addEventListener("click", startPomodoro);
}

function startPomodoro() {
  pomodoroRunning = true;
  pomodoroStartTime = performance.now();
  renderPomodoroArea();
  clearInterval(timerInterval);
  timerInterval = setInterval(tickPomodoro, 200);
}

function tickPomodoro() {
  const elapsed = (performance.now() - pomodoroStartTime) / 1000;
  const left = POMODORO_SECONDS - elapsed;
  const timerEl = document.getElementById("ahPomodoroTimer");
  if (!timerEl) { clearInterval(timerInterval); return; } // switched activity mid-timer
  if (left <= 0) {
    clearInterval(timerInterval);
    completePomodoro();
    return;
  }
  timerEl.textContent = formatTimer(left);
}

// Stopping early means no clip moves — only an uninterrupted 11 minutes
// counts as the "successful completion" the book's own mechanic rewards.
function cancelPomodoro() {
  clearInterval(timerInterval);
  pomodoroRunning = false;
  renderPomodoroArea();
}

// Optimistic: the clip lands and the write fires in the background,
// rather than making the whole payoff wait on a network round-trip —
// "make it satisfying" is the entire point of this mechanic. Rolled back
// (with a note) only if the write actually fails.
async function completePomodoro() {
  pomodoroRunning = false;
  const activityId = activeActivityId;
  const prevCount = clipsMovedToday;
  clipsMovedToday = Math.min(BASKET_SIZE, clipsMovedToday + 1);
  renderBaskets(true);
  renderPomodoroArea();
  try {
    await recordClipMoved(activityId);
  } catch (err) {
    console.error("Paperclip: recordClipMoved failed", err);
    if (activityId === activeActivityId) { // still looking at the same activity
      clipsMovedToday = prevCount;
      renderBaskets(false);
      renderPomodoroArea();
      statusEl.textContent = "Could not save that Pomodoro — try again.";
      statusEl.style.display = "block";
    }
  }
}

// ---- Activities ---------------------------------------------------------

function renderActivitySelect() {
  activitySelectEl.innerHTML = activities.map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join("");
  activitySelectEl.value = activeActivityId;
}

async function switchActivity(activityId) {
  clearInterval(timerInterval);
  pomodoroRunning = false;
  activeActivityId = activityId;
  activitySelectEl.value = activityId;
  saveProfile({ lastActiveActivityId: activityId }); // fire-and-forget — just remembers where to resume next visit
  await loadAndRenderTracker();
}

async function loadAndRenderTracker() {
  const activity = activities.find((a) => a.id === activeActivityId);
  if (!activity) return;
  trackerCard.style.display = "block";
  activityNameEl.textContent = activity.name;
  trackerDateEl.textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  clipsMovedToday = await loadClipsMovedToday(activeActivityId);
  renderBaskets(false);
  renderPomodoroArea();
}

function wireActivityControls() {
  activitySelectEl.addEventListener("change", () => switchActivity(activitySelectEl.value));

  newActivityBtn.addEventListener("click", () => {
    const opening = newActivityForm.style.display === "none";
    newActivityForm.style.display = opening ? "flex" : "none";
    if (opening) newActivityInput.focus();
  });
  newActivityCancelBtn.addEventListener("click", () => {
    newActivityForm.style.display = "none";
    newActivityInput.value = "";
  });
  newActivityInput.addEventListener("keydown", (e) => { if (e.key === "Enter") newActivityCreateBtn.click(); });
  newActivityCreateBtn.addEventListener("click", async () => {
    newActivityCreateBtn.disabled = true;
    try {
      const activity = await createActivity(newActivityInput.value);
      newActivityInput.value = "";
      newActivityForm.style.display = "none";
      activityRowEl.style.display = "flex";
      renderActivitySelect();
      await switchActivity(activity.id);
    } catch (err) {
      console.error("Paperclip: createActivity failed", err);
      statusEl.textContent = "Could not create that activity — try again.";
      statusEl.style.display = "block";
    } finally {
      newActivityCreateBtn.disabled = false;
    }
  });
}

// No activities yet — the create form is shown directly (no "+ New" to
// click first) rather than presenting an empty, useless picker.
function renderFirstActivityPrompt() {
  activityBodyEl.style.display = "block";
  activityRowEl.style.display = "none";
  newActivityForm.style.display = "flex";
  newActivityInput.placeholder = `Name it, or leave blank for "${defaultActivityName(0)}"`;
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
  wireActivityControls();

  activities = await loadActivities();

  if (activities.length === 0) {
    statusEl.style.display = "none";
    renderFirstActivityPrompt();
    return;
  }

  statusEl.style.display = "none";
  activityBodyEl.style.display = "block";
  renderActivitySelect();
  activeActivityId = (profile.lastActiveActivityId && activities.some((a) => a.id === profile.lastActiveActivityId))
    ? profile.lastActiveActivityId
    : activities[activities.length - 1].id; // most recently created
  activitySelectEl.value = activeActivityId;
  await loadAndRenderTracker();
}

main().catch((err) => {
  console.error("Paperclip: main failed", err);
  if (err && err.code === "failed-precondition") {
    statusEl.textContent = "This needs a Firestore index — open the browser console for a one-click link to create it.";
  } else {
    statusEl.textContent = "Could not load Paperclip.";
  }
  statusEl.style.display = "block";
});
