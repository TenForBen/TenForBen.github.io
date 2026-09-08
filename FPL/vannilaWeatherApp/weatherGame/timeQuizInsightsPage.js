// Time Quiz's Insights page — "Top 10 Fastest Responses" (global,
// world-readable timeQuizFastestAnswers collection — one document per
// correct, scored answer, written by TimeQuizBoard.recordFastestAnswer()
// in timeQuizLeaderboard.js, called from resolveAnswer() in timeQuiz.js)
// plus "Most Used Cities/Countries" (the same paginated tally view
// timeQuizHistory.html already shows, duplicated here rather than
// shared — this page's own self-contained convention). Self-contained
// like every other page in this project: own small escapeHtml/flagEmoji,
// no shared state with timeQuizHistoryPage.js or timeQuizLeaderboard.js.
// Read-only: this page never writes to Firestore.
//
// Fastest Responses needs no sign-in — firestore.rules' `allow read: if
// true` on that collection means a signed-out read already works, so
// loadFastestAnswers() starts immediately, not gated behind auth. The
// tally section's Top Cities column IS gated by master status though,
// which needs a uid — see main()'s anonymous sign-in, done only for
// that check, in parallel with (not blocking) the Fastest Responses load.

const FASTEST_ANSWERS_COLLECTION = "timeQuizFastestAnswers";
const TOP_N = 10;

const CITY_TALLY_COLLECTION = "timeQuizCityTally";
const COUNTRY_TALLY_COLLECTION = "timeQuizCountryTally";
const INSIGHT_PAGE_SIZE = 10;
// Same hardcoded allowlist as historyPage.js's/timeQuizHistoryPage.js's/
// timeQuizLeaderboard.js's own MASTER_UIDS — a fourth independent copy,
// kept in sync by hand (there's no shared source between four separate
// self-contained page scripts). Gates which half of the tally section a
// viewer sees: Top Countries for everyone, Top Cities for masters only.
const MASTER_UIDS = ["B0N7TfmkrXTaYjB2TBCVOBVtIhM2", "MsRKlqcPecOBng8SHekRF5YCVFJ3", "WmoVyIkr2eVCtQHMPwoiTnKWZQp1", "M9odxs0JSTPAnFuewYOCB2BEPR03"];

const configured = typeof firebaseConfig !== "undefined"
  && firebaseConfig.apiKey
  && !firebaseConfig.apiKey.startsWith("REPLACE_ME");

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function flagEmoji(iso2) {
  const cc = String(iso2 || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (cc.length !== 2) return "";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function formatAnsweredAt(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "just now";
  return timestamp.toDate().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// ---- Top 10 Fastest Responses -------------------------------------------

async function loadFastestAnswers(db) {
  const statusEl = document.getElementById("tqiStatus");
  const rowsEl = document.getElementById("tqiFastestRows");
  try {
    const snap = await db.collection(FASTEST_ANSWERS_COLLECTION)
      .orderBy("points", "desc")
      .limit(TOP_N)
      .get();
    if (snap.empty) {
      statusEl.textContent = "No answers recorded yet — be the first!";
      return;
    }
    statusEl.style.display = "none";
    rowsEl.innerHTML = snap.docs.map((doc, i) => {
      const d = doc.data();
      return `
        <tr>
          <td class="tqi-rank">${i + 1}</td>
          <td>${escapeHtml(d.nickname || "Anonymous")}</td>
          <td class="tqi-points">${d.points.toLocaleString()}</td>
          <td>${flagEmoji(d.country)} ${escapeHtml(d.city)}</td>
          <td>${formatAnsweredAt(d.answeredAt)}</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Time Quiz Insights: loadFastestAnswers failed", err);
    statusEl.textContent = err && err.code === "failed-precondition"
      ? "This needs a Firestore index — open the browser console for a one-click link to create it."
      : "Could not load insights.";
  }
}

// ---- Most Used Cities/Countries, paginated -------------------------------
// Ported from timeQuizHistoryPage.js's own copy of this, which is itself
// a duplicate of timeQuiz.html's original start-screen version (since
// removed from there) — three independent copies, per this project's
// self-contained-per-page convention.

const insightPaging = {
  city: { cursors: [null], page: 0 },
  country: { cursors: [null], page: 0 },
};

async function fetchTallyPage(db, collectionName, kind, pageIndex) {
  let query = db.collection(collectionName).orderBy("count", "desc");
  const cursor = insightPaging[kind].cursors[pageIndex];
  if (cursor) query = query.startAfter(cursor);
  const snap = await query.limit(INSIGHT_PAGE_SIZE + 1).get();
  const hasNext = snap.docs.length > INSIGHT_PAGE_SIZE;
  const pageDocs = snap.docs.slice(0, INSIGHT_PAGE_SIZE);
  if (hasNext && !insightPaging[kind].cursors[pageIndex + 1]) {
    insightPaging[kind].cursors[pageIndex + 1] = pageDocs[pageDocs.length - 1];
  }
  return { pageDocs, hasNext };
}

function renderTallyPagination(container, db, kind, pageIndex, hasNext) {
  if (!container) return;
  if (pageIndex === 0 && !hasNext) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = `
    <button type="button" class="tq-page-btn" data-action="prev" ${pageIndex === 0 ? "disabled" : ""}>&larr; Prev</button>
    <span class="tq-page-label">Page ${pageIndex + 1}</span>
    <button type="button" class="tq-page-btn" data-action="next" ${hasNext ? "" : "disabled"}>Next &rarr;</button>
  `;
  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const delta = btn.dataset.action === "next" ? 1 : -1;
      renderTallyPage(db, kind, insightPaging[kind].page + delta);
    });
  });
}

async function renderTallyPage(db, kind, pageIndex) {
  const listEl = document.getElementById(kind === "city" ? "tqiCityList" : "tqiCountryList");
  const pagEl = document.getElementById(kind === "city" ? "tqiCityPagination" : "tqiCountryPagination");
  if (!listEl) return;
  listEl.innerHTML = '<p class="tq-leaderboard-note">Loading&hellip;</p>';
  if (pagEl) pagEl.innerHTML = "";
  try {
    const collectionName = kind === "city" ? CITY_TALLY_COLLECTION : COUNTRY_TALLY_COLLECTION;
    const { pageDocs, hasNext } = await fetchTallyPage(db, collectionName, kind, pageIndex);
    if (pageDocs.length === 0) {
      listEl.innerHTML = pageIndex === 0
        ? '<p class="tq-leaderboard-note">No data yet — be the first!</p>'
        : '<p class="tq-leaderboard-note">No more entries.</p>';
      return;
    }
    insightPaging[kind].page = pageIndex;
    const startRank = pageIndex * INSIGHT_PAGE_SIZE + 1;
    const rows = pageDocs.map((doc, i) => {
      const d = doc.data();
      const label = kind === "city" ? `${flagEmoji(d.country)} ${d.city}` : `${flagEmoji(d.country)} ${d.country}`;
      return `
        <li>
          <span class="tq-leaderboard-rank">${startRank + i}</span>
          <span class="tq-city-name">${escapeHtml(label)}</span>
          <span class="tq-city-count">${d.count.toLocaleString()}</span>
        </li>
      `;
    }).join("");
    listEl.innerHTML = `<ul class="tq-city-list">${rows}</ul>`;
    renderTallyPagination(pagEl, db, kind, pageIndex, hasNext);
  } catch (err) {
    listEl.innerHTML = '<p class="tq-leaderboard-note">Could not load insights.</p>';
    console.error("Time Quiz Insights: renderTallyPage failed", err);
  }
}

// Top Countries shows for every viewer; Top Cities only for a master uid
// — same display-only restriction (not a rules-layer one; both tally
// collections stay world-readable) as timeQuizHistoryPage.js's own
// loadInsights(). The column itself doesn't exist in the DOM at all for
// a non-master viewer, built dynamically here rather than hidden via CSS.
function loadTallies(db, isMaster) {
  const container = document.getElementById("tqiTallies");
  const cityColumnHtml = `
    <div class="tq-insight-col">
      <p class="tq-insight-label">TOP CITIES</p>
      <div id="tqiCityList"><p class="tq-leaderboard-note">Loading&hellip;</p></div>
      <div id="tqiCityPagination" class="tq-lb-pagination"></div>
    </div>
  `;
  container.innerHTML = `
    ${isMaster ? cityColumnHtml : ""}
    <div class="tq-insight-col">
      <p class="tq-insight-label">TOP COUNTRIES</p>
      <div id="tqiCountryList"><p class="tq-leaderboard-note">Loading&hellip;</p></div>
      <div id="tqiCountryPagination" class="tq-lb-pagination"></div>
    </div>
  `;
  const pages = [renderTallyPage(db, "country", 0)];
  if (isMaster) pages.push(renderTallyPage(db, "city", 0));
  return Promise.all(pages);
}

// ---- Bootstrap ------------------------------------------------------

async function main() {
  const statusEl = document.getElementById("tqiStatus");
  if (!configured) {
    statusEl.textContent = "Not configured yet — see firebaseConfig.js.";
    document.getElementById("tqiTallies").innerHTML = '<p class="tq-leaderboard-note">Not configured yet.</p>';
    return;
  }
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // Public, no uid needed — starts immediately rather than waiting on
  // the sign-in below.
  const fastestPromise = loadFastestAnswers(db);

  // Only needed to resolve `isMaster` for the tally section's Top Cities
  // column — a failed/slow sign-in still lets the rest of the page work,
  // just without that column (same as a genuinely non-master viewer).
  let isMaster = false;
  try {
    const auth = firebase.auth();
    await auth.signInAnonymously();
    const user = await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((u) => {
        if (!u) return;
        unsubscribe();
        resolve(u);
      });
    });
    isMaster = MASTER_UIDS.includes(user.uid);
  } catch (err) {
    console.error("Time Quiz Insights: sign-in failed", err);
  }

  await Promise.all([fastestPromise, loadTallies(db, isMaster)]);
}

main().catch((err) => {
  console.error("Time Quiz Insights: main failed", err);
  const statusEl = document.getElementById("tqiStatus");
  statusEl.textContent = "Could not load insights.";
  statusEl.style.display = "block";
});
