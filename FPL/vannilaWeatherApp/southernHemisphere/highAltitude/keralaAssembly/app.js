// Kerala Legislative Assembly — all 140 seats with the 2026 winner and each
// seat's current weather. Same idea and same table/card machinery as
// ../mangalaExpress/app.js, with Station/State swapped for
// Constituency/District plus MLA and Alliance columns. Local Time isn't a
// column here: every seat is IST, so it's one clock above the table.
//
// Seat/District/MLA/Alliance/Map/Altitude come from seats.json (static).
// The weather columns come from a snapshot that's either the committed
// weatherData.json (produced by scrapeWeather.js) or, once "Get current
// weather" has been used in this browser, a live client-side re-fetch
// cached in localStorage.
//
// Rows are keyed by `no`, the official constituency number.

// ---- Small formatting helpers (duplicated from ../mangalaExpress/app.js —
// no build step to import from another file, same reasoning as there) ----

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

function allianceBadge(row) {
  const cls = `ka-${row.alliance.toLowerCase()}`;
  return `<span class="ka-badge ${cls}">${escapeHtml(row.alliance)}</span><span class="ka-party">${escapeHtml(row.party)}</span>`;
}

// ---- Live re-fetch (the "Get current weather" button) --------------------
const API_KEY = "39a9a737b07b4b703e3d1cd1e231eedc";
const REFRESH_DELAY_MS = 1100; // 140 seats, so about 2.5 minutes a run

async function fetchWeatherLive(seat) {
  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${seat.lat}&lon=${seat.lon}&units=metric&appid=${API_KEY}`;
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

const LAST_RUN_KEY = "keralaAssemblyWeather_lastRun";
const PREVIOUS_RUN_KEY = "keralaAssemblyWeather_previousRun";
const ALLIANCES = ["UDF", "LDF", "NDA"];

let seats = []; // static, from seats.json
let current = { generatedAt: null, byNo: {} }; // what's on screen right now
let previous = null; // the run before `current`, for Compare — null until one exists
let compareOn = false;
let sortKey = "no";
let sortDir = 1; // seat number order, north (Manjeshwaram) to south (Neyyattinkara)
let allianceFilter = ""; // "" = all
let districtFilter = ""; // "" = all
const openCards = new Set(); // seat numbers whose mobile card is expanded, survives re-renders

function saveRun(key, run) {
  try {
    localStorage.setItem(key, JSON.stringify(run));
  } catch (err) { /* private mode or full storage: just don't cache */ }
}

function loadRun(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

// ---- Row building ----------------------------------------------------

function buildRows() {
  return seats
    .filter((s) => (!allianceFilter || s.alliance === allianceFilter) && (!districtFilter || s.district === districtFilter))
    .map((s) => ({ ...s, weather: current.byNo[s.no] || null }));
}

const COLUMN_SORT_VALUE = {
  no: (r) => r.no,
  constituency: (r) => r.constituency.toLowerCase(),
  district: (r) => r.district.toLowerCase(),
  winner: (r) => r.winner.toLowerCase(),
  alliance: (r) => `${r.alliance} ${r.party}`,
  altitude: (r) => r.altitudeMeters,
  map: (r) => r.lat,
  temp: (r) => (r.weather ? r.weather.temp : null),
  sunrise: (r) => (r.weather ? formatLocalTime(r.weather.sunrise, r.weather.timezone) : null),
  sunset: (r) => (r.weather ? formatLocalTime(r.weather.sunset, r.weather.timezone) : null),
  dayLength: (r) => (r.weather ? r.weather.dayLengthSeconds : null),
};

function sortRows(rows) {
  const valueOf = COLUMN_SORT_VALUE[sortKey];
  return [...rows].sort((a, b) => {
    const va = valueOf(a);
    const vb = valueOf(b);
    if (va == null && vb == null) return a.no - b.no;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (va < vb) return -1 * sortDir;
    if (va > vb) return 1 * sortDir;
    return a.no - b.no; // ties stay in seat order
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

// One row's weather, formatted into the 4 cells both the table and the
// card's detail panel need — built once per row, then laid out two ways.
function weatherCells(row) {
  const dash = '<span class="sh-dash">&mdash;</span>';
  const prevWeather = previous ? previous.byNo[row.no] : null;

  let tempCell = dash;
  let dayLengthCell = dash;
  let sunriseCell = dash;
  let sunsetCell = dash;

  if (row.weather) {
    tempCell = `<span title="${escapeHtml(row.weather.description)}">${Math.round(row.weather.temp)}&deg;C</span>`;
    dayLengthCell = formatDuration(row.weather.dayLengthSeconds);
    sunriseCell = formatLocalTime(row.weather.sunrise, row.weather.timezone);
    sunsetCell = formatLocalTime(row.weather.sunset, row.weather.timezone);

    if (compareOn && prevWeather) {
      tempCell += deltaChip(row.weather.temp, prevWeather.temp, (d) => `${d > 0 ? "+" : ""}${d.toFixed(1)}&deg;C`);
      dayLengthCell += deltaChip(row.weather.dayLengthSeconds, prevWeather.dayLengthSeconds, (d) => formatDuration(d));
    } else if (compareOn && !prevWeather) {
      tempCell += `<span class="sh-delta sh-delta-flat">no prior data</span>`;
    }
  }

  return { tempCell, dayLengthCell, sunriseCell, sunsetCell };
}

function mapLink(row) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${row.lat},${row.lon}`;
  return `<a href="${mapsUrl}" target="_blank" rel="noopener" title="Open in Google Maps">${formatCoord(row.lat, true)}, ${formatCoord(row.lon, false)}</a>`;
}

function renderTableRow(row) {
  const { tempCell, dayLengthCell, sunriseCell, sunsetCell } = weatherCells(row);
  return `
    <tr>
      <td>${row.no}</td>
      <td>${escapeHtml(row.constituency)}</td>
      <td>${escapeHtml(row.district)}</td>
      <td>${escapeHtml(row.winner)}</td>
      <td>${allianceBadge(row)}</td>
      <td>${formatAltitude(row.altitudeMeters)}</td>
      <td class="sh-map">${mapLink(row)}</td>
      <td>${tempCell}</td>
      <td>${sunriseCell}</td>
      <td>${sunsetCell}</td>
      <td>${dayLengthCell}</td>
    </tr>
  `;
}

function renderCard(row) {
  const { tempCell, dayLengthCell, sunriseCell, sunsetCell } = weatherCells(row);
  const isOpen = openCards.has(row.no);

  return `
    <div class="ha-card${isOpen ? " ha-card-open" : ""}" data-no="${row.no}">
      <div class="ha-card-summary" role="button" tabindex="0" aria-expanded="${isOpen}">
        <div class="ha-card-main">
          <div class="ha-card-city">${row.no}. ${escapeHtml(row.constituency)}</div>
          <div class="ha-card-country">${escapeHtml(row.district)}</div>
        </div>
        <div class="ha-card-stats">
          <span class="ka-badge ka-${row.alliance.toLowerCase()}">${escapeHtml(row.alliance)}</span>
          <span>${tempCell}</span>
        </div>
        <span class="ha-card-caret">&#9662;</span>
      </div>
      <div class="ha-card-details">
        <div class="ha-card-detail-row"><span class="ha-card-detail-label">MLA</span><span class="ha-card-detail-value">${escapeHtml(row.winner)}</span></div>
        <div class="ha-card-detail-row"><span class="ha-card-detail-label">Party</span><span class="ha-card-detail-value">${escapeHtml(row.party)} (${escapeHtml(row.alliance)})</span></div>
        <div class="ha-card-detail-row"><span class="ha-card-detail-label">Altitude</span><span class="ha-card-detail-value">${formatAltitude(row.altitudeMeters)}</span></div>
        <div class="ha-card-detail-row"><span class="ha-card-detail-label">Map</span><span class="ha-card-detail-value">${mapLink(row)}</span></div>
        <div class="ha-card-detail-row"><span class="ha-card-detail-label">Sunrise</span><span class="ha-card-detail-value">${sunriseCell}</span></div>
        <div class="ha-card-detail-row"><span class="ha-card-detail-label">Sunset</span><span class="ha-card-detail-value">${sunsetCell}</span></div>
        <div class="ha-card-detail-row"><span class="ha-card-detail-label">Day Length</span><span class="ha-card-detail-value">${dayLengthCell}</span></div>
      </div>
    </div>
  `;
}

function renderTable() {
  const rows = sortRows(buildRows());

  const tbody = document.getElementById("kaBody");
  tbody.innerHTML = rows.length
    ? rows.map(renderTableRow).join("")
    : '<tr><td colspan="11" class="sh-loading">No seats match these filters.</td></tr>';

  const cardsWrap = document.getElementById("kaCards");
  cardsWrap.innerHTML = rows.length
    ? rows.map(renderCard).join("")
    : '<p class="sh-loading">No seats match these filters.</p>';
  cardsWrap.querySelectorAll(".ha-card-summary").forEach((el) => {
    el.addEventListener("click", () => toggleCard(el.closest(".ha-card")));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleCard(el.closest(".ha-card"));
      }
    });
  });

  document.getElementById("kaCount").textContent = rows.length === seats.length
    ? `${seats.length} seats`
    : `${rows.length} of ${seats.length} seats`;

  document.querySelectorAll("th[data-sort-key]").forEach((th) => {
    const key = th.dataset.sortKey;
    const label = th.dataset.label || th.textContent.replace(/[▲▼]\s*$/u, "").trim();
    th.dataset.label = label;
    th.textContent = key === sortKey ? `${label} ${sortDir === 1 ? "▲" : "▼"}` : label;
  });
}

function toggleCard(cardEl) {
  const no = Number(cardEl.dataset.no);
  const nowOpen = !cardEl.classList.contains("ha-card-open");
  cardEl.classList.toggle("ha-card-open", nowOpen);
  cardEl.querySelector(".ha-card-summary").setAttribute("aria-expanded", String(nowOpen));
  if (nowOpen) {
    openCards.add(no);
  } else {
    openCards.delete(no);
  }
}

function renderUpdatedNote() {
  document.getElementById("kaUpdated").textContent = current.generatedAt
    ? `Weather snapshot from ${formatAgo(current.generatedAt)}`
    : "No weather snapshot yet — click Get current weather or run scrapeWeather.js";
}

// ---- Filters -------------------------------------------------------------

function renderFilters() {
  const counts = Object.fromEntries(ALLIANCES.map((a) => [a, seats.filter((s) => s.alliance === a).length]));
  const chips = [{ key: "", label: `All ${seats.length}` }, ...ALLIANCES.map((a) => ({ key: a, label: `${a} ${counts[a]}` }))];
  const chipsEl = document.getElementById("kaAllianceChips");
  chipsEl.innerHTML = chips.map((c) =>
    `<button type="button" class="ka-chip${c.key === allianceFilter ? " ka-chip-active" : ""}" data-alliance="${c.key}">${c.label}</button>`
  ).join("");
  chipsEl.querySelectorAll(".ka-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      allianceFilter = btn.dataset.alliance;
      chipsEl.querySelectorAll(".ka-chip").forEach((b) => b.classList.toggle("ka-chip-active", b === btn));
      renderTable();
    });
  });

  // Districts in seat order (north to south), not alphabetical.
  const districts = [...new Set(seats.map((s) => s.district))];
  const select = document.getElementById("kaDistrict");
  select.innerHTML = '<option value="">All districts</option>' +
    districts.map((d) => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join("");
  select.addEventListener("change", () => {
    districtFilter = select.value;
    renderTable();
  });
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

// ---- Get current weather (client-side re-scrape) ---------------------------
// Always fetches all 140 seats, whatever the filters show, so the cached
// run stays complete.

const refreshBtn = document.getElementById("kaRefresh");
const compareBtn = document.getElementById("kaCompare");
const statusEl = document.getElementById("kaStatus");

function setCompareEnabled(enabled) {
  compareBtn.disabled = !enabled;
}

refreshBtn.addEventListener("click", async () => {
  refreshBtn.disabled = true;
  compareBtn.disabled = true;
  const freshByNo = {};
  let failures = 0;

  for (let i = 0; i < seats.length; i++) {
    const seat = seats[i];
    statusEl.textContent = `Fetching… ${i + 1}/${seats.length} (${seat.constituency})`;
    try {
      freshByNo[seat.no] = await fetchWeatherLive(seat);
    } catch (err) {
      failures += 1;
      freshByNo[seat.no] = current.byNo[seat.no] || null;
    }
    if (i < seats.length - 1) await sleep(REFRESH_DELAY_MS);
  }

  previous = current;
  current = { generatedAt: Math.floor(Date.now() / 1000), byNo: freshByNo };
  saveRun(PREVIOUS_RUN_KEY, previous);
  saveRun(LAST_RUN_KEY, current);

  statusEl.textContent = failures ? `${failures} seat(s) failed — kept their previous reading` : "";
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

// ---- Live IST clock ------------------------------------------------------

function startClock() {
  const clock = document.getElementById("kaClock");
  const tick = () => { clock.textContent = nowAtLocation(Number(clock.dataset.tz)); };
  tick();
  setInterval(tick, 1000);
}

// ---- Boot ------------------------------------------------------------

function renderError() {
  document.getElementById("kaBody").innerHTML =
    '<tr><td colspan="11" class="sh-error">Could not load seat/weather data.</td></tr>';
  document.getElementById("kaCards").innerHTML =
    '<p class="sh-error">Could not load seat/weather data.</p>';
}

startClock();

fetch("seats.json")
  .then((res) => {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
  })
  .then((loadedSeats) => {
    seats = loadedSeats;

    const cachedCurrent = loadRun(LAST_RUN_KEY);
    const cachedPrevious = loadRun(PREVIOUS_RUN_KEY);

    // Whichever is newer: this browser's last live fetch or the committed
    // snapshot (which a later scrapeWeather.js run may have refreshed).
    const committed = fetch("weatherData.json")
      .then((res) => (res.ok ? res.json() : { generatedAt: null, byNo: {} }))
      .catch(() => ({ generatedAt: null, byNo: {} }));

    return committed.then((snapshot) => {
      const useCached = cachedCurrent && (cachedCurrent.generatedAt || 0) >= (snapshot.generatedAt || 0);
      current = useCached ? cachedCurrent : snapshot;
      previous = useCached ? cachedPrevious : (cachedCurrent || null);
      setCompareEnabled(!!previous);
      renderFilters();
      renderUpdatedNote();
      renderTable();
    });
  })
  .catch(renderError);
