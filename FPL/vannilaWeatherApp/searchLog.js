// Weather.JS search log — records every search on index.html, and every
// jump through the recent-searches bar (Newer / dropdown / Older, which
// shows the distance from the last place viewed), to Firestore's
// weatherSearches collection in the weathergame-bda93 project.
//
// Each record carries where the search was made from, two ways:
//   - ipLocation: approximate city/region/country from the visitor's IP
//     (ipwho.is, looked up once per visit), for every record;
//   - gps: exact coordinates from the browser, only if the visitor allows
//     the location prompt (asked on their first search, not on page load).
//
// Only master accounts can read the log (isMaster() in firestore.rules),
// on searchLog.html — linked from index.html's footer, shown to masters
// only. Fails silently throughout: logging never affects the weather app.

const SearchLog = (() => {
  const COLLECTION = "weatherSearches";
  // Same allowlist as the history/insights pages; must match isMaster() in
  // firestore.rules. This copy only decides whether the footer link shows.
  const MASTER_UIDS = ["B0N7TfmkrXTaYjB2TBCVOBVtIhM2", "MsRKlqcPecOBng8SHekRF5YCVFJ3", "WmoVyIkr2eVCtQHMPwoiTnKWZQp1", "M9odxs0JSTPAnFuewYOCB2BEPR03"];
  const GPS_WAIT_MS = 10000; // how long a search waits for the prompt to be answered
  const IP_CACHE_KEY = "weatherSearchLog_ipLocation"; // sessionStorage: once per visit

  const configured = typeof firebaseConfig !== "undefined"
    && firebaseConfig.apiKey
    && !firebaseConfig.apiKey.startsWith("REPLACE_ME")
    && location.protocol !== "file:"; // anonymous sign-in hangs on file://

  let db = null;
  let uid = null;
  let signedIn = Promise.resolve();
  let ipLocation = null; // promise
  let gps = { status: "not_asked", coords: null }; // status: not_asked | pending | granted | denied | unavailable
  let gpsRequest = null;

  function init() {
    if (!configured) return;
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    const auth = firebase.auth();
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Sign-in timed out")), 10000));
    const signIn = auth.signInAnonymously().then(() => new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) return;
        uid = user.uid;
        unsubscribe();
        resolve();
      });
    }));
    signedIn = Promise.race([signIn, timeout]).catch((err) => {
      uid = null;
      console.error("SearchLog: sign-in failed", err);
    });
    signedIn.then(showMasterLink);
    ipLocation = lookupIpLocation();
    readGpsIfAlreadyAllowed();
  }

  function showMasterLink() {
    if (!uid || !MASTER_UIDS.includes(uid)) return;
    const link = document.getElementById("searchLogLink");
    if (link) link.style.display = "";
  }

  // ---- Where the search was made from ---------------------------------------

  async function lookupIpLocation() {
    try {
      const cached = sessionStorage.getItem(IP_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (err) { /* ignore */ }
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 6000));
      const response = await Promise.race([fetch("https://ipwho.is/"), timeout]);
      const d = await response.json();
      if (!d || !d.success) return null;
      const result = {
        city: d.city || null,
        region: d.region || null,
        country: d.country || null,
        countryCode: d.country_code || null,
        lat: typeof d.latitude === "number" ? d.latitude : null,
        lon: typeof d.longitude === "number" ? d.longitude : null,
        isp: (d.connection && d.connection.isp) || null,
        timezone: (d.timezone && d.timezone.id) || null,
      };
      try { sessionStorage.setItem(IP_CACHE_KEY, JSON.stringify(result)); } catch (err) { /* ignore */ }
      return result;
    } catch (err) {
      return null;
    }
  }

  function requestGps() {
    if (gpsRequest) return gpsRequest;
    if (!navigator.geolocation) {
      gps = { status: "unavailable", coords: null };
      gpsRequest = Promise.resolve();
      return gpsRequest;
    }
    gps = { status: "pending", coords: null };
    gpsRequest = new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          gps = {
            status: "granted",
            coords: {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              accuracyM: Math.round(pos.coords.accuracy),
            },
          };
          resolve();
        },
        (err) => {
          gps = { status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable", coords: null };
          resolve();
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 },
      );
    });
    return gpsRequest;
  }

  // If the visitor allowed location on an earlier visit, read it now
  // without prompting; otherwise wait for their first search to ask.
  async function readGpsIfAlreadyAllowed() {
    try {
      if (!navigator.permissions) return;
      const status = await navigator.permissions.query({ name: "geolocation" });
      if (status.state === "granted") requestGps();
      if (status.state === "denied") gps = { status: "denied", coords: null };
    } catch (err) { /* ignore */ }
  }

  // Waits for the GPS prompt (up to GPS_WAIT_MS) and the IP lookup, then
  // returns whatever is known.
  async function whereFrom() {
    const gpsDone = gps.status === "denied" || gps.status === "unavailable" ? Promise.resolve() : requestGps();
    await Promise.race([gpsDone, new Promise((resolve) => setTimeout(resolve, GPS_WAIT_MS))]);
    return {
      ipLocation: await ipLocation,
      gps: gps.coords,
      gpsStatus: gps.status,
    };
  }

  // ---- Records ----------------------------------------------------------------

  function placeOf(data) {
    if (!data || !data.coord) return null;
    return {
      name: data.name || null,
      country: (data.sys && data.sys.country) || null,
      lat: data.coord.lat,
      lon: data.coord.lon,
    };
  }

  function nickname() {
    try { return (localStorage.getItem("geoStreakGame_nickname") || "").slice(0, 20) || null; } catch (err) { return null; }
  }

  async function write(record) {
    if (!configured) return;
    try {
      const from = await whereFrom();
      await signedIn;
      if (!uid) return;
      await db.collection(COLLECTION).add({
        ...record,
        ...from,
        uid,
        nickname: nickname(),
        browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
        language: navigator.language || null,
        userAgent: navigator.userAgent.slice(0, 300),
        screen: `${window.screen.width}x${window.screen.height}`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error("SearchLog: write failed", err);
    }
  }

  // A typed search. `data` is the weather response, or null with `error`.
  function logSearch(query, data, error) {
    write({
      type: "search",
      query: String(query).slice(0, 200),
      success: !!data,
      error: error ? String(error).slice(0, 200) : null,
      result: placeOf(data),
      tempC: data && data.main ? Math.round(data.main.temp) : null,
      conditions: data && data.weather && data.weather[0] ? data.weather[0].description : null,
    });
  }

  // A jump through the recent-searches bar. `method` is "dropdown",
  // "newer" or "older"; the card then shows the distance between the two.
  function logHistoryNav(method, fromEntry, toEntry) {
    const from = fromEntry && fromEntry.data ? placeOf(fromEntry.data) : null;
    const to = toEntry && toEntry.data ? placeOf(toEntry.data) : null;
    const distanceKm = from && to && typeof haversineKm === "function"
      ? Math.round(haversineKm(from.lat, from.lon, to.lat, to.lon))
      : null;
    write({
      type: "history_nav",
      method,
      query: String((toEntry && toEntry.q) || (to && to.name) || "").slice(0, 200),
      fromQuery: String((fromEntry && fromEntry.q) || (from && from.name) || "").slice(0, 200),
      from,
      result: to,
      distanceKm,
      success: true,
    });
  }

  init();

  return { logSearch, logHistoryNav };
})();
