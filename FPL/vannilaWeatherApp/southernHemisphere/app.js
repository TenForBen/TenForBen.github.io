// Southern Hemisphere Weather — MVP.
// For now this only renders Country | Capital | Flag from countries.json.
// Current temp / local time / sunrise-sunset / day length are meant to be
// added as extra columns later, reusing the same fetch-per-row shape once
// a weather API call is wired in per country (see countries.json's lat/lon,
// already there for that).

// Regional-indicator flag emoji built from an ISO 3166-1 alpha-2 code, e.g.
// "NZ" -> 🇳🇿. Matches the same technique ui.js's flagEmoji() uses in the
// main Weather.JS app, kept local here since this page is self-contained.
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

function renderRows(countries) {
  const tbody = document.getElementById("shBody");
  const sorted = [...countries].sort((a, b) => a.country.localeCompare(b.country));

  tbody.innerHTML = sorted
    .map((c) => `
      <tr>
        <td>${escapeHtml(c.country)}</td>
        <td>${escapeHtml(c.capital)}</td>
        <td class="sh-flag">${flagEmoji(c.iso2)}</td>
      </tr>
    `)
    .join("");

  document.getElementById("shCount").textContent = `${sorted.length} countries`;
}

function renderError() {
  document.getElementById("shBody").innerHTML =
    '<tr><td colspan="3" class="sh-error">Could not load countries.json.</td></tr>';
}

fetch("countries.json")
  .then((res) => {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
  })
  .then(renderRows)
  .catch(renderError);
