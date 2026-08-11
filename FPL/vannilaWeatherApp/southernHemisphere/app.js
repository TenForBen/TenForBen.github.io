// Southern Hemisphere Weather.
// Country | Capital | Flag | Map come from countries.json (static). The
// weather columns come from a "current" snapshot that's either the
// committed weatherData.json (produced by hand-running scrapeWeather.js —
// see that file and the README) or, once the Refresh button has been used
// in this browser, a live client-side re-fetch cached in localStorage.
// Local Time is the one column that's genuinely live: derived from the
// browser clock plus each country's stored timezone offset, ticking every
// second regardless of how stale the rest of the snapshot is.

// ---- Small formatting helpers (same techniques ui.js uses for the main
// Weather.JS app; duplicated here rather than shared, since this page has
// no build step to import from another file) ---------------------------

function flagEmoji(iso2) {
  const cc = String(iso2 || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (cc.length !== 2) return "";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function nowAtLocation(tzOffsetSeconds) {
  const d = new Date(Date.now() + tzOffsetSeconds * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

function formatLocalTime(unixSeconds, tzOffsetSeconds) {
  const d = new Date((unixSeconds + tzOffsetSeconds) * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

function formatDuration(totalSeconds) {
  const sign = totalSeconds < 0 ? "-" : "";
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = Math.floor(abs % 60);
  const p = (n) => String(n).padStart(2, "0");
  return `${sign}${p(h)}:${p(m)}:${p(s)}`;
}

// Signed decimal degrees -> "8.84° S" / "13.29° E", same N/S-E/W convention
// ui.js's convertToDegreesMinutes() uses for the main app's coordinates.
function formatCoord(value, isLatitude) {
  const direction = isLatitude
    ? (value >= 0 ? "N" : "S")
    : (value >= 0 ? "E" : "W");
  return `${Math.abs(value).toFixed(2)}&deg; ${direction}`;
}

function formatAgo(unixSeconds) {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} d ago`;
}

// ---- Live re-fetch (the Refresh button's "run the scraper again") ------
// A page in the browser can't invoke scrapeWeather.js — that's a Node
// script with filesystem access, and browsers can't shell out to one for
// obvious security reasons. This is the client-side equivalent: the same
// OpenWeatherMap endpoint/key ../fetch.js and scrapeWeather.js both use,
// called directly from here instead. It only updates what's on screen (via
// localStorage) — it never touches the committed weatherData.json, which
// stays whatever the last hand-run of scrapeWeather.js + a commit left it.
const API_KEY = "39a9a737b07b4b703e3d1cd1e231eedc";
const REFRESH_DELAY_MS = 1100; // same OpenWeather free-tier rate-limit spacing scrapeWeather.js uses

async function fetchWeatherLive(country) {
  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${country.lat}&lon=${country.lon}&units=metric&appid=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return {
    temp: data.main.temp,
    description: data.weather[0] ? data.weather[0].description : "",
    timezone: data.timezone,
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
    dayLengthSeconds: data.sys.sunset - data.sys.sunrise,
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---- State ---------------------------------------------------------------

const LAST_RUN_KEY = "southernHemisphereWeather_lastRun";
const PREVIOUS_RUN_KEY = "southernHemisphereWeather_previousRun";

let countries = []; // static, from countries.json
let current = { generatedAt: null, byIso2: {} }; // what's on screen right now
let previous = null; // the run before `current`, for Compare — null until one exists
let compareOn = false;
let sortKey = "country";
let sortDir = 1; // 1 = ascending, -1 = descending

function saveRun(key, run) {
  localStorage.setItem(key, JSON.stringify(run));
}

function loadRun(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

// ---- Row building ----------------------------------------------------

// One row = a country plus whatever weather (possibly none) is on record
// for it right now.
function buildRows() {
  return countries.map((c) => ({ ...c, weather: current.byIso2[c.iso2] || null }));
}

const COLUMN_SORT_VALUE = {
  country: (r) => r.country.toLowerCase(),
  capital: (r) => r.capital.toLowerCase(),
  map: (r) => r.lat,
  temp: (r) => (r.weather ? r.weather.temp : null),
  localTime: (r) => (r.weather ? nowAtLocation(r.weather.timezone) : null),
  sunrise: (r) => (r.weather ? formatLocalTime(r.weather.sunrise, r.weather.timezone) : null),
  sunset: (r) => (r.weather ? formatLocalTime(r.weather.sunset, r.weather.timezone) : null),
  dayLength: (r) => (r.weather ? r.weather.dayLengthSeconds : null),
};

// Rows with no weather on record sort to the bottom regardless of
// direction, rather than colliding with real 0/"" values.
function sortRows(rows) {
  const valueOf = COLUMN_SORT_VALUE[sortKey];
  return [...rows].sort((a, b) => {
    const va = valueOf(a);
    const vb = valueOf(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (va < vb) return -1 * sortDir;
    if (va > vb) return 1 * sortDir;
    return 0;
  });
}

// Delta chip for Compare mode: ▲/▼ plus the signed difference, coloured by
// direction only (not by whether that direction is "good") — a day getting
// longer isn't better than shorter, it's just different, so the same
// green-up/red-down/grey-flat scheme is used for both temp and day length.
function deltaChip(currentValue, previousValue, formatDelta) {
  if (currentValue == null || previousValue == null) return "";
  const diff = currentValue - previousValue;
  if (diff === 0) return `<span class="sh-delta sh-delta-flat">&bull; no change</span>`;
  const cls = diff > 0 ? "sh-delta-up" : "sh-delta-down";
  const arrow = diff > 0 ? "&#9650;" : "&#9660;";
  return `<span class="sh-delta ${cls}">${arrow} ${formatDelta(diff)}</span>`;
}

function renderRow(row) {
  const dash = '<span class="sh-dash">&mdash;</span>';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${row.lat},${row.lon}`;
  const mapCell = `<a href="${mapsUrl}" target="_blank" rel="noopener" title="Open in Google Maps">${formatCoord(row.lat, true)}, ${formatCoord(row.lon, false)}</a>`;

  const prevWeather = previous ? previous.byIso2[row.iso2] : null;

  let tempCell = dash;
  let dayLengthCell = dash;
  let sunriseCell = dash;
  let sunsetCell = dash;
  let localTimeCell = dash;

  if (row.weather) {
    const tempText = `${Math.round(row.weather.temp)}&deg;C`;
    const dayLengthText = formatDuration(row.weather.dayLengthSeconds);

    tempCell = `<span title="${escapeHtml(row.weather.description)}">${tempText}</span>`;
    dayLengthCell = dayLengthText;
    sunriseCell = formatLocalTime(row.weather.sunrise, row.weather.timezone);
    sunsetCell = formatLocalTime(row.weather.sunset, row.weather.timezone);
    localTimeCell = `<span class="sh-local-time" data-tz="${row.weather.timezone}">${nowAtLocation(row.weather.timezone)}</span>`;

    if (compareOn && prevWeather) {
      tempCell += deltaChip(row.weather.temp, prevWeather.temp, (d) => `${d > 0 ? "+" : ""}${d.toFixed(1)}&deg;C`);
      dayLengthCell += deltaChip(row.weather.dayLengthSeconds, prevWeather.dayLengthSeconds, (d) => formatDuration(d));
    } else if (compareOn && !prevWeather) {
      tempCell += `<span class="sh-delta sh-delta-flat">no prior data</span>`;
    }
  }

  return `
    <tr>
      <td>${escapeHtml(row.country)}</td>
      <td>${escapeHtml(row.capital)}</td>
      <td class="sh-flag">${flagEmoji(row.iso2)}</td>
      <td class="sh-map">${mapCell}</td>
      <td>${tempCell}</td>
      <td>${localTimeCell}</td>
      <td>${sunriseCell}</td>
      <td>${sunsetCell}</td>
      <td>${dayLengthCell}</td>
    </tr>
  `;
}

function renderTable() {
  const tbody = document.getElementById("shBody");
  const rows = sortRows(buildRows());
  tbody.innerHTML = rows.map(renderRow).join("");
  document.getElementById("shCount").textContent = `${rows.length} countries`;

  document.querySelectorAll("th[data-sort-key]").forEach((th) => {
    const key = th.dataset.sortKey;
    const label = th.dataset.label || th.textContent.replace(/[▲▼]\s*$/u, "").trim();
    th.dataset.label = label; // remember the plain label across re-renders
    th.textContent = key === sortKey ? `${label} ${sortDir === 1 ? "▲" : "▼"}` : label;
  });
}

function renderUpdatedNote() {
  document.getElementById("shUpdated").textContent = current.generatedAt
    ? `Weather snapshot from ${formatAgo(current.generatedAt)}`
    : "No weather snapshot yet — click Refresh or run scrapeWeather.js";
}

// ---- Sorting -----------------------------------------------------------

document.querySelectorAll("th[data-sort-key]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sortKey;
    if (key === sortKey) {
      sortDir *= -1;
    } else {
      sortKey = key;
      sortDir = 1;
    }
    renderTable();
  });
});

// ---- Refresh (client-side re-scrape) ------------------------------------

const refreshBtn = document.getElementById("shRefresh");
const compareBtn = document.getElementById("shCompare");
const statusEl = document.getElementById("shStatus");

function setCompareEnabled(enabled) {
  compareBtn.disabled = !enabled;
}

refreshBtn.addEventListener("click", async () => {
  refreshBtn.disabled = true;
  compareBtn.disabled = true;
  const freshByIso2 = {};

  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    statusEl.textContent = `Refreshing… ${i + 1}/${countries.length} (${country.country})`;
    try {
      freshByIso2[country.iso2] = await fetchWeatherLive(country);
    } catch (err) {
      // Keep whatever this country had before rather than blanking its row.
      freshByIso2[country.iso2] = current.byIso2[country.iso2] || null;
    }
    if (i < countries.length - 1) await sleep(REFRESH_DELAY_MS);
  }

  previous = current;
  current = { generatedAt: Math.floor(Date.now() / 1000), byIso2: freshByIso2 };
  saveRun(PREVIOUS_RUN_KEY, previous);
  saveRun(LAST_RUN_KEY, current);

  statusEl.textContent = "";
  refreshBtn.disabled = false;
  setCompareEnabled(true);
  renderUpdatedNote();
  renderTable();
});

// ---- Compare -------------------------------------------------------------

compareBtn.addEventListener("click", () => {
  compareOn = !compareOn;
  compareBtn.textContent = compareOn ? "⇆ Hide changes" : "⇆ Compare to last run";
  compareBtn.classList.toggle("sh-btn-active", compareOn);
  renderTable();
});

// ---- Live local-time ticking --------------------------------------------
// One shared interval drives every .sh-local-time cell currently in the
// DOM, re-queried fresh each tick so it survives table re-renders from
// sorting/refreshing/comparing without needing to be restarted.
function startClocks() {
  setInterval(() => {
    document.querySelectorAll(".sh-local-time").forEach((el) => {
      el.textContent = nowAtLocation(Number(el.dataset.tz));
    });
  }, 1000);
}

// ---- Boot ------------------------------------------------------------

function renderError() {
  document.getElementById("shBody").innerHTML =
    '<tr><td colspan="9" class="sh-error">Could not load country/weather data.</td></tr>';
}

fetch("countries.json")
  .then((res) => {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
  })
  .then((loadedCountries) => {
    countries = loadedCountries;

    // Prefer whatever's cached from a previous Refresh in this browser —
    // it's newer than the committed snapshot by definition. Fall back to
    // weatherData.json (optional: doesn't exist until scrapeWeather.js has
    // been run at least once), then to an empty snapshot either way.
    const cachedCurrent = loadRun(LAST_RUN_KEY);
    const cachedPrevious = loadRun(PREVIOUS_RUN_KEY);

    const bootWeather = cachedCurrent
      ? Promise.resolve(cachedCurrent)
      : fetch("weatherData.json")
          .then((res) => (res.ok ? res.json() : { generatedAt: null, byIso2: {} }))
          .catch(() => ({ generatedAt: null, byIso2: {} }));

    return bootWeather.then((weather) => {
      current = weather;
      previous = cachedPrevious;
      setCompareEnabled(!!previous);
      renderUpdatedNote();
      renderTable();
      startClocks();
    });
  })
  .catch(renderError);
