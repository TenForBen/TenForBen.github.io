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
  const MIN_THRESHOLD = 5;
  const MAX_THRESHOLD = 35;
  const ROUND_SECONDS = 20;

  const conditionEl = document.getElementById("gsCondition");
  const cityInput = document.getElementById("gsCityInput");
  const submitBtn = document.getElementById("gsSubmit");
  const timerEl = document.getElementById("gsTimer");
  const hintEl = document.getElementById("gsHint");
  const resultEl = document.getElementById("gsResult");
  const streakEl = document.getElementById("gsStreak");
  const highScoreEl = document.getElementById("gsHighScore");
  const playAreaEl = document.getElementById("gsPlayArea");
  const gameOverEl = document.getElementById("gsGameOver");

  let streak = 0;
  let highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  let currentCondition = null;
  let timeLeft = ROUND_SECONDS;
  let timerInterval = null;

  // Bumped every time a round starts or ends, so a guess whose fetch is
  // still in flight when the round timer runs out (or the game restarts)
  // can tell its answer no longer belongs to the current round and drop it.
  let roundId = 0;

  // Cities already answered with this session (one continuous streak run,
  // cleared on restart) — lowercased so "Auckland" and "auckland" count as
  // the same entry. Keyed on both whatever the player typed AND the API's
  // resolved name, so "Auckland" then "Auckland,NZ" are still caught as the
  // same place even though the raw strings differ.
  let usedCities = new Set();

  // Visible immediately on load, before the first question is even
  // generated — the high score should always be there for motivation.
  ui.updateHighScoreDisplay(highScoreEl, highScore);
  ui.updateStreakDisplay(streakEl, streak);

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
        endGame("time");
      }
    }, 1000);
  }

  function newCondition() {
    roundId += 1;
    const direction = Math.random() < 0.5 ? "above" : "below";
    const threshold = Math.floor(Math.random() * (MAX_THRESHOLD - MIN_THRESHOLD + 1)) + MIN_THRESHOLD;
    currentCondition = { direction, threshold };
    ui.renderGameCondition(conditionEl, currentCondition);
    hintEl.textContent = "";
    cityInput.value = "";
    cityInput.focus();
    startRoundTimer();
  }

  async function submitGuess() {
    const typed = cityInput.value.trim();
    if (!typed) {
      hintEl.textContent = "Type a city name.";
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

    const actual = data.main.temp;
    const correct = currentCondition.direction === "above"
      ? actual > currentCondition.threshold
      : actual < currentCondition.threshold;

    stopRoundTimer();
    ui.renderGameCard(resultEl, data, { correct });

    if (correct) {
      streak += 1;
      ui.updateStreakDisplay(streakEl, streak);
      if (streak > highScore) {
        highScore = streak;
        localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
        ui.updateHighScoreDisplay(highScoreEl, highScore, { pulse: true });
      }
      newCondition();
    } else {
      endGame();
    }
  }

  function endGame(reason) {
    roundId += 1; // invalidate any guess still in flight for the round that just ended
    stopRoundTimer();
    ui.renderGameOver(gameOverEl, streak, { reason });
    playAreaEl.style.display = "none";
    gameOverEl.style.display = "block";
  }

  function restart() {
    streak = 0;
    usedCities = new Set();
    ui.updateStreakDisplay(streakEl, streak);
    resultEl.innerHTML = "";
    gameOverEl.style.display = "none";
    playAreaEl.style.display = "";
    newCondition();
  }

  submitBtn.addEventListener("click", submitGuess);
  cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitGuess();
  });
  gameOverEl.addEventListener("click", (e) => {
    if (e.target.closest("#gsPlayAgain")) restart();
  });

  newCondition(); // kick off round 1
}
