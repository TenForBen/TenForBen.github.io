// Fill these in from your own Firebase project's web app config:
// Firebase console -> Project settings -> General -> "Your apps" -> Web
// app -> SDK setup and configuration -> Config.
//
// These values are NOT secret — Firebase's web config identifies which
// project to talk to, the same way the OpenWeatherMap key in ../fetch.js
// already sits in plain text client-side. Actual access control is
// enforced by firestore.rules (see the README's Leaderboard section for
// how to deploy it), not by hiding this object.
//
// Until every REPLACE_ME below is filled in, leaderboard.js detects the
// placeholder and no-ops everywhere — the rest of GeoStreak works exactly
// as before, just without the online leaderboard panel.
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};
