// Fetches current weather for every stop in stops.json and writes the
// result to weatherData.json, which the page reads at load time. Same
// pattern as ../mangalaExpress/scrapeWeather.js — a periodic snapshot
// from a hand-run or scheduled-workflow run, not a live per-visitor call.
//
// Run manually from this folder: `node scrapeWeather.js`
//
// Keyed by `order` (route position), same reasoning as
// ../mangalaExpress/scrapeWeather.js — several stops share a state
// (Odisha has 7 of the 16), and this is a route, not a ranked set.

const fs = require("fs");
const path = require("path");

// Same free-tier key every other scrapeWeather.js in this app already
// ships to the browser — reusing it here doesn't expose anything new.
const API_KEY = "39a9a737b07b4b703e3d1cd1e231eedc";
const DELAY_MS = 1100; // keeps us under OpenWeather's free-tier 60-calls/minute limit

const STOPS_PATH = path.join(__dirname, "stops.json");
const OUTPUT_PATH = path.join(__dirname, "weatherData.json");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWeather(stop) {
  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${stop.lat}&lon=${stop.lon}&units=metric&appid=${API_KEY}`;

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

async function main() {
  const stops = JSON.parse(fs.readFileSync(STOPS_PATH, "utf8"));
  const existing = fs.existsSync(OUTPUT_PATH)
    ? JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"))
    : { generatedAt: null, byOrder: {} };

  const byOrder = { ...existing.byOrder };
  let failures = 0;

  for (const stop of stops) {
    process.stdout.write(`${stop.station}, ${stop.state} (#${stop.order})... `);
    try {
      byOrder[stop.order] = await fetchWeather(stop);
      console.log(`ok, ${byOrder[stop.order].temp.toFixed(1)}°C`);
    } catch (err) {
      // Keep whatever this stop had from the last successful scrape
      // rather than blanking its row out over one flaky request.
      failures += 1;
      console.log(`FAILED (${err.message}) — keeping previous data`);
    }
    await sleep(DELAY_MS);
  }

  const output = { generatedAt: Math.floor(Date.now() / 1000), byOrder };
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n");
  console.log(`\nWrote ${Object.keys(byOrder).length} entries to ${OUTPUT_PATH}` +
    (failures ? ` (${failures} failed this run, old data kept for those)` : ""));
}

main();
