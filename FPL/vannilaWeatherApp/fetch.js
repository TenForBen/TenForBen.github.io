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
      // OpenWeather puts a human-readable reason in data.message, e.g.
      // "city not found" (404) or "Invalid API key" (401).
      throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data; // only the success shape ever reaches the caller
  }
}
