// The fpl-scrapper project's web app config — Firebase console -> Project
// settings -> General -> "Your apps" -> Web app -> SDK setup and
// configuration -> Config.
//
// Not secret — this identifies which Firestore project to talk to, same
// as GeoStreak's committed firebaseConfig.js (weatherGame/firebaseConfig.js)
// or the OpenWeatherMap key already sitting in plain text in
// ../vannilaWeatherApp/fetch.js. Actual access control is firestore.rules
// (public read, no client write at all — see that file), not secrecy here.
const firebaseConfig = {
  apiKey: "AIzaSyDI0Avfpw1C0XI7krHdcVEKyPD85oWo25A",
  authDomain: "fpl-scrapper-a0f19.firebaseapp.com",
  projectId: "fpl-scrapper-a0f19",
  storageBucket: "fpl-scrapper-a0f19.firebasestorage.app",
  messagingSenderId: "503851401348",
  appId: "1:503851401348:web:1cbb4f1913220d0b8642d1",
};
