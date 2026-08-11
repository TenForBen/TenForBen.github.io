class Fetch {
  async getCurrent(input) {
    const myKey = "39a9a737b07b4b703e3d1cd1e231eedc";

    // units=metric works fine (the old comment was mistaken).
    const url =
      `https://api.openweathermap.org/data/2.5/weather` +
      `?q=${encodeURIComponent(input)}&units=metric&appid=${myKey}`;

    const response = await fetch(url);
    const data = await response.json();

    // fetch() does NOT reject on 404 / 401 / 429 — only on network failure.
    // So we have to inspect the status ourselves and turn a bad one into
    // a thrown Error that app.js can catch in one place.
    if (!response.ok) {
      // 404 gets its own message naming what was actually searched for,
      // rather than OpenWeather's generic lowercase "city not found" —
      // e.g. "daggercoil City not Found" instead of just "city not found".
      if (response.status === 404) {
        throw new Error(`${input} City not Found`);
      }
      // Other failures keep OpenWeather's human-readable reason, e.g.
      // "Invalid API key" (401).
      throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data; // only the success shape ever reaches the caller
  }

  // Used by GeoStreak for free-text guesses. Same lookup as getCurrent(),
  // just bounded to 5s (so a slow/hanging request can't stall a round
  // forever) and returns null instead of throwing on ANY failure — city not
  // found, timeout, offline — so the caller can show a plain "nothing
  // found" message rather than an error page.
  //
  // Note: the 5s timeout races the request but doesn't abort it (no
  // AbortController) — the underlying fetch keeps running in the background
  // if it loses the race. Callers should ignore a result that arrives after
  // their own round has already moved on.
  async getCurrentForGame(cityName) {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("GeoStreak lookup timed out")), 5000)
    );

    try {
      return await Promise.race([this.getCurrent(cityName), timeout]);
    } catch (err) {
      return null;
    }
  }
}
