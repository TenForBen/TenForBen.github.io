class UI {
  constructor() {
    this.uiContainer = document.getElementById("content");
    this.city;
    this.defaultCity = "London";
  }

  populateUI(data) {
    //de-structure vars

    //add them to inner HTML
    
    var vbl =  data.sys.sunrise;
               let unix_timestamp = vbl;

             //epocher(vbl);
             var date = new Date(unix_timestamp * 1000);
         // Hours part from the timestamp
         var hours = date.getHours();
         // Minutes part from the timestamp
         var minutes = "0" + date.getMinutes();
         // Seconds part from the timestamp
         var seconds = "0" + date.getSeconds();

         // Will display time in 10:30:23 format
         var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
         console.log(`sunrise at ${data.name} is ${vbl} which is ` );
         console.log(formattedTime);
         var trans =data.sys.sunset;
         console.log(` ${data.name} , sun sets at  is ${trans} which is `);
         var dayLength = (trans-vbl)
         console.log(` ${data.name} , daylength is  ${dayLength} `);
         var vbl1 =  dayLength;
               let unix_timestamp1 = vbl1;
               //epocher(vbl);
             var date = new Date(unix_timestamp1 * 1000);
         // Hours part from the timestamp
         var hours1 = date.getHours();
         // Minutes part from the timestamp
         var minutes1 = "0" + date.getMinutes();
         // Seconds part from the timestamp
         var seconds1 = "0" + date.getSeconds();
         // Will display time in 10:30:23 format
         var formattedTime1 = hours1 + ':' + minutes1.substr(-2) + ':' + seconds1.substr(-2);
         console.log(` ${data.name} , daylength is  ${formattedTime1} `);

          // Function to convert decimal degrees to degrees and minutes
                 function convertToDegreesMinutes(coord, isLatitude) {
                     const direction = isLatitude
                         ? (coord >= 0 ? 'N' : 'S')
                         : (coord >= 0 ? 'E' : 'W');
                     const absoluteCoord = Math.abs(coord);
                     const degrees = Math.floor(absoluteCoord);
                     const minutes = ((absoluteCoord - degrees) * 60).toFixed(2);
                     return `${degrees}°${minutes}' ${direction}`;
                 }

                  const latitude = convertToDegreesMinutes(data.coord.lat, true);
                  const longitude = convertToDegreesMinutes(data.coord.lon, false);


//and daylength is ${formattedTime1}

    this.uiContainer.innerHTML = `
        
        <div class="card mx-auto mt-5" style="width: 20rem;">
            <div class="card-body justify-content-center">
                <h5 class="card-title"><b id="placeName">${data.name}</b> , <u id="landen">  ${data.sys.country}</u>   </h5>
                <p id="xPat">  ${latitude}, ${longitude}  </p>
                <h6 class="card-subtitle mb-2 text-muted">current Temperature <p id="cuwt">${data.main.temp}.</p> and feels like  ${data.main.feels_like}</h6>
                <h6 class="card-subtitle mb-2 text-muted">Highs of ${data.main.temp_max}. Lows of ${data.main.temp_min}</h6>
                <p class="card-text ">Weather conditions are described as: ${data.weather[0].description}</p>
                <p class="card-text ">Sunrise (as per GermanTime ) : ${formattedTime}  </p>
                <p class="card-text " id="art">  daylength is  ${formattedTime1}</p>

                
            </div>
        </div>
        
        
        `;

        document.getElementById("art").style.color="red"
        document.getElementById("cuwt").style.color="green"
        document.getElementById("cuwt").style.fontSize="300%"
        document.getElementById("placeName").style.color="orange"
        document.getElementById("placeName").style.fontSize="200%"
        var k = document.getElementById("cuwt").innerText
        //clearUI();
        document.getElementById("searchUser").value=""

        var arse = parseFloat(k)
        if(arse>30)
        {
          document.getElementById("placeName").style.color="red"
          document.getElementById("cuwt").style.color="red"
        }
        if(arse<30)
        {
          document.getElementById("cuwt").style.color="orange"
          document.getElementById("placeName").style.color="orange"          
        }
        if(arse<25)
        {
          document.getElementById("cuwt").style.color="yellow"
          document.getElementById("placeName").style.color="yellow"
          document.getElementById("placeName").style.background="black"
          document.getElementById("cuwt").style.background="black"          
        }
        if(arse<20)
        {
          document.getElementById("cuwt").style.color="green"
          document.getElementById("placeName").style.color="green"          
        }
        if(arse<15)
        {
          document.getElementById("placeName").style.color="lightgreen"
          document.getElementById("cuwt").style.color="lightgreen"          
        }
        
        if(arse<5)
        {
          document.getElementById("placeName").style.color="#1dc59f"
          document.getElementById("cuwt").style.color="#1dc59f"          
        }

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
