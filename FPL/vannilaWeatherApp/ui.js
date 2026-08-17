class UI {
  constructor() {
    this.uiContainer = document.getElementById("content");
    this.city;
    this.defaultCity = "London";
    this.clockTimer = null; // handle for the live local-time interval
    this.history = this.loadHistory(); // last N searches {q, data}, newest first
    this.historyIndex = 0; // which history entry is currently on screen
    this.setupNav(); // builds a persistent nav bar above the weather card
  }

  populateUI(data, queryOverride, previousEntry) {
    // Any previous card's live clock must be torn down before we render a new
    // one, or intervals silently stack up (a memory leak + duplicate ticks).
    this.stopClock();

    // Defence in depth: never try to render a failed or empty response.
    // app.js already guards against this, but this keeps populateUI safe
    // no matter who calls it.
    if (!data || !data.main || !data.sys || !data.coord) {
      this.showError("Weather data is unavailable for that location.");
      return;
    }

    // What did the user search? The API never echoes it back (for a
    // zip/postcode lookup it only names the resolved city), so we grab it
    // ourselves. On a live search we read the box (and stash it); when
    // replaying a history entry we're handed that entry's stored query.
    const searchBox = document.getElementById("searchUser");
    let query;
    if (queryOverride !== undefined) {
      query = queryOverride; // history replay: don't touch the input or LS
    } else {
      const typed = searchBox ? searchBox.value.trim() : "";
      query = typed || localStorage.getItem("cityQuery") || "";
      if (typed) localStorage.setItem("cityQuery", typed);
    }

    this.uiContainer.innerHTML = this.buildWeatherCardHtml(data, query, previousEntry);
    this.applyCardStyling(Math.round(data.main.temp));

    // begin ticking the true current local time for this city
    this.startClock(data.timezone || 0);

    // clear the search box, ready for the next lookup
    if (searchBox) searchBox.value = "";
  }

  // Builds the weather-card markup shared by the main app (populateUI) and
  // GeoStreak's result reveal (renderGameCard). Pure: returns an HTML string
  // and records this.readingDt for the clock tick, but touches no other DOM.
  buildWeatherCardHtml(data, query, previousEntry) {
    // Every dynamic value on the card gets bold text and its own colour,
    // cycling through this palette rather than hand-picking one hex code
    // per field — colorIndex is local to this call, so it always restarts
    // from the same place on a fresh render.
    const VALUE_COLORS = [
      "#2563eb", "#059669", "#db2777", "#b45309", "#7c3aed",
      "#0891b2", "#c026d3", "#dc2626", "#0d9488", "#65a30d",
    ];
    let colorIndex = 0;
    const nextColor = () => VALUE_COLORS[colorIndex++ % VALUE_COLORS.length];
    const val = (text) => `<b style="color: ${nextColor()};">${text}</b>`;

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

    // How many km a degree of longitude spans right here (shrinks toward
    // the poles). A degree of latitude is skipped — it's ~111 km almost
    // everywhere, so not worth calling out.
    const lonKm = kmPerDegreeLongitude(data.coord.lat);

    // Only shown on a history-nav jump (Older/Newer/dropdown) — previousEntry
    // is the place that was on screen right before this one. A fresh search
    // or the initial page load pass no previousEntry, so this stays blank.
    let distanceLine = "";
    if (previousEntry && previousEntry.data && previousEntry.data.coord) {
      const distanceKm = haversineKm(
        previousEntry.data.coord.lat, previousEntry.data.coord.lon,
        data.coord.lat, data.coord.lon
      );
      const fromName = previousEntry.q || previousEntry.data.name || "the last place";
      distanceLine = `<p class="card-text text-muted" style="font-size: 85%;">Distance from ${escapeHtml(fromName)} (last viewed) &asymp; ${val(`${Math.round(distanceKm)} km`)}</p>`;
    }

    // Google Maps wants raw decimals; the DMS strings above are display-only.
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${data.coord.lat},${data.coord.lon}`;

    const temp = Math.round(data.main.temp);
    const tempF = toFahrenheit(data.main.temp); // shown beside the °C hero number

    // data.dt is the observation's UTC timestamp — i.e. when the reading was
    // taken, which can lag behind real time. It is NOT "now". We show its full
    // local date+time, plus a live "… ago" counter updated by the clock tick.
    const readingDateTime = data.dt ? formatLocalDateTime(data.dt, tz) : "\u2014";
    this.readingDt = data.dt || null; // used by startClock to refresh "… ago"

    // Timezone label (UTC±X) for this city, plus how far ahead/behind the
    // visitor's own local time it is. The visitor's timezone comes from
    // their browser/OS (not hardcoded), so this works the same for anyone
    // anywhere, and stays correct across DST since it's derived live.
    const utcLabel = formatUtcOffset(tz);
    const visitorTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const visitorOffset = getOffsetSeconds(visitorTz);
    const diffLabel = formatTimeDiff(tz - visitorOffset);

    return `
      <div class="card mx-auto mt-5" style="width: 20rem;">
        <div class="card-body justify-content-center">
          <h5 class="card-title"><b id="placeName">${data.name}</b>, ${flagImg(data.sys.country)}<u id="landen">${val(data.sys.country)}</u></h5>
          ${query ? `<p class="card-text text-muted" style="font-size: 90%;">Searched: ${val(escapeHtml(query))}</p>` : ""}
          <p id="xPat"><a href="${mapsUrl}" target="_blank" rel="noopener" title="Open in Google Maps">${val(latitude)}, ${val(longitude)}</a></p>
          <p class="card-text text-muted" style="font-size: 85%;">1&deg; longitude at ${latitude}, ${longitude} &asymp; ${val(`${lonKm} km`)} here</p>
          ${distanceLine}
          <h6 class="card-subtitle mb-2 text-muted">current Temperature <p id="cuwt">${temp}&deg;C <span style="font-size: 40%;">/ ${val(`${tempF}&deg;F`)}</span></p> and feels like ${val(`${Math.round(data.main.feels_like)}&deg;C`)}</h6>
          <h6 class="card-subtitle mb-2 text-muted">Highs of ${val(`${Math.round(data.main.temp_max)}&deg;C`)}. Lows of ${val(`${Math.round(data.main.temp_min)}&deg;C`)}</h6>
          <p class="card-text">Weather conditions are described as: ${val(escapeHtml(data.weather[0].description))}</p>
          <p class="card-text">Local time: <b style="color: ${nextColor()};"><span id="liveClock">${nowAtLocation(tz)}</span></b> | ${val(utcLabel)} | ${val(diffLabel)}</p>
          <p class="card-text text-muted" style="font-size: 85%;">reading taken at ${val(readingDateTime)}${data.dt ? ` <b style="color: ${nextColor()};"><span id="readingAgo">(${formatAgo(Math.floor(Date.now() / 1000) - data.dt)})</span></b>` : ""}</p>
          <p class="card-text">Sunrise (local time): ${val(sunrise)}</p>
          <p class="card-text">Sunset (local time): ${val(sunset)}</p>
          <p class="card-text" id="art">${daylight.kind === "normal" ? `daylength is <b>${dayLength}</b>` : `<b>${dayLength}</b>`}</p>
        </div>
      </div>
    `;
  }

  // The styling pass that follows any weather-card render, main app or
  // GeoStreak alike — split out so both callers apply it identically.
  applyCardStyling(temp) {
    document.getElementById("art").style.color = "red";
    document.getElementById("art").style.fontWeight = "bold";
    document.getElementById("cuwt").style.color = "green";
    document.getElementById("cuwt").style.fontSize = "300%";
    document.getElementById("cuwt").style.fontWeight = "bold";
    document.getElementById("placeName").style.color = "orange";
    document.getElementById("placeName").style.fontSize = "200%";

    // temperature-driven colour — exactly one band applies now
    applyTempStyling(temp);
  }

  // Ticks #liveClock every second with the *real* current time at the city,
  // derived from the browser clock + the city's UTC offset (not from data.dt).
  startClock(tzOffsetSeconds) {
    this.stopClock(); // never allow two timers at once

    const tick = () => {
      const el = document.getElementById("liveClock");
      if (!el) {
        this.stopClock(); // card was replaced — stop ticking into thin air
        return;
      }
      el.textContent = nowAtLocation(tzOffsetSeconds);

      // Keep the "reading taken … ago" counter fresh on the same beat.
      const agoEl = document.getElementById("readingAgo");
      if (agoEl && this.readingDt) {
        agoEl.textContent = `(${formatAgo(Math.floor(Date.now() / 1000) - this.readingDt)})`;
      }
    };

    tick(); // paint immediately so there's no 1-second blank
    this.clockTimer = setInterval(tick, 1000);
  }

  stopClock() {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
  }

  // Renders an error into the same spot the weather card normally occupies.
  // Escaped because some callers (the 404 path) build this message from
  // whatever the user just typed into the search box. `container` defaults
  // to the main app's own card slot, but GeoStreak's plain (non-guess)
  // searches pass its own result div instead, since that page has no
  // #content element.
  showError(message, container = this.uiContainer) {
    this.stopClock(); // an error replaces the card, so kill any running clock
    container.innerHTML = `
      <div class="alert alert-danger text-center mx-auto mt-4" style="max-width: 20rem;">
        ${escapeHtml(message)}
      </div>`;
  }

  clearUI() {
    this.stopClock();
    this.uiContainer.innerHTML = ""; // was `uiContainer` (undefined) before
  }

  saveToLS(data) {
    localStorage.setItem("city", JSON.stringify(data));
    // Also record it in the rolling history. cityQuery was just set by the
    // preceding populateUI call, so it's the right label for this entry.
    const q = localStorage.getItem("cityQuery") || data.name || "";
    this.pushHistory(data, q);
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

  // ---- Search history (up to HISTORY_MAX results, newest first) ----------
  // localStorage keeps the whole list; the nav dropdown shows only a small
  // window (HISTORY_DROPDOWN) around the current item, and the Older/Newer
  // buttons step through everything.

  loadHistory() {
    try {
      const raw = localStorage.getItem("history");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return []; // corrupt entry — start clean
    }
  }

  persistHistory() {
    try {
      localStorage.setItem("history", JSON.stringify(this.history));
    } catch (e) {
      /* storage full or blocked — history is best-effort */
    }
  }

  // Adds a result to the front, de-duplicating by query so the same place
  // doesn't fill all ten slots, and caps the list at 10.
  pushHistory(data, query) {
    const q = (query || data.name || "").trim();
    this.history = this.history.filter(
      (h) => (h.q || "").toLowerCase() !== q.toLowerCase()
    );
    this.history.unshift({ q, data });
    if (this.history.length > HISTORY_MAX) this.history.length = HISTORY_MAX;
    this.historyIndex = 0; // the new search is now the one on screen
    this.persistHistory();
    this.updateNav();
  }

  // Re-renders the card from a stored entry (no new fetch, no re-push).
  viewHistory(index) {
    if (index < 0 || index >= this.history.length) return;
    const previousEntry = this.history[this.historyIndex]; // what's on screen right now
    this.historyIndex = index;
    const entry = this.history[index];
    // Passing previousEntry tells populateUI this is a history-nav jump (vs.
    // a fresh search), which is the only time the distance-from-last-place
    // line should appear.
    this.populateUI(entry.data, entry.q, previousEntry);
    this.updateNav();
  }

  // Creates the persistent nav bar once, sitting just above the weather card,
  // and wires delegated handlers so they survive every re-render.
  setupNav() {
    if (!this.uiContainer || !this.uiContainer.parentNode) return;
    this.navContainer = document.createElement("div");
    this.navContainer.id = "historyNav";
    this.uiContainer.parentNode.insertBefore(this.navContainer, this.uiContainer);

    this.navContainer.addEventListener("click", (e) => {
      if (e.target.closest("#histPrev")) this.viewHistory(this.historyIndex - 1);
      else if (e.target.closest("#histNext")) this.viewHistory(this.historyIndex + 1);
    });
    this.navContainer.addEventListener("change", (e) => {
      if (e.target.id === "histSelect") this.viewHistory(Number(e.target.value));
    });

    this.updateNav();
  }

  // Rebuilds the nav bar's contents to reflect the current history + index.
  // Hidden until there are at least two results to move between.
  updateNav() {
    if (!this.navContainer) return;
    const len = this.history.length;
    if (len < 2) {
      this.navContainer.innerHTML = "";
      return;
    }
    const idx = this.historyIndex;

    // The dropdown lists only a small window of entries centred on the current
    // one — so the selected item is always visible and the menu stays short —
    // while the Older/Newer buttons move across the entire stored history.
    const win = HISTORY_DROPDOWN;
    let start = idx - Math.floor(win / 2);
    start = Math.min(start, len - win); // don't overshoot the end
    start = Math.max(0, start); // and never before the start
    const end = Math.min(len, start + win);

    let options = "";
    for (let i = start; i < end; i++) {
      const entry = this.history[i];
      options += `<option value="${i}" ${i === idx ? "selected" : ""}>${escapeHtml(
        entry.q || entry.data.name
      )}</option>`;
    }

    this.navContainer.innerHTML = `
      <div class="d-flex justify-content-center align-items-center mt-4" style="gap: 8px; flex-wrap: wrap;">
        <button id="histPrev" class="btn btn-sm btn-outline-primary" ${idx === 0 ? "disabled" : ""}>&#9664; Newer</button>
        <select id="histSelect" class="form-control form-control-sm" style="width: auto; display: inline-block;">
          ${options}
        </select>
        <button id="histNext" class="btn btn-sm btn-outline-primary" ${idx === len - 1 ? "disabled" : ""}>Older &#9654;</button>
      </div>
      <p class="text-center text-muted" style="font-size: 80%; margin-top: 4px;">
        Showing ${idx + 1} of ${len} recent searches
      </p>`;
  }

  clearLS() {
    localStorage.clear();
    this.history = [];
    this.historyIndex = 0;
    this.updateNav();
  }

  // ---- GeoStreak rendering -----------------------------------------------
  // These reuse buildWeatherCardHtml/applyCardStyling above rather than
  // building a second card template, per the game's design: the result
  // reveal should look like a Weather.JS card, just with a stamp on it.

  // Renders the result-reveal card into `container` (the game's own result
  // div, not this.uiContainer — GeoStreak has no #content element). No
  // "Searched:" line (query omitted) and no live clock started: this card
  // is a one-off snapshot of a past guess, not a running weather display.
  // `isNewCity` (the city has never been attempted before, lifetime, on
  // this browser) briefly brightens the card via the CSS gs-brighten
  // animation — it's a fresh element each call, so unlike the streak pulse
  // there's no reflow trick needed to retrigger it. `correct` is omitted
  // entirely (not false) for a plain lookup made outside a live round —
  // that's not a judged guess, so no CORRECT/INCORRECT stamp applies.
  renderGameCard(container, data, { correct, isNewCity } = {}) {
    if (!container) return;
    const cardHtml = this.buildWeatherCardHtml(data, null);
    const newCityClass = isNewCity ? "geo-new-city" : "";
    const stampHtml = typeof correct === "boolean"
      ? `<div class="geo-stamp ${correct ? "geo-stamp-correct" : "geo-stamp-incorrect"}">${correct ? "CORRECT" : "INCORRECT"}</div>`
      : "";

    container.innerHTML = `
      <div class="geo-result-wrap ${newCityClass}">
        ${stampHtml}
        ${cardHtml}
      </div>
    `;
    this.applyCardStyling(Math.round(data.main.temp));
  }

  // Sets the round's prompt, e.g. "Name a city with current temperature
  // ABOVE 22°C." Tough rounds (condition.hemisphere set) also name a
  // hemisphere the city must be in, e.g. "Name a city in the NORTHERN
  // hemisphere with current temperature below 18°C." — both parts are
  // checked, so a real answer needs to satisfy the temperature reading
  // and the hemisphere it comes from.
  renderGameCondition(el, condition) {
    if (!el) return;
    const tempPart = `current temperature <b>${condition.direction.toUpperCase()}</b> ${condition.threshold}&deg;C`;
    if (condition.hemisphere) {
      const hemisphereLabel = condition.hemisphere === "north" ? "Northern" : "Southern";
      // North/South get their own colours (not just bold) so the tough-round
      // twist reads at a glance rather than blending into the rest of the
      // sentence — cool blue for Northern, warm amber for Southern.
      const hemisphereColor = condition.hemisphere === "north" ? "#38bdf8" : "#f0b429";
      el.innerHTML = `Name a city in the <b style="color: ${hemisphereColor};">${hemisphereLabel}</b> hemisphere with ${tempPart}.`;
    } else {
      el.innerHTML = `Name a city with ${tempPart}.`;
    }
  }

  updateStreakDisplay(el, streak) {
    if (el) el.textContent = streak;
  }

  // `pulse` briefly replays the geo-pulse CSS animation — used when the
  // streak just overtook the high score.
  updateHighScoreDisplay(el, highScore, { pulse = false } = {}) {
    if (!el) return;
    el.textContent = highScore;
    if (pulse) {
      el.classList.remove("geo-pulse");
      void el.offsetWidth; // force reflow so the removal registers before re-adding the class
      el.classList.add("geo-pulse");
    }
  }

  // Updates the round countdown, with colour urgency as time runs low.
  updateTimerDisplay(el, secondsLeft) {
    if (!el) return;
    el.textContent = `${secondsLeft}s`;
    el.classList.toggle("gs-timer-danger", secondsLeft <= 5);
    el.classList.toggle("gs-timer-warn", secondsLeft > 5 && secondsLeft <= 10);
  }

  // Renders the session's per-country breakdown, e.g. "🇧🇷 BR ×2 | 🇦🇷 AR ×1",
  // from a Map of ISO country code -> array of city names used from it.
  // Each chip is hoverable/focusable and expands a small popover listing
  // those cities, so "BR ×2" doesn't require remembering which two. Reuses
  // flagEmoji() rather than the CDN flagImg() — this is a compact inline
  // tally, not a card header.
  updateCountryTally(el, countryCities) {
    if (!el) return;
    if (countryCities.size === 0) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML = [...countryCities.entries()]
      .map(([code, cities]) => `
        <span class="gs-tally-chip" tabindex="0">
          ${flagEmoji(code)} ${escapeHtml(code)} &times;${cities.length}
          <span class="gs-tally-popover">${cities.map(escapeHtml).join("<br>")}</span>
        </span>
      `)
      .join(" &nbsp;|&nbsp; ");
  }

  // The lifetime numbers shown on the start, pause and game-over panels,
  // from the `stats` object app.js keeps in sync with localStorage.
  // Accuracy is derived here rather than stored, so it can never drift out
  // of step with the two counters it comes from.
  buildInsightsHtml(stats = {}) {
    const highScore = stats.highScore || 0;
    const totalCorrect = stats.totalCorrect || 0;
    const totalAttempts = stats.totalAttempts || 0;
    const accuracy = totalAttempts
      ? `${Math.round((totalCorrect / totalAttempts) * 100)}%`
      : "—";

    return `
      <div class="gs-insights">
        ${insightBox("BEST STREAK", highScore)}
        ${insightBox("CORRECT", totalCorrect)}
        ${insightBox("ATTEMPTS", totalAttempts)}
        ${insightBox("ACCURACY", accuracy)}
      </div>
      <p class="gs-insights-note">ALL-TIME, THIS BROWSER</p>
    `;
  }

  // Top-5 most-attempted cities, all-time, with a percentage of the
  // lifetime city-attempt total each accounts for. Gated on gamesPlayed >= 3
  // (must match GAMES_PLAYED_KEY's comment in app.js) — with only a run or
  // two behind it, "most used" is just whatever you happened to type, not a
  // real pattern, so the block renders as "" (nothing shown) until then.
  buildCityInsightsHtml(stats = {}) {
    if ((stats.gamesPlayed || 0) < 3) return "";

    const cityCounts = stats.cityCounts || {};
    const entries = Object.entries(cityCounts);
    if (entries.length === 0) return "";

    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    const top5 = entries.sort((a, b) => b[1] - a[1]).slice(0, 5);

    const rows = top5
      .map(([cityKey, count]) => {
        const [city, countryCode] = cityKey.split("|");
        const pct = total ? Math.round((count / total) * 100) : 0;
        return `
          <li>
            <span class="gs-city-name">${flagEmoji(countryCode)} ${escapeHtml(city)}</span>
            <span class="gs-city-count">${count}&times; (${pct}%)</span>
          </li>
        `;
      })
      .join("");

    return `
      <div class="gs-city-insights">
        <p class="gs-insights-note">TOP CITIES, ALL-TIME</p>
        <ul class="gs-city-list">${rows}</ul>
      </div>
    `;
  }

  // First screen on load: the rules and a prominent Start button, so
  // there's no scrolling past numbers to get into a round. The player's
  // running numbers still exist (renderInsights, rendered into its own
  // container below the result card) — just not fighting the button for
  // top billing.
  renderStartScreen(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="gs-panel">
        <h3>GeoStreak</h3>
        <p class="gs-panel-sub">
          Name a city whose current temperature matches the condition. Keep the streak alive.
        </p>
        <button type="button" id="gsStartBtn" class="btn btn-primary">Start Game</button>
        <ul class="gs-howto">
          <li>20 seconds per round.</li>
          <li>Each city can only be used once per run.</li>
          <li>A wrong guess &mdash; or the clock &mdash; ends the run.</li>
          <li>A city we can't find costs you nothing but time.</li>
          <li>From question 11 on, rounds get tough: a hemisphere is added to the condition, and both parts have to match.</li>
        </ul>
      </div>
    `;
  }

  renderPauseScreen(container, currentStreak) {
    if (!container) return;
    container.innerHTML = `
      <div class="gs-panel">
        <h3>Paused</h3>
        <p class="gs-panel-sub">Current streak: <b>${currentStreak}</b> &mdash; still alive.</p>
        <button type="button" id="gsResumeBtn" class="btn btn-primary">Resume</button>
      </div>
    `;
  }

  // `reason: "time"` distinguishes a timeout loss from a wrong-guess loss.
  // `uniqueCities` is this run's count (not lifetime) — how many different
  // real places were pulled a reading from before the run ended.
  renderGameOver(container, finalStreak, { reason, uniqueCities = 0 } = {}) {
    if (!container) return;
    const heading = reason === "time" ? "Time's Up!" : "Game Over";
    container.innerHTML = `
      <div class="gs-panel gs-panel-danger">
        <h3>${heading}</h3>
        <p class="gs-panel-sub">Final streak: <b>${finalStreak}</b></p>
        <p class="gs-panel-sub">Unique cities this run: <b>${uniqueCities}</b></p>
        <button type="button" id="gsPlayAgain" class="btn btn-warning">Play Again</button>
      </div>
    `;
  }

  // The lifetime numbers, shared by the start/pause/game-over states —
  // rendered into its own container (below the result card, so a fresh
  // guess/search result isn't buried under it) rather than embedded in
  // each panel above, which is what used to push the action button down
  // behind a wall of stats and the city list.
  renderInsights(container, stats) {
    if (!container) return;
    container.innerHTML = `
      <div class="gs-panel">
        ${this.buildInsightsHtml(stats)}
        ${this.buildCityInsightsHtml(stats)}
      </div>
    `;
  }

  // Reflects whether a pause has been requested but not yet applied — the
  // button is the only place that state is visible to the player.
  updatePauseButton(el, pending) {
    if (!el) return;
    el.classList.toggle("gs-pause-armed", pending);
    el.innerHTML = pending ? "&#9208; PAUSING AFTER THIS ONE" : "&#9208; PAUSE";
  }
}

// ---- Helpers (kept outside the class so they're easy to reuse and test) ----

// One stat tile inside a GeoStreak insights row.
function insightBox(label, value) {
  return `
    <div class="gs-insight">
      <div class="gs-insight-label">${label}</div>
      <div class="gs-insight-value">${escapeHtml(value)}</div>
    </div>
  `;
}

// Builds a small flag <img> from an ISO 3166 country code (e.g. "MA" -> the
// Moroccan flag) via flagcdn.com. Returns "" for an unknown/invalid code, and
// the onerror hides the image if it ever fails to load, leaving the letters.
function flagImg(countryCode) {
  const cc = String(countryCode || "").toLowerCase().replace(/[^a-z]/g, "");
  if (cc.length !== 2) return "";
  return (
    `<img src="https://flagcdn.com/24x18/${cc}.png" ` +
    `srcset="https://flagcdn.com/48x36/${cc}.png 2x" ` +
    `width="24" height="18" alt="${cc.toUpperCase()} flag" data-cc="${cc}" ` +
    `style="vertical-align: middle; margin: 0 4px 3px; border-radius: 2px;" ` +
    `onerror="flagFallback(this)">`
  );
}

// Emoji flag from a country code (regional-indicator letters), e.g. "NZ" -> 🇳🇿.
function flagEmoji(countryCode) {
  const cc = String(countryCode || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (cc.length !== 2) return "";
  return String.fromCodePoint(...[...cc].map((c) => 0x1F1E6 + c.charCodeAt(0) - 65));
}

// Runs when the CDN flag image fails to load (offline, or blocked by a privacy
// /ad extension): swap in the emoji flag, which needs no network. Only falls
// back to hiding if we somehow can't build an emoji. Global so the inline
// onerror can reach it.
function flagFallback(img) {
  const emoji = flagEmoji(img.getAttribute("data-cc"));
  if (emoji) {
    const span = document.createElement("span");
    span.textContent = emoji;
    span.style.margin = "0 4px";
    img.replaceWith(span);
  } else {
    img.style.display = "none";
  }
}

// Escapes user-supplied text before it goes into innerHTML, so a query like
// `<img onerror=…>` renders as literal characters instead of live markup.
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);
}


// Formats a UTC offset (in seconds) as "UTC+2", "UTC+5:30", "UTC-8", "UTC".
function formatUtcOffset(offsetSeconds) {
  if (!offsetSeconds) return "UTC";
  const sign = offsetSeconds > 0 ? "+" : "-";
  const abs = Math.abs(offsetSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  return m ? `UTC${sign}${h}:${String(m).padStart(2, "0")}` : `UTC${sign}${h}`;
}

// Current UTC offset (seconds) of a named IANA timezone, e.g. "Europe/Malta"
// or "Asia/Kolkata". Derived live via Intl so it tracks daylight-saving
// automatically. Falls back to the viewer's own offset if Intl fails.
function getOffsetSeconds(timeZone, date = new Date()) {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const p = {};
    for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    // Round to whole minutes. Every real IANA offset is a whole number of
    // minutes, and this removes the sub-second jitter that otherwise appears
    // because Intl reports only whole seconds while date.getTime() carries
    // milliseconds — which was making a clean 6h read as "5 hrs 59 min".
    return Math.round((asUTC - date.getTime()) / 60000) * 60;
  } catch (e) {
    return -date.getTimezoneOffset() * 60;
  }
}

// Human-readable gap from the visitor's own local time, e.g.
// "3 hrs 30 min ahead of your time".
function formatTimeDiff(diffSeconds) {
  if (diffSeconds === 0) return "same time as you";
  const ahead = diffSeconds > 0;
  const abs = Math.abs(diffSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const hPart = h ? `${h} hr${h === 1 ? "" : "s"}` : "";
  const mPart = m ? `${m} min` : "";
  const hm = [hPart, mPart].filter(Boolean).join(" ") || "0 hrs";
  return `${hm} ${ahead ? "ahead of" : "behind"} your time`;
}

// The TRUE current wall-clock time at a location, derived from the browser's
// live UTC clock plus the city's offset. Unlike formatLocalTime(data.dt, ...),
// this is "now", not the (possibly stale) moment the reading was taken.
function nowAtLocation(tzOffsetSeconds) {
  const d = new Date(Date.now() + tzOffsetSeconds * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

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

// Full local date + time at a location, e.g. "16 Jul 2026, 15:29:17".
// Same UTC-offset trick as formatLocalTime, just with the date included.
function formatLocalDateTime(unixSeconds, tzOffsetSeconds) {
  const d = new Date((unixSeconds + tzOffsetSeconds) * 1000);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const p = (n) => String(n).padStart(2, "0");
  const date = `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  const time = `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
  return `${date}, ${time}`;
}

// A human "how long ago", coarsening as it grows: "just now" -> "5 min ago"
// -> "3 hrs 12 min ago" -> "2 days 4 hrs ago". The gap is timezone-independent
// (now minus the reading's UTC timestamp), so no offset is involved.
function formatAgo(totalSeconds) {
  if (totalSeconds < 0) totalSeconds = 0; // guard against minor clock skew
  if (totalSeconds < 45) return "just now";

  const plural = (n, unit) => `${n} ${unit}${n === 1 ? "" : "s"}`;

  const min = Math.floor(totalSeconds / 60);
  if (min < 60) return `${min} min ago`;

  if (totalSeconds < 86400) {
    const hrs = Math.floor(totalSeconds / 3600);
    const remMin = Math.floor((totalSeconds % 3600) / 60);
    return remMin
      ? `${plural(hrs, "hr")} ${remMin} min ago`
      : `${plural(hrs, "hr")} ago`;
  }

  const days = Math.floor(totalSeconds / 86400);
  const remHrs = Math.floor((totalSeconds % 86400) / 3600);
  return remHrs
    ? `${plural(days, "day")} ${plural(remHrs, "hr")} ago`
    : `${plural(days, "day")} ago`;
}

const SECONDS_PER_DAY = 86400;

// How many searches localStorage keeps, and how many the dropdown shows at
// once (a window around the current entry). Bump HISTORY_MAX to 100 if you
// want a deeper store — it's just JSON in localStorage.
const HISTORY_MAX = 50;
const HISTORY_DROPDOWN = 5;

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

// How many km one degree of longitude spans at a given latitude. Meridians
// converge toward the poles, so this shrinks from ~111 km at the equator to
// 0 km at the pole itself (unlike a degree of latitude, which stays close
// to constant everywhere and so isn't worth displaying). WGS84
// approximation (accurate to a few metres), from
// https://en.wikipedia.org/wiki/Longitude#Length_of_a_degree_of_longitude.
function kmPerDegreeLongitude(latDegrees) {
  const lat = (latDegrees * Math.PI) / 180;
  const lonKm =
    (111412.84 * Math.cos(lat) - 93.5 * Math.cos(3 * lat) + 0.118 * Math.cos(5 * lat)) / 1000;
  return Math.abs(lonKm).toFixed(1);
}

// Great-circle distance (km) between two lat/lon points, via the haversine
// formula. Used for the "distance from the last place you viewed" line —
// straight-line "as the crow flies", not driving/flying route distance.
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // mean Earth radius, km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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