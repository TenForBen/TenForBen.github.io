package com.test;

import org.testng.annotations.Test;
import org.testng.annotations.Test;
import org.testng.annotations.Test;
import java.util.concurrent.TimeUnit;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.AfterTest;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.BeforeSuite;
import org.testng.annotations.Test;

public class ValidateLogin {
	
 WebDriver driver;
	
	@BeforeMethod
	public void setup() {
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		 driver= new ChromeDriver();
		driver.manage().deleteAllCookies();
		driver.manage().window().maximize();
		String url ="https://tenforben.github.io/Movies/HoMe.html";
		driver.get(url);
		driver.manage().timeouts().pageLoadTimeout(40, TimeUnit.SECONDS);
		
	}
	
	@Test(priority=1)
	public void login() throws InterruptedException{
		WebElement Login= driver.findElement(By.xpath("(//button)[1]"));     
		Login.click();// Clicking login button; 
		Thread.sleep(5000);
		System.out.println("The login button is clicked");
			
	}
	
	@Test(priority=2)
	public void imagedisplay() throws InterruptedException {
		driver.findElement(By.xpath("(//button)[1]")).click();     // Clicking login button;
		Thread.sleep(5000);
		boolean result = driver.findElement(By.xpath("//div[@class='imgcontainer']//img")).isDisplayed();                       // to check the availability of image
		System.out.println("The result of boolean is" +result);
	}
	
	@Test(priority=3)
	public void imageattri() {
		String imagename= driver.findElement(By.xpath("//div[@class='imgcontainer']//img")).getAttribute("src");
		System.out.println("Image attribute is " +imagename);
	}
	
	@Test(priority=4)
	public void title() {
		String gtitle= driver.getTitle();
		System.out.println(gtitle);	
	}
	
	@AfterMethod 
	public void teardown(){
		driver.quit();
	}
	
	
	/*@BeforeTest
	public void enterurl()
	{
		
	} */

	/*@Test
	public void login()
	{
		String title= driver.getTitle();
		System.out.println("The title of this website is "+title);
		
		//	
	} */
	/* @Test(priority=2)
	public void gettitle()
	{
		String title= driver.getTitle();
		System.out.println("The title of this website is "+title);
	} */
}
	
	
	/*@AfterTest
	public void deleteallcookies()
	{
		driver.manage().deleteAllCookies();
	}
	
	@AfterClass
	public void closebrowser()
	{
		driver.close();
	}
}
*/
