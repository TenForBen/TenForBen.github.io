// Weather.JS search log viewer (searchLog.html) — master accounts only.
// Reads weatherSearches (written by searchLog.js), newest first, 200 at a
// time. Everyone else gets a "masters only" note; Firestore's rules refuse
// their read anyway (isMaster()).

const PAGE_SIZE = 200;
// Same allowlist as searchLog.js and the history/insights pages; must
// match isMaster() in weatherGame/firestore.rules.
const MASTER_UIDS = ["B0N7TfmkrXTaYjB2TBCVOBVtIhM2", "MsRKlqcPecOBng8SHekRF5YCVFJ3", "WmoVyIkr2eVCtQHMPwoiTnKWZQp1", "M9odxs0JSTPAnFuewYOCB2BEPR03"];

const configured = typeof firebaseConfig !== "undefined"
  && firebaseConfig.apiKey
  && !firebaseConfig.apiKey.startsWith("REPLACE_ME");

let db = null;
let rows = []; // every record loaded so far: { id, ...data }
let lastDoc = null;
let filter = "all"; // "all" | "search" | "history_nav"

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function flagEmoji(iso2) {
  const cc = String(iso2 || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (cc.length !== 2) return "";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function when(r) {
  const date = r.createdAt && r.createdAt.toDate ? r.createdAt.toDate() : null;
  return date ? date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" }) : "";
}

function place(p) {
  return p ? `${flagEmoji(p.country)} ${escapeHtml(p.name)}${p.country ? `, ${escapeHtml(p.country)}` : ""}` : "&ndash;";
}

function mapsLink(lat, lon, text) {
  return `<a href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}" target="_blank" rel="noopener">${text}</a>`;
}

// Short, readable browser + OS from the user agent.
function shortAgent(ua) {
  if (!ua) return "";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Other";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return `${browser}${os ? ` · ${os}` : ""}`;
}

function rowHtml(r) {
  const who = `${escapeHtml(r.nickname || "Anonymous")}<br><span class="sl-muted" title="${escapeHtml(r.uid)}">${escapeHtml((r.uid || "").slice(0, 8))}…</span>`;
  let what;
  let result;
  if (r.type === "history_nav") {
    what = `<span class="sl-badge sl-badge-nav">${escapeHtml(r.method || "jump")}</span><br>${place(r.from)} &rarr; ${place(r.result)}`;
    result = r.distanceKm != null ? `<b>${r.distanceKm.toLocaleString()} km</b> apart` : "&ndash;";
  } else {
    what = `<span class="sl-badge">search</span><br>&ldquo;${escapeHtml(r.query)}&rdquo;`;
    result = r.success
      ? `${place(r.result)}<br><span class="sl-muted">${r.tempC != null ? `${r.tempC}&deg;C` : ""}${r.conditions ? ` &middot; ${escapeHtml(r.conditions)}` : ""}</span>`
      : `<span class="sl-error">${escapeHtml(r.error || "failed")}</span>`;
  }
  const ip = r.ipLocation;
  const ipCell = ip
    ? `${flagEmoji(ip.countryCode)} ${escapeHtml([ip.city, ip.region, ip.country].filter(Boolean).join(", "))}`
      + `${ip.lat != null ? `<br>${mapsLink(ip.lat, ip.lon, `${ip.lat.toFixed(3)}, ${ip.lon.toFixed(3)}`)}` : ""}`
      + `${ip.isp ? `<br><span class="sl-muted">${escapeHtml(ip.isp)}</span>` : ""}`
    : '<span class="sl-muted">&ndash;</span>';
  const gpsCell = r.gps
    ? `${mapsLink(r.gps.lat, r.gps.lon, `${r.gps.lat.toFixed(5)}, ${r.gps.lon.toFixed(5)}`)}<br><span class="sl-muted">&plusmn;${r.gps.accuracyM} m</span>`
    : `<span class="sl-muted">${escapeHtml(r.gpsStatus || "")}</span>`;
  const device = `${escapeHtml(shortAgent(r.userAgent))}<br><span class="sl-muted">${escapeHtml(r.browserTimezone || "")} &middot; ${escapeHtml(r.language || "")} &middot; ${escapeHtml(r.screen || "")}</span>`;
  return `
    <tr>
      <td class="sl-nowrap">${when(r)}</td>
      <td>${who}</td>
      <td>${what}</td>
      <td>${result}</td>
      <td>${ipCell}</td>
      <td>${gpsCell}</td>
      <td>${device}</td>
    </tr>`;
}

function render() {
  const shown = filter === "all" ? rows : rows.filter((r) => r.type === filter);
  const visitors = new Set(rows.map((r) => r.uid)).size;
  const searches = rows.filter((r) => r.type === "search").length;
  const jumps = rows.filter((r) => r.type === "history_nav");
  const dropdown = jumps.filter((r) => r.method === "dropdown").length;
  const withGps = rows.filter((r) => r.gps).length;
  document.getElementById("slSummary").innerHTML = `
    <div class="sl-tile"><span>Loaded records</span><b>${rows.length}</b></div>
    <div class="sl-tile"><span>Visitors</span><b>${visitors}</b></div>
    <div class="sl-tile"><span>Searches</span><b>${searches}</b></div>
    <div class="sl-tile"><span>Distance jumps</span><b>${jumps.length}</b><small>${dropdown} via dropdown</small></div>
    <div class="sl-tile"><span>With GPS</span><b>${withGps}</b><small>${rows.length ? Math.round((withGps / rows.length) * 100) : 0}% allowed location</small></div>`;
  document.getElementById("slBody").innerHTML = shown.length
    ? shown.map(rowHtml).join("")
    : '<tr><td colspan="7" class="sl-muted">Nothing logged yet.</td></tr>';
}

async function loadMore() {
  const btn = document.getElementById("slMore");
  btn.disabled = true;
  try {
    let query = db.collection("weatherSearches").orderBy("createdAt", "desc").limit(PAGE_SIZE);
    if (lastDoc) query = query.startAfter(lastDoc);
    const snap = await query.get();
    rows = rows.concat(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    if (snap.docs.length) lastDoc = snap.docs[snap.docs.length - 1];
    btn.style.display = snap.docs.length === PAGE_SIZE ? "" : "none";
    render();
    document.getElementById("slStatus").textContent = `Newest first. ${rows.length} record${rows.length === 1 ? "" : "s"} loaded.`;
  } catch (err) {
    console.error("Search log: load failed", err);
    document.getElementById("slStatus").textContent = err && err.code === "permission-denied"
      ? "Firestore refused the read — publish the updated weatherGame/firestore.rules (weatherSearches section)."
      : "Could not load the search log.";
  }
  btn.disabled = false;
}

function csvValue(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Every loaded record, every field, flattened one level.
function exportCsv() {
  const flat = rows.map((r) => {
    const out = { createdAt: r.createdAt && r.createdAt.toDate ? r.createdAt.toDate().toISOString() : "" };
    Object.entries(r).forEach(([k, v]) => {
      if (k === "createdAt") return;
      if (v && typeof v === "object") Object.entries(v).forEach(([k2, v2]) => { out[`${k}.${k2}`] = v2; });
      else out[k] = v;
    });
    return out;
  });
  const headers = [...new Set(flat.flatMap((o) => Object.keys(o)))];
  const csv = [headers.join(","), ...flat.map((o) => headers.map((h) => csvValue(o[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `weather-search-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function main() {
  const statusEl = document.getElementById("slStatus");
  if (!configured) {
    statusEl.textContent = "Not configured — see weatherGame/firebaseConfig.js.";
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
    if (!MASTER_UIDS.includes(user.uid)) {
      statusEl.textContent = "The search log is only available to master accounts.";
      return;
    }
    document.getElementById("slControls").style.display = "";
    document.querySelectorAll("#slFilter button").forEach((btn) => {
      btn.addEventListener("click", () => {
        filter = btn.dataset.type;
        document.querySelectorAll("#slFilter button").forEach((b) => b.classList.toggle("active", b === btn));
        render();
      });
    });
    document.getElementById("slMore").addEventListener("click", loadMore);
    document.getElementById("slExport").addEventListener("click", exportCsv);
    await loadMore();
  } catch (err) {
    console.error("Search log: sign-in failed", err);
    statusEl.textContent = "Could not sign in to Firebase.";
  }
}

main();
