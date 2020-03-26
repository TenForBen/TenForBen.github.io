package com.parameters;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Parameters;
import org.testng.annotations.Test;

public class datadrivenlogin {

	WebDriver driver;
	
	@BeforeMethod
	    public void setup(String url) {
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		driver.manage().deleteAllCookies();
		driver.manage().window().maximize();
		driver.get(url);
		WebElement Login= driver.findElement(By.xpath("(//button)[1]"));     
		Login.click();
	}
	
	  @Test
	   public void login( String username, String password) throws InterruptedException {
		driver.findElement(By.id("u")).clear();
		driver.findElement(By.xpath("//div[@class='container']//input[@id='u']")).sendKeys(username);
		Thread.sleep(5000);
		driver.findElement(By.id("p")).sendKeys(password);
		Thread.sleep(5000);
		driver.findElement(By.xpath("(//button)[2]")).click();
	   }
	  
	  @AfterMethod
	   public void teardown() throws InterruptedException {
		Thread.sleep(5000);
		driver.close();
	   }
	
}
