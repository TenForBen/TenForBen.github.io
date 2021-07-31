class UI {
  constructor() {
    this.uiContainer = document.getElementById("content");
    this.city;
    this.defaultCity = "London";
  }

  populateUI(data) {
    //de-structure vars

    //add them to inner HTML

    this.uiContainer.innerHTML = `
        
        <div class="card mx-auto mt-5" style="width: 20rem;">
            <div class="card-body justify-content-center">
                <h5 class="card-title"><b id="placeName">${data.name}</b> , <u>  ${data.sys.country}</u>   </h5>
                <p id="xPat">  ${data.coord.lat},${data.coord.lon}   </p>
                <h6 class="card-subtitle mb-2 text-muted">current Temperature <p id="cuwt">${data.main.temp}.</p> and feels like  ${data.main.feels_like}</h6>
                <h6 class="card-subtitle mb-2 text-muted">Highs of ${data.main.temp_max}. Lows of ${data.main.temp_min}</h6>
                <p class="card-text ">Weather conditions are described as: ${data.weather[0].description}</p>
                <p class="card-text " id="art"> latitude: ${data.coord.lat} AND longitude: ${data.coord.lon}</p>

                
            </div>
        </div>
        
        
        `;

        document.getElementById("art").style.color="red"
        document.getElementById("cuwt").style.color="green"
        document.getElementById("cuwt").style.fontSize="300%"
        document.getElementById("placeName").style.color="orange"
        document.getElementById("placeName").style.fontSize="200%"
  }

  clearUI() {
    uiContainer.innerHTML = "";
  }

  saveToLS(data) {
    localStorage.setItem("city", JSON.stringify(data));
  }

  getFromLS() {
    if (localStorage.getItem("city" == null)) {
      return this.defaultCity;
    } else {
      this.city = JSON.parse(localStorage.getItem("city"));
    }

    return this.city;
  }

  clearLS() {
    localStorage.clear();
  }
}
