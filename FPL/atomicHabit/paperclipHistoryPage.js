// Paperclip's own day-by-day history — reads Firestore's paperclipDays
// collection for whichever activity is selected. Self-contained, same
// convention as paperclip.js itself: its own sign-in, own small
// escapeHtml/date helpers, no shared state with that page (a separate
// page load). Read-only: this page never writes to Firestore.

const DAYS_LIMIT = 60; // ~2 months back, plenty for a personal daily habit log

const PROFILES_COLLECTION = "paperclipProfiles";
const ACTIVITIES_COLLECTION = "paperclipActivities";
const DAYS_COLLECTION = "paperclipDays";
const BASKET_SIZE = 20;

const configured = typeof firebaseConfig !== "undefined"
  && firebaseConfig.apiKey
  && !firebaseConfig.apiKey.startsWith("REPLACE_ME");

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

// Same local-calendar-day parsing sugarTracking.js/paperclip.js already
// use in this folder — `date` strings are always "YYYY-MM-DD" local days,
// never UTC, so this parses as local midnight rather than going through
// `new Date(dateStr)` (which treats a bare "YYYY-MM-DD" as UTC and can
// shift a day off depending on the viewer's own timezone).
function formatDisplayDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });
}

const statusEl = document.getElementById("aphStatus");
const activitySelectEl = document.getElementById("aphActivitySelect");
const daysCardEl = document.getElementById("aphDaysCard");
const dayListEl = document.getElementById("aphDayList");

function renderHeaderNickname(nickname) {
  if (!nickname) return;
  document.getElementById("ahHeaderNickname").textContent = nickname;
  document.getElementById("ahHeaderNicknameWrap").style.display = "flex";
}

function buildDayRow(day) {
  const pct = Math.round((day.clipsMoved / BASKET_SIZE) * 100);
  return `
    <li class="ah-day-row">
      <span class="ah-day-date">${escapeHtml(formatDisplayDate(day.date))}</span>
      <span class="ah-day-bar-wrap"><span class="ah-day-bar-fill" style="width: ${pct}%;"></span></span>
      <span class="ah-day-count">${day.clipsMoved} / ${BASKET_SIZE}</span>
    </li>
  `;
}

async function loadDaysForActivity(db, activityId) {
  daysCardEl.style.display = "none";
  dayListEl.innerHTML = '<li class="ah-status-note">Loading&hellip;</li>';
  daysCardEl.style.display = "block";
  try {
    const snap = await db.collection(DAYS_COLLECTION)
      .where("activityId", "==", activityId)
      .orderBy("date", "desc")
      .limit(DAYS_LIMIT)
      .get();
    if (snap.empty) {
      dayListEl.innerHTML = '<li class="ah-status-note">No Pomodoros logged for this activity yet.</li>';
      return;
    }
    const days = snap.docs.map((doc) => doc.data());
    dayListEl.innerHTML = days.map(buildDayRow).join("");
  } catch (err) {
    console.error("Paperclip History: loadDaysForActivity failed", err);
    dayListEl.innerHTML = err && err.code === "failed-precondition"
      ? '<li class="ah-status-note">This needs a Firestore index — open the browser console for a one-click link to create it.</li>'
      : '<li class="ah-status-note">Could not load history.</li>';
  }
}

function wireActivitySelect(db) {
  activitySelectEl.addEventListener("change", () => loadDaysForActivity(db, activitySelectEl.value));
}

async function main() {
  if (!configured) {
    statusEl.textContent = "Not configured yet — see ../vannilaWeatherApp/weatherGame/firebaseConfig.js.";
    return;
  }

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  await auth.signInAnonymously();
  const user = await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) return;
      unsubscribe();
      resolve(u);
    });
  });

  const profileDoc = await db.collection(PROFILES_COLLECTION).doc(user.uid).get();
  renderHeaderNickname(profileDoc.exists ? profileDoc.data().nickname : null);

  const activitiesSnap = await db.collection(ACTIVITIES_COLLECTION)
    .where("uid", "==", user.uid)
    .orderBy("createdAt", "asc")
    .get();

  if (activitiesSnap.empty) {
    statusEl.innerHTML = 'No activities yet — create one on <a href="paperclip.html">Paperclip</a> first.';
    return;
  }

  const activities = activitiesSnap.docs.map((doc) => ({ id: doc.id, name: doc.data().name }));
  statusEl.style.display = "none";
  activitySelectEl.style.display = "block";
  activitySelectEl.innerHTML = activities.map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join("");

  const lastActiveId = profileDoc.exists ? profileDoc.data().lastActiveActivityId : null;
  const initialId = (lastActiveId && activities.some((a) => a.id === lastActiveId))
    ? lastActiveId
    : activities[activities.length - 1].id;
  activitySelectEl.value = initialId;

  wireActivitySelect(db);
  await loadDaysForActivity(db, initialId);
}

main().catch((err) => {
  console.error("Paperclip History: main failed", err);
  statusEl.textContent = "Could not load history.";
  statusEl.style.display = "block";
});
