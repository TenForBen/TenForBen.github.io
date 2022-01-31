package PoPoi_The_Sailor_Man;
import org.testng.annotations.Test;

//mport files.payload;

import static io.restassured.RestAssured.given;

import org.testng.annotations.Parameters;
import org.testng.annotations.Test;

import io.restassured.RestAssured;
import io.restassured.path.json.JsonPath;
import werkself.frameworktest;
import werkself.Xls_Reader;
public class appIDEA extends frameworktest {

	
	@Parameters({"lines","ilat"})
	@Test
	public void kerala (String lines)
	{
		int lat=20;
		int punkt=10;
		int sbi=lat+punkt;
		for(int i=lat;i<sbi;i++)
		{
			String latt=String.valueOf(i);
			//rutherford(latt,lines);
			latLoner(latt,lines);
		}
		
	}
	
	public void rutherford (String lat,String lon)
	{
		double latt=Double.parseDouble(lat);
		RestAssured.baseURI ="https://api.openweathermap.org";
		String jagah =
		given().log().all().
		queryParam("lat", latt).queryParam("lon", lon).queryParam("appid", "2b1fd2d7f77ccf1b7de9b441571b39b8").queryParam("lang", "de").queryParam("units", "metric").
		when().get("data/2.5/weather").
		then().assertThat().statusCode(200).extract().response().asString();
		
		JsonPath js = new JsonPath(jagah);
		String asliJagah=js.getString("name");
		System.out.println("extracted place for  latitude " +lat +"  and longitude  " +lon +" is " +asliJagah);
		//double count = js.getInt("main.temp");
		double count = js.getDouble("main.temp");
		System.out.println("/n currentTemp   "+ "\r\n" +count + "\r\n");
		
	}
	@Parameters({"lines","ilat"})
	@Test
	public void latLoner (String lines ,String ilat)
	{
		
		double latt=Double.parseDouble(ilat);
		RestAssured.baseURI ="https://api.openweathermap.org";
		String jagah =
		given().log().all().
		queryParam("lat", latt).queryParam("lon", lines).queryParam("appid", "2b1fd2d7f77ccf1b7de9b441571b39b8").queryParam("lang", "de").queryParam("units", "metric").
		when().get("data/2.5/weather").
		then().assertThat().statusCode(200).extract().response().asString();
		System.out.println("/n");
		System.out.println("\n");
		JsonPath js = new JsonPath(jagah);
		String asliJagah=js.getString("name");
		System.out.println("extracted place for  latitude " +latt +"  and longitude  " +lines +" is " +asliJagah);
		//double count = js.getInt("main.temp");
		System.out.println("in");
		System.out.println("\n");
		String coundry = js.getString("sys.country");
		System.out.println("                                the  Nation of    " +coundry + "\r\n");
		double count = js.getDouble("main.temp");
		
		System.out.println("\n");
		System.out.println("                                currentTemp   "+count + "\r\n");
		Xls_Reader r= new Xls_Reader("H:\\vsos\\TenForBen.github.io\\EdisonLogs\\weather.xlsx");
		//int gw=gameweek;	
		String snj ="Sheet2";
		System.out.println("League Scrapper - " +snj);	
		int  LR =  r.getLastRwoNum(snj);
		System.out.println("The last row by method  " + LR);
		int LRs=LR+1;
		System.out.println("The last row count is LRs " + LRs);
		//weatherWithMetrics(asliJagah);
		r.setCellData(snj, "Places", LRs, asliJagah);
		
	}

	
	@Parameters({"lines","ilat"})
	@Test
	public void tenerLat (String ilat,String lines )
	{
		//int lat=20;
		int lat=Integer.parseInt(ilat);
		int punkt=10;
		int sbi=lat+punkt;
		for(int i=lat;i<sbi;i++)
		{
			String latt=String.valueOf(i);
			//rutherford(latt,lines);
			latLoner(latt,lines);
		}
		
	}
	
	@Parameters({"lines","ilat"})
	@Test
	public void onerLat (String ilat,String lines )
	{
		//int lat=20;
		int lat=Integer.parseInt(ilat);
		int punkt=0;
		int sbi=lat+punkt;
		for(int i=lat;i<=sbi;i++)
		{
			String latt=String.valueOf(i);
			//rutherford(latt,lines);
			latLoner(latt,lines);
		}
		
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
}
