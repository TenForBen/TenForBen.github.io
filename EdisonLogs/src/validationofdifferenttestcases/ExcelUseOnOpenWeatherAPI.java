package validationofdifferenttestcases;

import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeTest;
import org.testng.annotations.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;


import frameworkpractice.setup;

public class ExcelUseOnOpenWeatherAPI  {
	WebDriver driver;
	String url;
	
	
	public void setup() {
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		String url= "https://tenforben.github.io/FPL/vannilaWeatherApp/index.html";
		driver.get(url);
		frameworktest fwt = new frameworktest();
		fwt.hyperlinks(driver);
		
	}

	@Test
	public  void weatherAPI() throws InterruptedException
	{
		System.out.println("tenforBen weather API page");
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		String url= "https://tenforben.github.io/FPL/vannilaWeatherApp/index.html";
		
		/*setup.start(driver,url);
		lesscharacterinusername testcase= new lesscharacterinusername();
		testcase.minimun(driver, url);
		testcase.quitbrowser(driver);*/
		frameworktest fwt = new frameworktest();
		fwt.setup(driver,url);
		fwt.hyperlinks(driver);
		/* 
		 * 
					 * document.getElementById("searchUser").value="st.petersberg"
			document.getElementById("submit").click()
		 * */
		//fwt.emptyuser(driver);
		String searchReq ="baikal";
		WebElement searchBarr=driver.findElement(By.id("searchUser"));
		searchBarr.sendKeys(searchReq);
		
		WebElement sambi = driver.findElement(By.id("submit"));
		 sambi.click();
		 Thread.sleep(2000);
		//String searchR= driver.findElement(By.xpath("/html/body/div[3]/div/div/p[1]")).getText() ;
		 WebElement  searchResonse= driver.findElement(By.id("xPat"));
		 String searchRes = searchResonse.getText();
		System.out.println("coordinates for are "+searchRes);
		//reader.setCellData("Sheet1", "Coordinates", 2, searchResult);
		System.out.println("coordinates updated in excel  ");		
 		
		Thread.sleep(12000);
		fwt.quitbrowser(driver);
		
	}

	/*@AfterClass
	public void teardown() {
		driver.quit();
	}*/
}
