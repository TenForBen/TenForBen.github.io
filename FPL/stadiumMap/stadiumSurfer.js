// Stadium Surfer — every visited stadium from stadiums.json (the same file
// the map uses) as a card: Wikipedia photo, short description, capacity,
// opening year, city and flag. Search, country filter and sort all work
// on the loaded list; nothing is fetched per card. Current weather for
// every stadium comes from Open-Meteo in one request after the cards are
// up (free, no key), and fills in the corner of each card.

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function flagEmoji(iso2) {
  const cc = String(iso2 || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (cc.length !== 2) return "";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function wikiUrl(title) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

let stadiums = [];
let weatherById = {}; // id -> { temp, code, isDay }, empty until Open-Meteo answers

// WMO weather codes (what Open-Meteo returns) -> label, day icon, night icon.
const WMO = [
  [[0], "clear", "\u2600\ufe0f", "\ud83c\udf19"],
  [[1], "mainly clear", "\ud83c\udf24\ufe0f", "\ud83c\udf19"],
  [[2], "partly cloudy", "\u26c5", "\u2601\ufe0f"],
  [[3], "overcast", "\u2601\ufe0f", "\u2601\ufe0f"],
  [[45, 48], "fog", "\ud83c\udf2b\ufe0f", "\ud83c\udf2b\ufe0f"],
  [[51, 53, 55, 56, 57], "drizzle", "\ud83c\udf26\ufe0f", "\ud83c\udf27\ufe0f"],
  [[61, 63, 65, 66, 67, 80, 81, 82], "rain", "\ud83c\udf27\ufe0f", "\ud83c\udf27\ufe0f"],
  [[71, 73, 75, 77, 85, 86], "snow", "\ud83c\udf28\ufe0f", "\ud83c\udf28\ufe0f"],
  [[95, 96, 99], "thunderstorm", "\u26c8\ufe0f", "\u26c8\ufe0f"],
];

function describeWeather(w) {
  const row = WMO.find(([codes]) => codes.includes(w.code));
  if (!row) return { label: "", icon: "" };
  return { label: row[1], icon: w.isDay ? row[2] : row[3] };
}

// One Open-Meteo call for every stadium: it takes comma-separated
// latitude/longitude lists and answers with one result per pair, in order.
function loadWeather() {
  const lat = stadiums.map((s) => s.lat).join(",");
  const lon = stadiums.map((s) => s.lon).join(",");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day`;
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    })
    .then((results) => {
      const list = Array.isArray(results) ? results : [results];
      list.forEach((r, i) => {
        if (!r || !r.current || !stadiums[i]) return;
        weatherById[stadiums[i].id] = { temp: r.current.temperature_2m, code: r.current.weather_code, isDay: r.current.is_day === 1 };
      });
      render();
    })
    .catch((err) => console.error("Stadium Surfer: weather failed", err));
}

function tempOf(s) {
  const w = weatherById[s.id];
  return w ? w.temp : null;
}

const searchEl = document.getElementById("ssSearch");
const countryEl = document.getElementById("ssCountry");
const sortEl = document.getElementById("ssSort");
const gridEl = document.getElementById("ssGrid");
const statsEl = document.getElementById("ssStats");

// Missing capacity / opening year sort last whichever way.
const SORTS = {
  visit: (a, b) => a.id - b.id,
  capacity: (a, b) => (b.capacity ?? -1) - (a.capacity ?? -1) || a.id - b.id,
  opened: (a, b) => (a.opened ?? 9999) - (b.opened ?? 9999) || a.id - b.id,
  name: (a, b) => a.name.localeCompare(b.name),
  // Stadiums without a reading (still loading, or the request failed) go last.
  coldest: (a, b) => (tempOf(a) ?? Infinity) - (tempOf(b) ?? Infinity) || a.id - b.id,
};

function renderCard(s) {
  const url = wikiUrl(s.wikiTitle || s.name);
  const photo = s.image
    ? `<img src="${escapeHtml(s.image)}" alt="${escapeHtml(s.name)}" loading="lazy" referrerpolicy="no-referrer" />`
    : '<div class="ss-noimg">&#127967;</div>';
  const meta = [s.club, s.opened].filter(Boolean).map(escapeHtml).join(", ");
  // The opening year is already in the title, uNoGS-style "(club, year)".
  const facts = s.capacity ? `capacity ${s.capacity.toLocaleString("en-US")}` : "";
  const place = [s.city, s.region, s.country].filter(Boolean).map(escapeHtml).join(", ");
  const w = weatherById[s.id];
  let weather = "";
  if (w) {
    const { label, icon } = describeWeather(w);
    weather = `<div class="ss-weather" title="Current weather (Open-Meteo)">${icon} <b>${Math.round(w.temp)}&deg;C</b>${label ? ` ${label}` : ""}</div>`;
  }

  return `
    <article class="ss-card">
      <span class="ss-num">#${s.id}/${stadiums.length}</span>
      <a class="ss-photo" href="${url}" target="_blank" rel="noopener" title="${escapeHtml(s.wikiTitle || s.name)} on Wikipedia">${photo}</a>
      <div class="ss-body">
        <h3 class="ss-title"><a href="${url}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a>${meta ? ` <span class="ss-meta">(${meta})</span>` : ""}</h3>
        <p class="ss-blurb">${escapeHtml(s.blurb || "")}</p>
        ${s.note ? `<div class="ss-note">${escapeHtml(s.note)}</div>` : ""}
        <div class="ss-facts">${facts || "&nbsp;"}</div>
        <div class="ss-place">${place}</div>
        <div class="ss-flag" title="${escapeHtml(s.country)}">${flagEmoji(s.iso2)}</div>
      </div>
      ${weather}
    </article>`;
}

function render() {
  const q = searchEl.value.trim().toLowerCase();
  const country = countryEl.value;
  const shown = stadiums
    .filter((s) => !country || s.country === country)
    .filter((s) => !q || [s.name, s.club, s.city, s.country, s.wikiTitle, s.note].join(" ").toLowerCase().includes(q))
    .sort(SORTS[sortEl.value]);

  gridEl.innerHTML = shown.length
    ? shown.map(renderCard).join("")
    : '<p class="ss-empty">No stadiums match.</p>';

  const countries = new Set(stadiums.map((s) => s.country)).size;
  statsEl.textContent = shown.length === stadiums.length
    ? `${stadiums.length} stadiums visited across ${countries} countries`
    : `Showing ${shown.length} of ${stadiums.length} stadiums`;
}

function populateCountries() {
  const counts = {};
  stadiums.forEach((s) => { counts[s.country] = (counts[s.country] || 0) + 1; });
  countryEl.innerHTML = '<option value="">All countries</option>' +
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([c, n]) => `<option value="${escapeHtml(c)}">${escapeHtml(c)} (${n})</option>`)
      .join("");
}

[searchEl, countryEl, sortEl].forEach((el) => el.addEventListener("input", render));

fetch("stadiums.json")
  .then((res) => {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
  })
  .then((data) => {
    stadiums = data;
    populateCountries();
    render();
    loadWeather();
  })
  .catch(() => {
    statsEl.textContent = location.protocol === "file:"
      ? "Couldn't load stadiums.json. Open this page through a web server (e.g. python3 -m http.server), not straight from disk."
      : "Couldn't load stadiums.json.";
  });
