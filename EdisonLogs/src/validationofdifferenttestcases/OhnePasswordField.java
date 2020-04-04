package validationofdifferenttestcases;

import org.testng.annotations.Test;
import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.annotations.Test;

import frameworkpractice.setup;

public class OhnePasswordField extends setup {
	@Test
	public  void OhnePasswordField() throws InterruptedException
	{
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		String url= "https://tenforben.github.io/Movies/HoMe.html";
		
		/*setup.start(driver,url);
		lesscharacterinusername testcase= new lesscharacterinusername();
		testcase.minimun(driver, url);
		testcase.quitbrowser(driver);*/
		frameworktest fwt = new frameworktest();
		fwt.setup(driver,url);
		fwt.hyperlinks(driver);
		fwt.withoutpass(driver);
		Thread.sleep(2000);
		fwt.quitbrowser(driver);
		
	}
		
	


}
