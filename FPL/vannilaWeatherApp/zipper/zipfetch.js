class Fetch {
  async getCurrent(input) {
    const myKey = "39a9a737b07b4b703e3d1cd1e231eedc";

    //make request to url 
    // lesson learnt with yip query param.. units param dosent work..
    //https://api.openweathermap.org/data/2.5/weather?q=${input}&appid=${myKey}&units=metric
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?zip=${input}&appid=${myKey}&units=metric`
       //`https://api.openweathermap.org/data/2.5/weather?zip=${input}&appid=39a9a737b07b4b703e3d1cd1e231eedc`

      
    );

    const data = await response.json();

    console.log(data);

    return data;
  }
}
