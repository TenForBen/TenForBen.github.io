package openWeatherApp.ApiUiInt;

import static io.restassured.RestAssured.given;

import org.testng.annotations.Parameters;
import org.testng.annotations.Test;

import io.restassured.RestAssured;

public class apeeTest {

	
	@Test
	public void alag ()
	{
		RestAssured.baseURI ="https://api.openweathermap.org";
		given().log().all().
		queryParam("q", "munich").queryParam("appid", "2b1fd2d7f77ccf1b7de9b441571b39b8").
		when().get("data/2.5/weather").
		then().log().all().assertThat().statusCode(200);
	}
	@Parameters({"a"})
	@Test
	public void weatherWithMetrics (String a)
	{
		RestAssured.baseURI ="https://api.openweathermap.org";
		given().log().all().
		queryParam("q", a).queryParam("appid", "2b1fd2d7f77ccf1b7de9b441571b39b8").queryParam("units", "metric").
		when().get("data/2.5/weather").
		then().log().all().assertThat().statusCode(200);
	}
	@Test
	public void weatherWithImperial ()
	{
		RestAssured.baseURI ="https://api.openweathermap.org";
		given().log().all().
		queryParam("q", "munich").queryParam("appid", "2b1fd2d7f77ccf1b7de9b441571b39b8").queryParam("units", "imperial").
		when().get("data/2.5/weather").
		then().log().all().assertThat().statusCode(200);
	}
	
	@Test
	public void Metrics_zip ()
	{
		RestAssured.baseURI ="https://api.openweathermap.org";
		given().log().all().
		queryParam("zip", "110010,IN").queryParam("appid", "2b1fd2d7f77ccf1b7de9b441571b39b8").queryParam("units", "metric").
		when().get("data/2.5/weather").
		then().log().all().assertThat().statusCode(200);
	}
	@Test
	public void Metrics_coords ()
	{
		RestAssured.baseURI ="https://api.openweathermap.org";
		given().log().all().
		queryParam("lat", "12").queryParam("lon", "79").queryParam("appid", "2b1fd2d7f77ccf1b7de9b441571b39b8").queryParam("units", "metric").
		when().get("data/2.5/weather").
		then().log().all().assertThat().statusCode(200);
	}
	
	@Test
	public void Metrics_locId ()
	{
		RestAssured.baseURI ="https://api.openweathermap.org";
		given().log().all().
		queryParam("id", "617094").queryParam("appid", "2b1fd2d7f77ccf1b7de9b441571b39b8").queryParam("units", "metric").
		when().get("data/2.5/weather").
		then().log().all().assertThat().statusCode(200);
	}
	

}
