class Fetch {
  async getCurrent(input) {
    const myKey = "39a9a737b07b4b703e3d1cd1e231eedc";

    //make request to url

    const response = await fetch(
      `https://api.postalpincode.in/pincode/${input}`
    );

    const data = await response.json();

    console.log(data);

    return data;
  }
}
