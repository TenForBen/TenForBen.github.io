package validationofdifferenttestcases;

import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeTest;
import org.testng.annotations.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;


import frameworkpractice.setup;

public class EmptyUserCheck  {
	WebDriver driver;
	String url;
	
	@BeforeTest
	public void setup() {
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		String url= "https://tenforben.github.io/Movies/HoMe.html";
		driver.get(url);
		frameworktest fwt = new frameworktest();
		fwt.hyperlinks(driver);
		
	}

	@Test
	public  void FirstFieldValidation() throws InterruptedException
	{
		System.out.println("First field validation start running");
		/* System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		String url= "https://tenforben.github.io/Movies/HoMe.html"; */
		
		/*setup.start(driver,url);
		lesscharacterinusername testcase= new lesscharacterinusername();
		testcase.minimun(driver, url);
		testcase.quitbrowser(driver);*/
		
		//fwt.setup(driver,url);
		//fwt.hyperlinks(driver);
		//fwt.emptyuser(driver);
		//Thread.sleep(2000);
		//fwt.quitbrowser(driver);
		
	}

	/*@AfterClass
	public void teardown() {
		driver.quit();
	}*/
}
