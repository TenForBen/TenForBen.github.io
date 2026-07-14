// instantiate classes
const ft = new Fetch();
const ui = new UI();

// grab the input + button
const search = document.getElementById("searchUser");
const button = document.getElementById("submit");

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
