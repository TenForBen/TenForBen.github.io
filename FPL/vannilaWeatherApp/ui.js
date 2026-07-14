class UI {
  constructor() {
    this.uiContainer = document.getElementById("content");
    this.city;
    this.defaultCity = "London";
  }

  populateUI(data) {
    // Defence in depth: never try to render a failed or empty response.
    // app.js already guards against this, but this keeps populateUI safe
    // no matter who calls it.
    if (!data || !data.main || !data.sys || !data.coord) {
      this.showError("Weather data is unavailable for that location.");
      return;
    }

    const tz = data.timezone || 0; // offset in seconds from UTC for THIS city

    // Above the Arctic / below the Antarctic Circle the sun may not rise or
    // set at all, so sunrise/sunset can be equal or absent. Handle that.
    const daylight = describeDaylight(data);
    const sunrise = daylight.kind === "normal"
      ? formatLocalTime(data.sys.sunrise, tz)
      : daylight.sunriseLabel;
    const sunset = daylight.kind === "normal"
      ? formatLocalTime(data.sys.sunset, tz)
      : daylight.sunsetLabel;
    const dayLength = daylight.label;

    const latitude = convertToDegreesMinutes(data.coord.lat, true);
    const longitude = convertToDegreesMinutes(data.coord.lon, false);

    // Google Maps wants raw decimals; the DMS strings above are display-only.
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${data.coord.lat},${data.coord.lon}`;

    const temp = Math.round(data.main.temp);
    const tempF = toFahrenheit(data.main.temp); // shown beside the °C hero number

    // Wall-clock time AT the searched location, for the moment of this reading.
    // data.dt is the observation's UTC timestamp; formatLocalTime applies the
    // city's own timezone offset.
    const localTime = data.dt ? formatLocalTime(data.dt, tz) : "\u2014";

    this.uiContainer.innerHTML = `
      <div class="card mx-auto mt-5" style="width: 20rem;">
        <div class="card-body justify-content-center">
          <h5 class="card-title"><b id="placeName">${data.name}</b> , <u id="landen">${data.sys.country}</u></h5>
          <p id="xPat"><a href="${mapsUrl}" target="_blank" rel="noopener" title="Open in Google Maps">${latitude}, ${longitude}</a></p>
          <h6 class="card-subtitle mb-2 text-muted">current Temperature <p id="cuwt">${temp}&deg;C <span style="font-size: 40%;">/ ${tempF}&deg;F</span></p> and feels like ${Math.round(data.main.feels_like)}&deg;C</h6>
          <h6 class="card-subtitle mb-2 text-muted">Highs of ${Math.round(data.main.temp_max)}&deg;C. Lows of ${Math.round(data.main.temp_min)}&deg;C</h6>
          <p class="card-text">Weather conditions are described as: ${data.weather[0].description}</p>
          <p class="card-text">Local time: ${localTime}</p>
          <p class="card-text">Sunrise (local time): ${sunrise}</p>
          <p class="card-text">Sunset (local time): ${sunset}</p>
          <p class="card-text" id="art">${daylight.kind === "normal" ? `daylength is ${dayLength}` : dayLength}</p>
        </div>
      </div>
    `;

    // base styling
    document.getElementById("art").style.color = "red";
    document.getElementById("cuwt").style.color = "green";
    document.getElementById("cuwt").style.fontSize = "300%";
    document.getElementById("placeName").style.color = "orange";
    document.getElementById("placeName").style.fontSize = "200%";

    // temperature-driven colour — exactly one band applies now
    applyTempStyling(temp);

    // clear the search box, ready for the next lookup
    const searchBox = document.getElementById("searchUser");
    if (searchBox) searchBox.value = "";
  }

  // Renders an error into the same spot the weather card normally occupies.
  showError(message) {
    this.uiContainer.innerHTML = `
      <div class="alert alert-danger text-center mx-auto mt-4" style="max-width: 20rem;">
        ${message}
      </div>`;
  }

  clearUI() {
    this.uiContainer.innerHTML = ""; // was `uiContainer` (undefined) before
  }

  saveToLS(data) {
    localStorage.setItem("city", JSON.stringify(data));
  }

  // Returns the last saved weather object, or null if there's nothing
  // valid stored. (The old version's misplaced paren meant it never
  // returned the default and could hand back null, crashing populateUI.)
  getFromLS() {
    const stored = localStorage.getItem("city");
    if (stored === null) return null; // nothing saved yet
    try {
      this.city = JSON.parse(stored);
    } catch (e) {
      return null; // corrupt entry — treat as empty
    }
    return this.city;
  }

  clearLS() {
    localStorage.clear();
  }
}

// ---- Helpers (kept outside the class so they're easy to reuse and test) ----

// Wall-clock time at the searched location.
// OpenWeather returns sunrise/sunset as UTC epoch seconds and a `timezone`
// offset (seconds from UTC). Add the offset, then read with UTC getters so
// the result is the city's own local time — not the viewer's.
function formatLocalTime(unixSeconds, tzOffsetSeconds) {
  const d = new Date((unixSeconds + tzOffsetSeconds) * 1000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

const SECONDS_PER_DAY = 86400;

// Celsius -> Fahrenheit, rounded. The API is queried with units=metric,
// so data.main.temp is already Celsius.
function toFahrenheit(celsius) {
  return Math.round(celsius * 9 / 5 + 32);
}

// Works out whether this location currently has an ordinary sunrise/sunset,
// or is in midnight sun / polar night.
//
// OpenWeather signals a polar period in one of two ways, depending on the
// endpoint: it either omits sunrise/sunset entirely, or returns the two
// timestamps as the SAME value. Their FAQ gives the disambiguation rule —
// when the two are equal it's polar day in the northern hemisphere between
// March and September, and polar night otherwise (inverted in the south).
function describeDaylight(data) {
  const sunrise = data.sys.sunrise;
  const sunset = data.sys.sunset;

  const missing = sunrise == null || sunset == null;
  const identical = !missing && sunrise === sunset;

  if (missing || identical) {
    const local = new Date(((data.dt || 0) + (data.timezone || 0)) * 1000);
    const month = local.getUTCMonth(); // 0 = Jan
    const marchToSeptember = month >= 2 && month <= 8;
    const northern = data.coord.lat >= 0;
    const isPolarDay = northern ? marchToSeptember : !marchToSeptember;

    return isPolarDay
      ? {
          kind: "polar_day",
          label: "Midnight sun \u2014 the sun does not set (24h daylight)",
          sunriseLabel: "the sun does not set",
          sunsetLabel: "the sun does not set",
        }
      : {
          kind: "polar_night",
          label: "Polar night \u2014 the sun does not rise (0h daylight)",
          sunriseLabel: "the sun does not rise",
          sunsetLabel: "the sun does not rise",
        };
  }

  // Sunset can occasionally be reported as an earlier timestamp than sunrise
  // (they're for the current UTC day, not the current local day). Wrap it.
  let seconds = sunset - sunrise;
  if (seconds < 0) seconds += SECONDS_PER_DAY;

  return { kind: "normal", seconds, label: formatDuration(seconds) };
}

// A duration (e.g. daylength) as HH:MM:SS. A duration is timezone-independent,
// so this is plain arithmetic — no Date object, no offset needed.
function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Decimal degrees -> degrees/minutes with an N/S/E/W suffix.
function convertToDegreesMinutes(coord, isLatitude) {
  const direction = isLatitude
    ? coord >= 0 ? "N" : "S"
    : coord >= 0 ? "E" : "W";
  const absolute = Math.abs(coord);
  const degrees = Math.floor(absolute);
  const minutes = ((absolute - degrees) * 60).toFixed(2);
  return `${degrees}\u00B0${minutes}' ${direction}`;
}

// Picks a single colour band for the temperature. Using else-if (via early
// returns) means exactly one band applies — the old cascading `if`s let
// several fire and quietly overwrite each other.
function tempColor(temp) {
  if (temp > 30) return "red";
  if (temp >= 25) return "orange";
  if (temp >= 20) return "yellow";
  if (temp >= 15) return "green";
  if (temp >= 5) return "lightgreen";
  return "#1dc59f";
}

function applyTempStyling(temp) {
  const color = tempColor(temp);
  const placeName = document.getElementById("placeName");
  const cuwt = document.getElementById("cuwt");
  [placeName, cuwt].forEach((el) => {
    if (!el) return;
    el.style.color = color;
    // dark backing only for the pale yellow band, so it stays readable
    el.style.background = color === "yellow" ? "black" : "";
  });
}