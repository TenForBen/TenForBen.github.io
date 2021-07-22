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

public class openWeatherAPI  {
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
		WebElement searchBarr=driver.findElement(By.id("searchUser"));
		searchBarr.sendKeys("emar");
		
		WebElement sambi = driver.findElement(By.id("submit"));
 		 sambi.click();
		Thread.sleep(12000);
		fwt.quitbrowser(driver);
		
	}

	/*@AfterClass
	public void teardown() {
		driver.quit();
	}*/
}
