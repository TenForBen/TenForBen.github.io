// Household tracker (householdTracker.html) — master accounts only, linked
// from the search log's header.
//
// Firestore layout (see "Household tracker" in weatherGame/firestore.rules):
//   householdItems/{itemId}  one doc per item: { value, since, by }
//   householdLog/{autoId}    one record per finished state:
//                            { item, value, startAt, endAt, durationSec, startBy, endBy }
// Every change is one transaction: it closes the item's previous state into
// householdLog and sets the new value, so two masters clicking at once can't
// log the same state twice. onSnapshot keeps every open page live.
//
// ADDING AN ITEM: add one entry to HOUSEHOLD_ITEMS below. No rules change is
// needed as long as the id and option values are lowercase letters, digits
// or "_" (max 32 chars). Don't rename an existing id or value: old history
// records keep the old one.

const MASTER_UIDS = ["B0N7TfmkrXTaYjB2TBCVOBVtIhM2", "MsRKlqcPecOBng8SHekRF5YCVFJ3", "WmoVyIkr2eVCtQHMPwoiTnKWZQp1", "M9odxs0JSTPAnFuewYOCB2BEPR03", "n4kv57HGhPZtxOF7UWVlQLVmOOj1"];

const ON_OFF = [["on", "ON"], ["off", "OFF"]];

// stopwatch: show a running clock while the item is "on".
const HOUSEHOLD_ITEMS = [
  { id: "stove", label: "Stove", options: ON_OFF },
  { id: "water", label: "Water", options: ON_OFF, stopwatch: true },
  { id: "power", label: "Power switch (table)", options: ON_OFF },
  { id: "lock", label: "Lock", options: [["inside", "Inside"], ["outside_single", "Outside single"], ["outside_double", "Outside double"]] },
];

const LOG_LIMIT = 300; // newest records loaded; the item filter works within these

const configured = typeof firebaseConfig !== "undefined"
  && firebaseConfig.apiKey
  && !firebaseConfig.apiKey.startsWith("REPLACE_ME");

let db = null;
let myUid = null;
const itemState = {}; // itemId -> { value, since, by }
let logDocs = [];
let filter = "all";

const statusEl = document.getElementById("htStatus");
const itemById = Object.fromEntries(HOUSEHOLD_ITEMS.map((it) => [it.id, it]));

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function pad(n) { return String(n).padStart(2, "0"); }

function formatDuration(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const d = Math.floor(s / 86400);
  const hms = `${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  return d ? `${d}d ${hms}` : hms;
}

function toDate(ts) {
  return ts && ts.toDate ? ts.toDate() : null;
}

function dateTime(ts) {
  const d = toDate(ts);
  return d ? d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "–";
}

function who(uid) {
  if (!uid) return "–";
  return uid === myUid ? "you" : `…${uid.slice(-5)}`;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function itemLabel(id) {
  return itemById[id] ? itemById[id].label : id;
}

function valueLabel(id, value) {
  const opt = itemById[id] && itemById[id].options.find(([v]) => v === value);
  return opt ? opt[1] : value;
}

// ---- Cards --------------------------------------------------------------------

function buildCards() {
  document.getElementById("htItems").innerHTML = HOUSEHOLD_ITEMS.map((it) => `
    <div class="ht-card" data-item="${it.id}">
      <h2>${escapeHtml(it.label)}</h2>
      <div class="ht-radios${it.options.length > 2 ? " ht-radios-stack" : ""}">
        ${it.options.map(([value, label]) => `
          <label><input type="radio" name="${it.id}" value="${value}" />${escapeHtml(label)}</label>`).join("")}
      </div>
      ${it.stopwatch ? `<div class="ht-watch">00:00:00</div>` : ""}
      <div class="ht-meta">Not set yet</div>
    </div>`).join("");

  document.querySelectorAll(".ht-radios input").forEach((input) => {
    input.addEventListener("change", async () => {
      const id = input.name;
      const radios = document.querySelectorAll(`input[name="${id}"]`);
      radios.forEach((r) => { r.disabled = true; });
      try {
        await setItem(id, input.value);
      } catch (err) {
        console.error("Household tracker: write failed", err);
        statusEl.innerHTML = `<span class="ht-error">Could not save ${escapeHtml(itemLabel(id))}: ${escapeHtml(err.message)}</span>`;
        renderCard(id); // put the radios back to the stored value
      } finally {
        radios.forEach((r) => { r.disabled = false; });
      }
    });
  });
}

function renderCard(id) {
  const it = itemById[id];
  const card = document.querySelector(`.ht-card[data-item="${id}"]`);
  const s = itemState[id];
  const value = s ? s.value : null;
  card.classList.toggle("is-on", value === "on");
  card.classList.toggle("is-choice", !!value && it.options !== ON_OFF);
  card.querySelectorAll("input").forEach((r) => { r.checked = r.value === value; });
  card.querySelector(".ht-meta").textContent = s && s.since
    ? `${valueLabel(id, value)} since ${toDate(s.since).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" })} · by ${who(s.by)}`
    : "Not set yet";
}

// ---- Date line + stopwatches ---------------------------------------------------

function tick() {
  const now = new Date();
  document.getElementById("htDate").innerHTML =
    `${now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
     &middot; <b>${now.toLocaleTimeString()}</b>`;

  HOUSEHOLD_ITEMS.filter((it) => it.stopwatch).forEach((it) => {
    const s = itemState[it.id];
    const since = s && toDate(s.since);
    document.querySelector(`.ht-card[data-item="${it.id}"] .ht-watch`).textContent =
      s && s.value === "on" && since ? formatDuration((Date.now() - since.getTime()) / 1000) : "00:00:00";
  });
}

// ---- Writes -------------------------------------------------------------------

async function setItem(id, value) {
  const itemRef = db.collection("householdItems").doc(id);
  const logRef = db.collection("householdLog").doc();
  const now = firebase.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(itemRef);
    const prev = snap.exists ? snap.data() : null;
    if (prev && prev.value === value) return; // someone else already set it

    tx.set(itemRef, { value, since: now, by: myUid });
    if (prev && prev.since) {
      tx.set(logRef, {
        item: id,
        value: prev.value,
        startAt: prev.since,
        endAt: now,
        durationSec: Math.max(0, Math.round((Date.now() - prev.since.toMillis()) / 1000)),
        startBy: prev.by || "",
        endBy: myUid,
      });
    }
  });
}

// ---- History ------------------------------------------------------------------

function buildFilter() {
  const group = document.getElementById("htFilter");
  const buttons = [["all", "All"], ...HOUSEHOLD_ITEMS.map((it) => [it.id, it.label])];
  group.innerHTML = buttons.map(([id, label]) =>
    `<button type="button" class="btn btn-outline-primary${id === filter ? " active" : ""}" data-item="${id}">${escapeHtml(label)}</button>`).join("");
  group.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      filter = btn.dataset.item;
      group.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
      renderLog();
    });
  });
}

function renderLog() {
  const rows = logDocs
    .map((d) => d.data({ serverTimestamps: "estimate" }))
    .filter((r) => filter === "all" || r.item === filter);

  document.getElementById("htBody").innerHTML = rows.map((r) => `<tr>
      <td>${escapeHtml(itemLabel(r.item))}</td>
      <td>${escapeHtml(valueLabel(r.item, r.value))}</td>
      <td>${dateTime(r.startAt)}</td>
      <td>${dateTime(r.endAt)}</td>
      <td><b>${formatDuration(Number(r.durationSec) || 0)}</b></td>
      <td>${who(r.startBy)}${r.endBy && r.endBy !== r.startBy ? ` → ${who(r.endBy)}` : ""}</td>
    </tr>`).join("")
    || `<tr><td colspan="6" class="text-muted">No history yet. A row appears each time an item changes state.</td></tr>`;

  // Today's ON time for switch items (counted by when the ON period started).
  const today = new Date();
  const onToday = rows.filter((r) => r.value === "on" && toDate(r.startAt) && sameDay(toDate(r.startAt), today));
  const onSec = onToday.reduce((sum, r) => sum + (Number(r.durationSec) || 0), 0);
  document.getElementById("htSummary").innerHTML = `
    <div class="ht-tile"><span>Records</span><b>${rows.length}</b></div>
    <div class="ht-tile"><span>ON periods today</span><b>${onToday.length}</b></div>
    <div class="ht-tile"><span>ON time today</span><b>${formatDuration(onSec)}</b></div>`;
}

// ---- Startup ------------------------------------------------------------------

async function main() {
  if (!configured) {
    statusEl.textContent = "Firebase isn't configured.";
    return;
  }
  if (location.protocol === "file:") {
    statusEl.textContent = "This page needs to be served over http(s), not opened from a file.";
    return;
  }
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  const auth = firebase.auth();
  try {
    await auth.signInAnonymously();
    const user = await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((u) => {
        if (!u) return;
        unsubscribe();
        resolve(u);
      });
    });
    myUid = user.uid;
    if (!MASTER_UIDS.includes(myUid)) {
      // Show the uid so a new device/browser can be added to the masters list.
      statusEl.textContent = `The household tracker is only available to master accounts. (This browser's id: ${myUid})`;
      return;
    }
  } catch (err) {
    console.error("Household tracker: sign-in failed", err);
    statusEl.textContent = "Could not sign in to Firebase.";
    return;
  }

  statusEl.textContent = "Live — changes here show up for every master account.";
  document.getElementById("htContent").style.display = "";
  buildCards();
  buildFilter();
  tick();
  setInterval(tick, 1000);

  db.collection("householdItems").onSnapshot((snap) => {
    snap.docs.forEach((d) => { itemState[d.id] = d.data({ serverTimestamps: "estimate" }); });
    HOUSEHOLD_ITEMS.forEach((it) => renderCard(it.id));
    tick();
  }, (err) => {
    console.error("Household tracker: items listen failed", err);
    statusEl.innerHTML = `<span class="ht-error">Could not load items: ${escapeHtml(err.message)}</span>`;
  });

  db.collection("householdLog").orderBy("endAt", "desc").limit(LOG_LIMIT).onSnapshot((snap) => {
    logDocs = snap.docs;
    renderLog();
  }, (err) => {
    console.error("Household tracker: history listen failed", err);
    statusEl.innerHTML = `<span class="ht-error">Could not load history: ${escapeHtml(err.message)}</span>`;
  });
}

main();
