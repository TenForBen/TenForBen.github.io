// High Altitude Cities — the world's top 35 highest-elevation cities,
// same idea as ../app.js (Southern Hemisphere) with one extra Altitude
// column, plus a mobile card/accordion layout that replaces the table
// below the ha breakpoint (see style.css) so a phone never has to scroll
// sideways through ten columns.
//
// City/Country/Flag/Map/Altitude come from cities.json (static). The
// weather columns come from a snapshot that's either the committed
// weatherData.json (produced by hand-running scrapeWeather.js) or, once
// Refresh has been used in this browser, a live client-side re-fetch
// cached in localStorage. Local Time is the one column that's genuinely
// live, same trick ../app.js uses.
//
// Rows are keyed by `rank`, not `iso2` — several of these cities share a
// country (Bolivia, Colombia and China all appear more than once in the
// top 35), so iso2 can't uniquely identify a row here the way it does on
// the Southern Hemisphere page.

// ---- Small formatting helpers (duplicated from ../app.js — this page
// has no build step to import from another file, same reasoning as
// there) -------------------------------------------------------------

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

function formatAltitude(m) {
  return `${m.toLocaleString("en-US")} m`;
}

// ---- Live re-fetch (the Refresh button) ---------------------------------
const API_KEY = "39a9a737b07b4b703e3d1cd1e231eedc";
const REFRESH_DELAY_MS = 1100;

async function fetchWeatherLive(city) {
  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${API_KEY}`;
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

const LAST_RUN_KEY = "highAltitudeWeather_lastRun";
const PREVIOUS_RUN_KEY = "highAltitudeWeather_previousRun";

let cities = []; // static, from cities.json
let current = { generatedAt: null, byRank: {} }; // what's on screen right now
let previous = null; // the run before `current`, for Compare — null until one exists
let compareOn = false;
let sortKey = "altitude";
let sortDir = -1; // -1 = highest altitude first, matching "Top 35" framing
const openCards = new Set(); // ranks whose mobile card is expanded, survives re-renders

function saveRun(key, run) {
  localStorage.setItem(key, JSON.stringify(run));
}

function loadRun(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

// ---- Row building ----------------------------------------------------

function buildRows() {
  return cities.map((c) => ({ ...c, weather: current.byRank[c.rank] || null }));
}

const COLUMN_SORT_VALUE = {
  city: (r) => r.city.toLowerCase(),
  country: (r) => r.country.toLowerCase(),
  altitude: (r) => r.altitudeMeters,
  map: (r) => r.lat,
  temp: (r) => (r.weather ? r.weather.temp : null),
  localTime: (r) => (r.weather ? nowAtLocation(r.weather.timezone) : null),
  sunrise: (r) => (r.weather ? formatLocalTime(r.weather.sunrise, r.weather.timezone) : null),
  sunset: (r) => (r.weather ? formatLocalTime(r.weather.sunset, r.weather.timezone) : null),
  dayLength: (r) => (r.weather ? r.weather.dayLengthSeconds : null),
};

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

function deltaChip(currentValue, previousValue, formatDelta) {
  if (currentValue == null || previousValue == null) return "";
  const diff = currentValue - previousValue;
  if (diff === 0) return `<span class="sh-delta sh-delta-flat">&bull; no change</span>`;
  const cls = diff > 0 ? "sh-delta-up" : "sh-delta-down";
  const arrow = diff > 0 ? "&#9650;" : "&#9660;";
  return `<span class="sh-delta ${cls}">${arrow} ${formatDelta(diff)}</span>`;
}

// One row's weather, formatted into the 5 cells both the table and the
// card's detail panel need — built once per row, then laid out two ways.
function weatherCells(row) {
  const dash = '<span class="sh-dash">&mdash;</span>';
  const prevWeather = previous ? previous.byRank[row.rank] : null;

  let tempCell = dash;
  let dayLengthCell = dash;
  let sunriseCell = dash;
  let sunsetCell = dash;
  let localTimeCell = dash;

  if (row.weather) {
    const tempText = `${Math.round(row.weather.temp)}&deg;C`;
    tempCell = `<span title="${escapeHtml(row.weather.description)}">${tempText}</span>`;
    dayLengthCell = formatDuration(row.weather.dayLengthSeconds);
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

  return { tempCell, dayLengthCell, sunriseCell, sunsetCell, localTimeCell };
}

function renderTableRow(row) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${row.lat},${row.lon}`;
  const mapCell = `<a href="${mapsUrl}" target="_blank" rel="noopener" title="Open in Google Maps">${formatCoord(row.lat, true)}, ${formatCoord(row.lon, false)}</a>`;
  const { tempCell, dayLengthCell, sunriseCell, sunsetCell, localTimeCell } = weatherCells(row);

  return `
    <tr>
      <td class="sh-flag">${flagEmoji(row.iso2)}</td>
      <td>${escapeHtml(row.city)}</td>
      <td>${escapeHtml(row.country)}</td>
      <td>${formatAltitude(row.altitudeMeters)}</td>
      <td class="sh-map">${mapCell}</td>
      <td>${tempCell}</td>
      <td>${localTimeCell}</td>
      <td>${sunriseCell}</td>
      <td>${sunsetCell}</td>
      <td>${dayLengthCell}</td>
    </tr>
  `;
}

function renderCard(row) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${row.lat},${row.lon}`;
  const mapValue = `<a href="${mapsUrl}" target="_blank" rel="noopener" title="Open in Google Maps">${formatCoord(row.lat, true)}, ${formatCoord(row.lon, false)}</a>`;
  const { tempCell, dayLengthCell, sunriseCell, sunsetCell, localTimeCell } = weatherCells(row);
  const isOpen = openCards.has(row.rank);

  return `
    <div class="ha-card${isOpen ? " ha-card-open" : ""}" data-rank="${row.rank}">
      <div class="ha-card-summary" role="button" tabindex="0" aria-expanded="${isOpen}">
        <span class="ha-card-flag">${flagEmoji(row.iso2)}</span>
        <div class="ha-card-main">
          <div class="ha-card-city">${escapeHtml(row.city)}</div>
          <div class="ha-card-country">${escapeHtml(row.country)}</div>
        </div>
        <div class="ha-card-stats">
          <span>${formatAltitude(row.altitudeMeters)}</span>
          <span>${tempCell}</span>
        </div>
        <span class="ha-card-caret">&#9662;</span>
      </div>
      <div class="ha-card-details">
        <div class="ha-card-detail-row"><span class="ha-card-detail-label">Map</span><span class="ha-card-detail-value">${mapValue}</span></div>
        <div class="ha-card-detail-row"><span class="ha-card-detail-label">Local Time</span><span class="ha-card-detail-value">${localTimeCell}</span></div>
        <div class="ha-card-detail-row"><span class="ha-card-detail-label">Sunrise</span><span class="ha-card-detail-value">${sunriseCell}</span></div>
        <div class="ha-card-detail-row"><span class="ha-card-detail-label">Sunset</span><span class="ha-card-detail-value">${sunsetCell}</span></div>
        <div class="ha-card-detail-row"><span class="ha-card-detail-label">Day Length</span><span class="ha-card-detail-value">${dayLengthCell}</span></div>
      </div>
    </div>
  `;
}

function renderTable() {
  const rows = sortRows(buildRows());

  const tbody = document.getElementById("haBody");
  tbody.innerHTML = rows.map(renderTableRow).join("");

  const cardsWrap = document.getElementById("haCards");
  cardsWrap.innerHTML = rows.map(renderCard).join("");
  cardsWrap.querySelectorAll(".ha-card-summary").forEach((el) => {
    el.addEventListener("click", () => toggleCard(el.closest(".ha-card")));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleCard(el.closest(".ha-card"));
      }
    });
  });

  document.getElementById("haCount").textContent = `${rows.length} cities`;

  document.querySelectorAll("th[data-sort-key]").forEach((th) => {
    const key = th.dataset.sortKey;
    const label = th.dataset.label || th.textContent.replace(/[▲▼]\s*$/u, "").trim();
    th.dataset.label = label;
    th.textContent = key === sortKey ? `${label} ${sortDir === 1 ? "▲" : "▼"}` : label;
  });
}

function toggleCard(cardEl) {
  const rank = Number(cardEl.dataset.rank);
  const nowOpen = !cardEl.classList.contains("ha-card-open");
  cardEl.classList.toggle("ha-card-open", nowOpen);
  cardEl.querySelector(".ha-card-summary").setAttribute("aria-expanded", String(nowOpen));
  if (nowOpen) {
    openCards.add(rank);
  } else {
    openCards.delete(rank);
  }
}

function renderUpdatedNote() {
  document.getElementById("haUpdated").textContent = current.generatedAt
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

const refreshBtn = document.getElementById("haRefresh");
const compareBtn = document.getElementById("haCompare");
const statusEl = document.getElementById("haStatus");

function setCompareEnabled(enabled) {
  compareBtn.disabled = !enabled;
}

refreshBtn.addEventListener("click", async () => {
  refreshBtn.disabled = true;
  compareBtn.disabled = true;
  const freshByRank = {};

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    statusEl.textContent = `Refreshing… ${i + 1}/${cities.length} (${city.city})`;
    try {
      freshByRank[city.rank] = await fetchWeatherLive(city);
    } catch (err) {
      freshByRank[city.rank] = current.byRank[city.rank] || null;
    }
    if (i < cities.length - 1) await sleep(REFRESH_DELAY_MS);
  }

  previous = current;
  current = { generatedAt: Math.floor(Date.now() / 1000), byRank: freshByRank };
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

function startClocks() {
  setInterval(() => {
    document.querySelectorAll(".sh-local-time").forEach((el) => {
      el.textContent = nowAtLocation(Number(el.dataset.tz));
    });
  }, 1000);
}

// ---- Boot ------------------------------------------------------------

function renderError() {
  document.getElementById("haBody").innerHTML =
    '<tr><td colspan="10" class="sh-error">Could not load city/weather data.</td></tr>';
  document.getElementById("haCards").innerHTML =
    '<p class="sh-error">Could not load city/weather data.</p>';
}

fetch("cities.json")
  .then((res) => {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
  })
  .then((loadedCities) => {
    cities = loadedCities;

    const cachedCurrent = loadRun(LAST_RUN_KEY);
    const cachedPrevious = loadRun(PREVIOUS_RUN_KEY);

    const bootWeather = cachedCurrent
      ? Promise.resolve(cachedCurrent)
      : fetch("weatherData.json")
          .then((res) => (res.ok ? res.json() : { generatedAt: null, byRank: {} }))
          .catch(() => ({ generatedAt: null, byRank: {} }));

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
