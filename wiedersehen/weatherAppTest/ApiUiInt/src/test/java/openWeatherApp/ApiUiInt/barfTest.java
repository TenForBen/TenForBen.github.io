package openWeatherApp.ApiUiInt;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.annotations.Test;



public class barfTest {

	@Test
	public void countryCodeInclusionI() 
	{
		System.out.println("-------------Test4-----------Imperial------this test is to test input value with City,countryCode------------------------------------------------");
	}
	
	@Test
	public void countryCodeInclusionPI() 
	{
		System.out.println("-------------Test5-----with Params------Imperial------this test is to test input value with City,countryCode------------------------------------------------");
	}
	@Test
	public void normalInput() throws InterruptedException 
	{
		System.out.println("------------Test1---------------------this test is to test Normal input--------------------------------");	
		frameworktest fwt = new frameworktest();
			System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe"); // declaring the chrome driver locatoion
			WebDriver driver= new ChromeDriver();// initializing chrome driver
			//driver.manage().deleteAllCookies(); // deleting all cookies
			driver.manage().window().maximize();		// maximizing the window
			String place = "karachi";
			String searchParam=place +" coordinates";		// earlier param
			String uri= "https://tenforben.github.io/FPL/vannilaWeatherApp/index.html";
			System.out.println("URL formed -" +uri);
			driver.get(uri);
			String brooks =place;
			String searchReq =brooks;
			System.out.println("Place is  " + brooks);
			WebElement searchBarr=driver.findElement(By.id("searchUser"));
			searchBarr.sendKeys(searchReq);		
			WebElement sambi = driver.findElement(By.id("submit"));
			 sambi.click();
			 Thread.sleep(2000);
			//String searchR= driver.findElement(By.xpath("/html/body/div[3]/div/div/p[1]")).getText() ;
			WebElement  coords= driver.findElement(By.id("xPat"));
			 //document.getElementById("cuwt").innerText
			 WebElement  searchResonse= driver.findElement(By.id("cuwt"));
			 WebElement  CountryC= driver.findElement(By.id("landen"));
			 String string_CC = CountryC.getText(); 
			 String searchRes = searchResonse.getText(); 		
			 String loc = coords.getText(); 	
			String searchResult= searchRes +" " + loc +" " + string_CC;
			System.out.println("CUrrent temperature  updated in excel  ");		
			String receivedValue=searchResult;

			String[] result = receivedValue.split(" ");
			String SR =result[0];
			System.out.println("weather "+" is " + SR +" degrees ");
			String Coords =result[1];//location
			String nation =result[2]; // country codeq
			System.out.println("location is " + Coords +" Lat/Longitude ");
			fwt.quitbrowser(driver);
			
		
	}
	
	
	
}
