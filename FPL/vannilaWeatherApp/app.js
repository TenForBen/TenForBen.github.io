// instantiate classes — shared by both the main weather app (index.html)
// and GeoStreak (weatherGame/geoStreakGame.html), which both load this file.
const ft = new Fetch();
const ui = new UI();

// ---- Main weather app ----------------------------------------------------
// Guarded on #searchUser/#submit so this file can also be loaded by
// geoStreakGame.html, which has neither element.
const search = document.getElementById("searchUser");
const button = document.getElementById("submit");

if (search && button) {
  initWeatherApp();
}

function initWeatherApp() {
  // Look up whatever the user typed. Because getCurrent() throws on a bad
  // HTTP status, and fetch() itself throws on a network drop, a single
  // try/catch here covers every failure mode: city-not-found (404),
  // invalid key (401), rate limit (429) and "offline".
  async function runSearch() {
    const currentVal = search.value.trim();

    if (currentVal === "") {
      ui.showError("Please enter a location.");
      return;
    }

    try {
      const data = await ft.getCurrent(currentVal);
      ui.populateUI(data);
      ui.saveToLS(data);
    } catch (err) {
      ui.showError(err.message);
    }
  }

  button.addEventListener("click", runSearch);

  // Enter key runs the same search
  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearch();
  });

  // On page load: restore the last searched city if we have one; otherwise
  // fetch a sensible default so the page isn't blank. Both paths are guarded.
  window.addEventListener("DOMContentLoaded", async () => {
    const saved = ui.getFromLS();

    if (saved) {
      ui.populateUI(saved); // saved is a full weather object, not a string
      return;
    }

    try {
      const data = await ft.getCurrent(ui.defaultCity);
      ui.populateUI(data);
      ui.saveToLS(data);
    } catch (err) {
      ui.showError(err.message);
    }
  });
}

// ---- GeoStreak game --------------------------------------------------------
// Guarded on #geoStreakRoot so this file can also be loaded by the main
// weather app's index.html, which has no such element.
if (document.getElementById("geoStreakRoot")) {
  initGeoStreak();
}

function initGeoStreak() {
  const HIGH_SCORE_KEY = "geoStreakGame_highScore";
  // Lifetime counters, separate from the per-session streak. An "attempt" is
  // a guess that resolved to a real place and got judged — lookups that found
  // nothing, duplicate cities and timed-out rounds are not attempts, so
  // accuracy measures geography rather than typing.
  const TOTAL_CORRECT_KEY = "geoStreakGame_totalCorrect";
  const TOTAL_ATTEMPTS_KEY = "geoStreakGame_totalAttempts";
  const MIN_THRESHOLD = 5;
  const MAX_THRESHOLD = 32;
  // From the 11th question on (streak >= TOUGH_STREAK, i.e. 10 correct
  // answers banked), rounds add a hemisphere requirement on top of the
  // temperature one and narrow the threshold range to 10-30°C — the extreme
  // ends of the normal 5-32°C range are the easy giveaways (near-freezing or
  // near-desert-heat), so tough rounds drop them to keep both conditions
  // actually in play.
  const TOUGH_STREAK = 10;
  const TOUGH_MIN_THRESHOLD = 10;
  const TOUGH_MAX_THRESHOLD = 30;
  const ROUND_SECONDS = 20;
  const RESULT_VISIBLE_MS = 4000; // how long a correct-guess card stays up before fading
  const RESULT_FADE_MS = 500; // must match the CSS transition duration on .geo-result-fade-out

  // Lifetime per-city attempt log, keyed "City|CC" (the API's resolved name
  // plus country code, so same-named cities in different countries don't
  // collide) — this is what the top-5-cities insight and the "new city"
  // glow are both built from.
  const CITY_COUNTS_KEY = "geoStreakGame_cityCounts";
  // Bumped once per completed run (see endGame) — ui.js's
  // buildCityInsightsHtml() gates the top-cities insight on this being >= 3,
  // so "most used" reflects a few runs of history rather than just the one.
  const GAMES_PLAYED_KEY = "geoStreakGame_gamesPlayed";

  const conditionEl = document.getElementById("gsCondition");
  const cityInput = document.getElementById("gsCityInput");
  const submitBtn = document.getElementById("gsSubmit");
  const timerEl = document.getElementById("gsTimer");
  const hintEl = document.getElementById("gsHint");
  const resultEl = document.getElementById("gsResult");
  const streakEl = document.getElementById("gsStreak");
  const highScoreEl = document.getElementById("gsHighScore");
  const countryTallyEl = document.getElementById("gsCountryTally");
  const pauseBtn = document.getElementById("gsPause");
  const leaderboardPeekBtn = document.getElementById("gsLeaderboardPeek");
  const startEl = document.getElementById("gsStart");
  const playAreaEl = document.getElementById("gsPlayArea");
  const playControlsEl = document.getElementById("gsPlayControls");
  const pausedEl = document.getElementById("gsPaused");
  const gameOverEl = document.getElementById("gsGameOver");
  const insightsEl = document.getElementById("gsInsights");

  let streak = 0;
  let highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  let totalCorrect = Number(localStorage.getItem(TOTAL_CORRECT_KEY)) || 0;
  let totalAttempts = Number(localStorage.getItem(TOTAL_ATTEMPTS_KEY)) || 0;
  // Completed runs (wins don't exist here — every run ends in a wrong guess
  // or a timeout), used only to gate the top-cities insight behind having
  // enough history to be meaningful.
  let gamesPlayed = Number(localStorage.getItem(GAMES_PLAYED_KEY)) || 0;
  // Lifetime "City|CC" -> attempt count, persisted after every judged guess.
  let cityCounts = JSON.parse(localStorage.getItem(CITY_COUNTS_KEY) || "{}");
  let currentCondition = null;
  let timeLeft = ROUND_SECONDS;
  let timerInterval = null;

  // Pause is *requested*, not taken: the clock keeps running on the round
  // you're in, and the pause only lands once that attempt is settled. Pausing
  // mid-round would otherwise be an unlimited thinking-time button.
  let pausePending = false;
  let paused = false;

  // Bumped every time a round starts or ends, so a guess whose fetch is
  // still in flight when the round timer runs out (or the game restarts)
  // can tell its answer no longer belongs to the current round and drop it.
  let roundId = 0;

  // Whether there's a live round to guess against right now. The search
  // box is visible in every state (including before Start Game is ever
  // pressed), so this is what tells submitGuess() whether to judge the
  // input as a guess or just run it as a plain lookup, same as the main
  // Weather.JS page's search.
  let roundLive = false;

  function setRoundLive(live) {
    roundLive = live;
    submitBtn.textContent = live ? "Guess" : "Search";
  }

  // Cities already answered with this session (one continuous streak run,
  // cleared on restart) — lowercased so "Auckland" and "auckland" count as
  // the same entry. Keyed on both whatever the player typed AND the API's
  // resolved name, so "Auckland" then "Auckland,NZ" are still caught as the
  // same place even though the raw strings differ.
  let usedCities = new Set();

  // Canonical "City|CC" keys seen this run, for the run's unique-city count
  // shown on the Game Over screen. A subset of usedCities' bookkeeping, but
  // usedCities mixes in the raw typed string too (up to 2 entries per real
  // city), so it can't double as this count.
  let citiesThisRun = new Set();

  // Every resolved round this run, correct guesses and the one that ended
  // it alike — sent to Firestore as a single array field on one document
  // when the run ends (see endGame), not written round-by-round. That's
  // the entire point: one write per finished run, however many rounds it
  // had, instead of one write per round.
  let roundHistory = [];

  // How many guesses (correct or not, but only ones that resolved to a real
  // place) have come from each country this session, keyed by ISO code.
  let countryCounts = new Map();

  // Direction strictly alternates round to round (not a fresh coin flip
  // each time) — starting side is randomised once per session so it isn't
  // always "above" first.
  let nextDirection = Math.random() < 0.5 ? "above" : "below";

  // Per-direction pool of thresholds not yet asked this session. A given
  // (direction, threshold) question can't repeat until every threshold for
  // that direction has been used at least once, at which point its pool
  // refills and the cycle starts over. Tough rounds (see TOUGH_STREAK) get
  // their own pool, keyed to the narrower 10-30°C range, so exhausting one
  // pool doesn't force an early refill of the other.
  const usedThresholds = { above: new Set(), below: new Set() };
  const usedToughThresholds = { above: new Set(), below: new Set() };

  // Hemisphere strictly alternates round to round, same rationale as
  // nextDirection below — starting side randomised once per session so
  // tough rounds don't always open on "north".
  let nextHemisphere = Math.random() < 0.5 ? "north" : "south";

  function pickThreshold(pool, direction, min, max) {
    const used = pool[direction];
    let remaining = [];
    for (let t = min; t <= max; t++) {
      if (!used.has(t)) remaining.push(t);
    }
    if (remaining.length === 0) {
      used.clear(); // every threshold for this direction has been asked -> refill
      for (let t = min; t <= max; t++) remaining.push(t);
    }
    const threshold = remaining[Math.floor(Math.random() * remaining.length)];
    used.add(threshold);
    return threshold;
  }

  // Visible immediately on load, before the first question is even
  // generated — the high score should always be there for motivation.
  ui.updateHighScoreDisplay(highScoreEl, highScore);
  ui.updateStreakDisplay(streakEl, streak);

  // Snapshot of the lifetime numbers for the insight panels. Read fresh each
  // time so a panel can never show a stale count.
  function stats() {
    return { highScore, totalCorrect, totalAttempts, gamesPlayed, cityCounts };
  }

  function recordAttempt(correct) {
    totalAttempts += 1;
    if (correct) totalCorrect += 1;
    localStorage.setItem(TOTAL_ATTEMPTS_KEY, String(totalAttempts));
    localStorage.setItem(TOTAL_CORRECT_KEY, String(totalCorrect));
  }

  // Logs one judged guess against the lifetime city count and reports
  // whether this is the very first time this city has ever been attempted
  // — that's the signal the result card's new-city glow keys off of.
  function recordCityAttempt(cityKey) {
    const isNewCity = !cityCounts[cityKey];
    cityCounts[cityKey] = (cityCounts[cityKey] || 0) + 1;
    localStorage.setItem(CITY_COUNTS_KEY, JSON.stringify(cityCounts));
    return isNewCity;
  }

  function stopRoundTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function startRoundTimer() {
    stopRoundTimer();
    timeLeft = ROUND_SECONDS;
    ui.updateTimerDisplay(timerEl, timeLeft);
    timerInterval = setInterval(() => {
      timeLeft -= 1;
      ui.updateTimerDisplay(timerEl, Math.max(timeLeft, 0));
      if (timeLeft <= 0) {
        stopRoundTimer();
        roundHistory.push({
          direction: currentCondition.direction,
          threshold: currentCondition.threshold,
          hemisphere: currentCondition.hemisphere || null,
          typed: null,
          resolvedCity: null,
          country: null,
          temp: null,
          correct: false,
          timedOut: true,
        });
        endGame("time");
      }
    }, 1000);
  }

  // Fades out and clears the result card a few seconds after a correct
  // guess, so it doesn't linger on screen through the whole next round.
  // Guarded by roundId: if a newer round's result has already replaced this
  // one by the time the timers fire, this is a no-op — it must not wipe out
  // a card that isn't the one it was scheduled for.
  function scheduleResultFadeOut() {
    const revealRoundId = roundId;
    setTimeout(() => {
      if (roundId !== revealRoundId) return;
      resultEl.classList.add("geo-result-fade-out");
      setTimeout(() => {
        if (roundId !== revealRoundId) return;
        resultEl.innerHTML = "";
        resultEl.classList.remove("geo-result-fade-out");
      }, RESULT_FADE_MS);
    }, RESULT_VISIBLE_MS);
  }

  function newCondition() {
    roundId += 1;
    setRoundLive(true);
    playControlsEl.style.display = ""; // undo endGame()'s hide, in case this round follows one that ended
    const direction = nextDirection;
    nextDirection = direction === "above" ? "below" : "above"; // strictly alternate next round

    // Streak >= TOUGH_STREAK means 10 correct answers are already banked,
    // so this is the 11th-or-later question this run — tough mode.
    if (streak >= TOUGH_STREAK) {
      const hemisphere = nextHemisphere;
      nextHemisphere = hemisphere === "north" ? "south" : "north"; // strictly alternate next round
      const threshold = pickThreshold(usedToughThresholds, direction, TOUGH_MIN_THRESHOLD, TOUGH_MAX_THRESHOLD);
      currentCondition = { direction, threshold, hemisphere };
    } else {
      const threshold = pickThreshold(usedThresholds, direction, MIN_THRESHOLD, MAX_THRESHOLD);
      currentCondition = { direction, threshold };
    }
    ui.renderGameCondition(conditionEl, currentCondition);
    hintEl.textContent = "";
    cityInput.value = "";
    cityInput.focus();
    startRoundTimer();
  }

  // Used any time there's no live round to guess against — before Start
  // Game is ever pressed, or after a run has ended. A plain lookup with no
  // judging and no effect on any game state (country tally, city counts,
  // used-cities list): exactly the same thing typing into the main
  // Weather.JS search box would do.
  async function runPlainSearch(typed) {
    submitBtn.disabled = true;
    try {
      const data = await ft.getCurrent(typed);
      ui.renderGameCard(resultEl, data, {});
    } catch (err) {
      ui.showError(err.message, resultEl);
    }
    submitBtn.disabled = false;
  }

  async function submitGuess() {
    const typed = cityInput.value.trim();
    if (!typed) {
      hintEl.textContent = "Type a city name.";
      return;
    }

    if (!roundLive) {
      hintEl.textContent = "";
      await runPlainSearch(typed);
      return;
    }

    if (usedCities.has(typed.toLowerCase())) {
      hintEl.textContent = `You've already used "${typed}" this session. Try a different city.`;
      return;
    }

    hintEl.textContent = "";
    submitBtn.disabled = true;
    const thisRound = roundId;
    const data = await ft.getCurrentForGame(typed);
    submitBtn.disabled = false;

    // The round timer ran out (or the game was restarted) while this guess
    // was in flight — it's no longer relevant, so drop it silently.
    if (thisRound !== roundId) return;

    if (!data) {
      hintEl.textContent = `Nothing found for "${typed}". Try another city.`;
      return;
    }

    // A differently-typed query can still resolve to a place already used
    // this session (e.g. "Auckland" then "Auckland,NZ") — catch that too,
    // now that we know its canonical name.
    if (usedCities.has(data.name.toLowerCase())) {
      hintEl.textContent = `You've already used ${data.name} this session. Try a different city.`;
      return;
    }
    usedCities.add(typed.toLowerCase());
    usedCities.add(data.name.toLowerCase());

    const countryCode = data.sys.country;
    countryCounts.set(countryCode, (countryCounts.get(countryCode) || 0) + 1);
    ui.updateCountryTally(countryTallyEl, countryCounts);

    const cityKey = `${data.name}|${countryCode}`;
    const isNewCity = recordCityAttempt(cityKey);
    citiesThisRun.add(cityKey);

    const actual = data.main.temp;
    // Inclusive at the threshold itself — a reading exactly AT 14°C counts
    // as satisfying "ABOVE 14°C", not just readings strictly past it.
    const tempCorrect = currentCondition.direction === "above"
      ? actual >= currentCondition.threshold
      : actual <= currentCondition.threshold;

    // Tough rounds (currentCondition.hemisphere set) need both the
    // temperature condition AND the hemisphere condition satisfied. Equator
    // (lat 0) counts as northern, matching the >= 0 convention ui.js
    // already uses for daylight calculations.
    let correct = tempCorrect;
    if (currentCondition.hemisphere) {
      const northern = data.coord.lat >= 0;
      const hemisphereCorrect = currentCondition.hemisphere === "north" ? northern : !northern;
      correct = tempCorrect && hemisphereCorrect;
    }

    roundHistory.push({
      direction: currentCondition.direction,
      threshold: currentCondition.threshold,
      hemisphere: currentCondition.hemisphere || null,
      typed,
      resolvedCity: data.name,
      country: countryCode,
      temp: actual,
      correct,
      timedOut: false,
    });

    stopRoundTimer();
    ui.renderGameCard(resultEl, data, { correct, isNewCity });
    recordAttempt(correct);

    if (correct) {
      streak += 1;
      ui.updateStreakDisplay(streakEl, streak);
      if (streak > highScore) {
        highScore = streak;
        localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
        ui.updateHighScoreDisplay(highScoreEl, highScore, { pulse: true });
      }
      // This is the point a requested pause takes effect: the attempt is
      // settled, so freezing here can't buy thinking time on a live round.
      if (pausePending) {
        enterPause();
      } else {
        newCondition();
        scheduleResultFadeOut();
      }
    } else {
      endGame();
    }
  }

  // ---- Pause ---------------------------------------------------------------

  function setPausePending(pending) {
    pausePending = pending;
    ui.updatePauseButton(pauseBtn, pending);
  }

  // Clicking Pause arms it; clicking again before the round settles calls it
  // off, so a mis-click doesn't force you to sit through a pause screen.
  function togglePause() {
    if (paused) return;
    setPausePending(!pausePending);
  }

  // Outside a live round the leaderboard already shows itself automatically
  // (see the Leaderboard.showPanel()/hidePanel() calls below) — this is
  // only for peeking at it mid-round without pausing or otherwise touching
  // the round in progress: the timer keeps running underneath it.
  let leaderboardPeeked = false;
  function toggleLeaderboardPeek() {
    if (typeof Leaderboard === "undefined") return;
    leaderboardPeeked = !leaderboardPeeked;
    leaderboardPeekBtn.textContent = leaderboardPeeked ? "\u{1F3C6} Hide Leaderboard" : "\u{1F3C6} Show Leaderboard";
    if (leaderboardPeeked) {
      Leaderboard.showPanel();
    } else {
      Leaderboard.hidePanel();
    }
  }

  function enterPause() {
    paused = true;
    setPausePending(false);
    setRoundLive(false);
    roundId += 1; // no round is live while paused — drop anything still in flight
    stopRoundTimer();
    ui.renderPauseScreen(pausedEl, streak);
    ui.renderInsights(insightsEl, stats());
    insightsEl.style.display = "block";
    if (typeof Leaderboard !== "undefined") Leaderboard.showPanel();
    playAreaEl.style.display = "none";
    pausedEl.style.display = "block";
  }

  function resume() {
    paused = false;
    pausedEl.style.display = "none";
    insightsEl.style.display = "none";
    if (typeof Leaderboard !== "undefined") Leaderboard.hidePanel();
    playAreaEl.style.display = "";
    clearResult();
    newCondition();
  }

  // ---- Screens -------------------------------------------------------------

  function clearResult() {
    resultEl.innerHTML = "";
    resultEl.classList.remove("geo-result-fade-out");
  }

  function endGame(reason) {
    roundId += 1; // invalidate any guess still in flight for the round that just ended
    stopRoundTimer();
    setPausePending(false);
    setRoundLive(false);
    hintEl.textContent = "";
    gamesPlayed += 1;
    localStorage.setItem(GAMES_PLAYED_KEY, String(gamesPlayed));
    ui.renderGameOver(gameOverEl, streak, { reason, uniqueCities: citiesThisRun.size });
    ui.renderInsights(insightsEl, stats());
    insightsEl.style.display = "block";
    if (typeof Leaderboard !== "undefined") {
      Leaderboard.submitScore(streak, stats());
      Leaderboard.submitDailyScore(streak, stats());
      Leaderboard.submitRunHistory(streak, reason, roundHistory);
      Leaderboard.showPanel();
    }
    // Play area stays visible (unlike Pause/Start) so the last question —
    // the one the run ended on — is still readable next to the result
    // card below; only the now-irrelevant input/timer/hint are hidden.
    playControlsEl.style.display = "none";
    gameOverEl.style.display = "block";
  }

  // Wipes everything scoped to one streak run. The lifetime counters and the
  // high score deliberately survive — they're the whole point of the panels.
  function resetSession() {
    streak = 0;
    usedCities = new Set();
    citiesThisRun = new Set();
    roundHistory = [];
    countryCounts = new Map();
    usedThresholds.above.clear();
    usedThresholds.below.clear();
    usedToughThresholds.above.clear();
    usedToughThresholds.below.clear();
    nextDirection = Math.random() < 0.5 ? "above" : "below";
    nextHemisphere = Math.random() < 0.5 ? "north" : "south";
    paused = false;
    setPausePending(false);
    setRoundLive(false);
    hintEl.textContent = "";
    ui.updateStreakDisplay(streakEl, streak);
    ui.updateCountryTally(countryTallyEl, countryCounts);
    clearResult();
  }

  function showStartScreen() {
    resetSession();
    ui.renderStartScreen(startEl);
    ui.renderInsights(insightsEl, stats());
    startEl.style.display = "block";
    insightsEl.style.display = "block";
    if (typeof Leaderboard !== "undefined") Leaderboard.showPanel();
    playAreaEl.style.display = "none";
    pausedEl.style.display = "none";
    gameOverEl.style.display = "none";
  }

  function startGame() {
    resetSession();
    startEl.style.display = "none";
    pausedEl.style.display = "none";
    gameOverEl.style.display = "none";
    insightsEl.style.display = "none";
    leaderboardPeeked = false;
    leaderboardPeekBtn.textContent = "\u{1F3C6} Show Leaderboard";
    if (typeof Leaderboard !== "undefined") Leaderboard.hidePanel();
    playAreaEl.style.display = "";
    newCondition();
  }

  submitBtn.addEventListener("click", submitGuess);
  cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitGuess();
  });
  pauseBtn.addEventListener("click", togglePause);
  leaderboardPeekBtn.addEventListener("click", toggleLeaderboardPeek);
  // Start/resume/play-again live inside rendered HTML, so they're delegated
  // from their containers rather than bound to elements that get replaced.
  startEl.addEventListener("click", (e) => {
    if (e.target.closest("#gsStartBtn")) startGame();
  });
  pausedEl.addEventListener("click", (e) => {
    if (e.target.closest("#gsResumeBtn")) resume();
  });
  gameOverEl.addEventListener("click", (e) => {
    if (e.target.closest("#gsPlayAgain")) startGame();
  });

  showStartScreen(); // nothing runs until the player hits Start
}
