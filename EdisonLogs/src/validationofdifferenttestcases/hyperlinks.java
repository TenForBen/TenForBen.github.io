package validationofdifferenttestcases;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;

import frameworkpractice.setup;

public class hyperlinks extends setup{
	
	public static void main(String[] args) throws InterruptedException
	{
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		String url= "https://tenforben.github.io/Movies/HoMe.html";
		setup.start(driver,url);
		lesscharacterinusername testcase= new lesscharacterinusername();
		testcase.webelements(driver, url);
		testcase.quitbrowser(driver);
    }

}
