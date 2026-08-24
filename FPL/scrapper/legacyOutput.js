// Converts a scraped league (scrape.js#scrapeLeague's output) into the
// shape the site's existing punkte.html pages already know how to render
// (`var s = [...]`, read by FPL/js/tableMake.js#loader4mgw) and writes
// both that data file and a punkte.html page that loads it — the direct
// replacement for hand-copying the old scraper's per-league .js "DB"
// files into FPL/GW/GW{n}/DB/new/.
//
// Written to FPL/GW/GW{n}/{season}/ rather than the legacy GW{n}/new/
// path, so this season's output never collides with a previous season's
// archived GW{n} data sitting at the same gameweek number.
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// PL seasons start in August — before that month, "this year" is still
// the back half of last season.
export function currentSeason(date = new Date()) {
  const year = date.getUTCFullYear();
  const startYear = date.getUTCMonth() >= 7 /* Aug (0-indexed) */ ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

function formatManagerName(m) {
  return `${m.overallRank}( ${m.overallPoints.toLocaleString("en-GB")} )`;
}

function formatTeam(m) {
  return `${m.teamName}( ${m.playerName} )`;
}

function toLegacyRow(m) {
  const row = {
    manager_Name: formatManagerName(m),
    Teams: formatTeam(m),
    SXL: m.countryCode ?? "countryCode",
    Latp: `${m.gwPoints}\nTotal Points`,
  };
  for (let i = 0; i < 15; i++) {
    const p = m.picks[i];
    row[`Player_${i + 1}`] = p ? `${p.name} ${p.gwPoints}` : "";
  }
  return row;
}

export function toLegacyJs(league) {
  const rows = league.managers.map(toLegacyRow);
  return `var s = ${JSON.stringify(rows, null, 2)};\n`;
}

function htmlFileName(slug, isPrimary) {
  return isPrimary ? "punkte.html" : `punkte_${slug}.html`;
}

function buildPunkteHtml({ entries, activeSlug, season, gameweek }) {
  const primaryName = entries[0].league.name;
  const navButtons = entries
    .map(({ slug, league }, i) => {
      const href = htmlFileName(slug, i === 0);
      const cls = slug === activeSlug ? "btn-success" : "btn-info";
      return `<a id="nav-${slug}" class="btn ${cls}" href="${href}">${league.name}</a>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>FPL ${primaryName}</title>
</head>
<link rel="stylesheet" href="../../../../AufWiedersehen/BootMeister/css/bootstrap.min.css">
<link rel="stylesheet" href="../../../../AufWiedersehen/css/lawrence.css">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="shortcut icon" type="image/x-icon" href="../../../../img/icons/EPL_blue.png">
<script src="../../../../AufWiedersehen/js/jquery-3.1.1.min.js"></script>

<script src="DB/${activeSlug}.js"></script>
<script src="../../../js/tableMake.js"></script>
<link rel="stylesheet" type="text/css" href="../../../css/bekal.css">

<script>
  // newButtons() in tableMake.js hardcodes ".../GW{n}/new/{fileName}" for
  // the prev/next-gameweek links — this page lives in a season-named
  // sibling folder instead, so this override swaps that segment in.
  function newButtons() {
    const tt = document.getElementsByTagName('title')[0].innerText;
    const dm = tt.split("-");
    const callum = dm[dm.length - 1];
    const prevGW = callum - 1;
    const nextGW = parseInt(callum) + 1;
    document.getElementById("barnes").innerText = "Previous GW <- " + prevGW;
    document.getElementById("lowton").innerText = "Next GW -> " + nextGW;
    const fileName = window.location.pathname.split('/').pop();
    document.getElementById("barnes").href = "../../GW" + prevGW + "/${season}/" + fileName;
    document.getElementById("lowton").href = "../../GW" + nextGW + "/${season}/" + fileName;
  }

  // tableMake.js's sortTable_col19() (wired to a click on the header row
  // by loader4mgw) compares cells with Number(), which returns NaN for
  // "80\\nTotal Points" — the exact text every "Latest points" cell holds
  // — so the click never actually reorders anything. This override is
  // identical except for parseInt(), which just reads the leading digits
  // and ignores the rest. Matters most for an h2h league: its row order
  // comes from match wins, not points, so it doesn't already happen to
  // read top-to-bottom by score the way a classic league's rank does.
  function sortTable_col19() {
    const table = document.getElementById("regtable");
    let switching = true;
    while (switching) {
      switching = false;
      const rows = table.rows;
      for (var i = 1; i < rows.length - 1; i++) {
        const x = parseInt(rows[i].getElementsByTagName("TD")[18].innerHTML, 10);
        const y = parseInt(rows[i + 1].getElementsByTagName("TD")[18].innerHTML, 10);
        if (x < y) {
          switching = true;
          break;
        }
      }
      if (switching) {
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      }
    }
  }
</script>

<body onload='loader4mgw()'>

<a id="scrapperHome" class="btn btn-warning" href="../../../scrapper/index.html">Home</a>
<div>
    <a id="barnes" class="btn btn-info" href="#">Table button</a>
    <a id="lowton" class="btn btn-success" href="#">Table toggler</a>
</div>
${navButtons}
    <table id="regtable" class="table table-hover table-bordered">
        <thead>
            <tr>
                <th>TeamName</th>
                <th>ManagerId</th>
                <th>Nation</th>
                <th>Player_1</th>
                <th>Player_2</th>
                <th>Player_3</th>
                <th>Player_4</th>
                <th>Player_5</th>
                <th>Player_6</th>
                <th>Player_7</th>
                <th>Player_8</th>
                <th>Player_9</th>
                <th>Player_10</th>
                <th>Player_11</th>
                <th>Player_12</th>
                <th>Player_13</th>
                <th>Player_14</th>
                <th>Player_15</th>
                <th title="Click any header cell to sort by this column" style="cursor:pointer">Latest points ⇅</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>

</body>
</html>
`;
}

// leagues: [{ league, slug }, ...] — league is scrapeLeague()'s output,
// slug is the short name used for the DB file and, for every league
// after the first, the punkte_{slug}.html filename (the first league
// gets the bare punkte.html, same convention the legacy pages used).
export function writeLegacyPages({ leagues, gameweek, siteRoot, season = currentSeason() }) {
  const dir = join(siteRoot, "FPL", "GW", `GW${gameweek}`, season);
  mkdirSync(join(dir, "DB"), { recursive: true });

  for (const { league, slug } of leagues) {
    writeFileSync(join(dir, "DB", `${slug}.js`), toLegacyJs(league));
  }

  leagues.forEach(({ slug }, i) => {
    const html = buildPunkteHtml({ entries: leagues, activeSlug: slug, season, gameweek });
    writeFileSync(join(dir, htmlFileName(slug, i === 0)), html);
  });

  return dir;
}

function buildHomeHtml({ leagues, gameweek, season }) {
  const leagueLinks = leagues
    .map(({ league, slug }, i) => {
      const href = `../GW/GW${gameweek}/${season}/${htmlFileName(slug, i === 0)}`;
      return `      <a class="btn btn-info btn-lg" style="margin:8px" href="${href}">${league.name}</a>`;
    })
    .join("\n");

  // Bootstrap 3.3.7 markup (bootstrap.min.css here is v3.3.7, same as
  // every other legacy page — BS4/5 utility classes like navbar-dark,
  // bg-primary, or btn-outline-light are silently no-ops on it).
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>FPL Scrapper</title>
<link rel="stylesheet" href="../../AufWiedersehen/BootMeister/css/bootstrap.min.css">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="shortcut icon" type="image/x-icon" href="../../img/icons/EPL_blue.png">
</head>
<body>
  <nav class="navbar navbar-inverse">
    <div class="container-fluid">
      <div class="navbar-header">
        <a href="index.html" class="navbar-brand">FPL Scrapper</a>
      </div>
      <a href="../vannilaWeatherApp/index.html" class="btn btn-info navbar-btn navbar-right">Weather App</a>
    </div>
  </nav>
  <div class="container text-center">
    <h1>Latest scrape</h1>
    <p class="lead">Gameweek ${gameweek} &middot; ${season} season</p>
${leagueLinks}
  </div>
</body>
</html>
`;
}

// Landing page for this folder — a link to each league's freshest
// punkte.html plus a way back out to the site's other app (vannilaWeatherApp)
// living alongside it under FPL/. Regenerated every run so it always
// points at the gameweek this run just scraped, not a stale one. Named
// index.html (not home.html) so `npx serve` (or any static server) picks
// it up as the folder's default page.
export function writeHomePage({ leagues, gameweek, siteRoot, season = currentSeason() }) {
  const path = join(siteRoot, "FPL", "scrapper", "index.html");
  writeFileSync(path, buildHomeHtml({ leagues, gameweek, season }));
  return path;
}
