// Stadiums Visited — a Leaflet map with two layers built from the same
// stadiums.json: countries that have at least one visited stadium are
// shaded (click one for the list of stadiums in it, same interaction as
// the filmtourismus.de map this was modelled on), and every stadium also
// gets its own pin with a popup (name, club, city, note), since unlike a
// "did I watch a film set here" map, a stadium is a specific point, not
// just a country-level fact.

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

const map = L.map("smMap", { worldCopyJump: true }).setView([46, 12], 4);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 18,
}).addTo(map);

const markerCluster = L.markerClusterGroup({ maxClusterRadius: 40 });

// Country-shading style: visited countries get a solid highlight; every
// other country is nearly invisible (not removed — its outline still
// gives the map shape) rather than not rendered at all.
const VISITED_STYLE = {
  fillColor: "#f0b429",
  fillOpacity: 0.45,
  color: "#f0b429",
  weight: 1,
};
const UNVISITED_STYLE = {
  fillColor: "#1b2a4a",
  fillOpacity: 0.15,
  color: "#1b2a4a",
  weight: 0.5,
};

function buildCountryPopupHtml(countryName, stadiumsInCountry) {
  const items = stadiumsInCountry
    .map((s) => {
      const club = s.club ? `<span class="sm-club"> — ${escapeHtml(s.club)}</span>` : "";
      return `<li>${escapeHtml(s.name)}${club}, ${escapeHtml(s.city)}</li>`;
    })
    .join("");
  return `
    <div class="sm-popup-country">
      <h4>${escapeHtml(countryName)} — ${stadiumsInCountry.length} stadium${stadiumsInCountry.length === 1 ? "" : "s"}</h4>
      <ul>${items}</ul>
    </div>
  `;
}

function buildStadiumPopupHtml(stadium) {
  const club = stadium.club ? `<p>${escapeHtml(stadium.club)}</p>` : "";
  const note = stadium.note ? `<p><em>${escapeHtml(stadium.note)}</em></p>` : "";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${stadium.lat},${stadium.lon}`;
  return `
    <div class="sm-popup-stadium">
      <h4>${escapeHtml(stadium.name)}</h4>
      ${club}
      <p>${escapeHtml(stadium.city)}${stadium.region ? `, ${escapeHtml(stadium.region)}` : ""}, ${escapeHtml(stadium.country)}</p>
      ${note}
      <a href="${mapsUrl}" target="_blank" rel="noopener">Open in Google Maps</a>
    </div>
  `;
}

Promise.all([
  fetch("stadiums.json").then((res) => res.json()),
  fetch("countries.geo.json").then((res) => res.json()),
])
  .then(([stadiums, countriesGeoJson]) => {
    // country name -> its stadiums, so both the shading layer and the
    // click popup can be built from one pass over the data.
    const byCountry = new Map();
    stadiums.forEach((s) => {
      if (!byCountry.has(s.country)) byCountry.set(s.country, []);
      byCountry.get(s.country).push(s);
    });

    L.geoJSON(countriesGeoJson, {
      style: (feature) => (byCountry.has(feature.properties.name) ? VISITED_STYLE : UNVISITED_STYLE),
      onEachFeature: (feature, layer) => {
        const stadiumsInCountry = byCountry.get(feature.properties.name);
        if (!stadiumsInCountry) return; // no popup for a country with nothing visited
        layer.on("click", (e) => {
          L.popup()
            .setLatLng(e.latlng)
            .setContent(buildCountryPopupHtml(feature.properties.name, stadiumsInCountry))
            .openOn(map);
        });
        layer.on("mouseover", () => layer.setStyle({ fillOpacity: 0.65 }));
        layer.on("mouseout", () => layer.setStyle({ fillOpacity: VISITED_STYLE.fillOpacity }));
      },
    }).addTo(map);

    stadiums.forEach((s) => {
      const marker = L.marker([s.lat, s.lon]);
      marker.bindPopup(buildStadiumPopupHtml(s));
      markerCluster.addLayer(marker);
    });
    map.addLayer(markerCluster);

    const cityCount = new Set(stadiums.map((s) => `${s.city}|${s.country}`)).size;
    document.getElementById("smStats").textContent =
      `${stadiums.length} stadiums across ${byCountry.size} countries and ${cityCount} cities`;
  })
  .catch((err) => {
    document.getElementById("smStats").textContent = "Could not load stadium data.";
    console.error(err);
  });
