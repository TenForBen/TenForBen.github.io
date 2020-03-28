package com.parameters;

import org.testng.annotations.Test;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import java.util.ArrayList;
import java.util.Iterator;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import com.test.utility.testutil;
import org.testng.annotations.Test;

public class datadrivenlogin {

	WebDriver driver;
	
	@BeforeClass
	    public void setup() {
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		driver.manage().deleteAllCookies();
		driver.manage().window().maximize();
		 String url= "https://tenforben.github.io/Movies/HoMe.html";
		driver.get(url);
		WebElement Login= driver.findElement(By.xpath("(//button)[1]"));     
		Login.click();
		System.out.println("Before method is executed");
	}
	
	@DataProvider(name="tdata")
	public Iterator<Object[]> tdata() {
		ArrayList<Object[]> abc=testutil.datatotest();
		return abc.iterator();
	}
	
	  @Test(dataProvider= "tdata")
	   public void login( String username, String password) throws InterruptedException {
		driver.findElement(By.id("u")).clear();
		driver.findElement(By.xpath("//div[@class='container']//input[@id='u']")).sendKeys(username);
		Thread.sleep(1000);
		driver.findElement(By.id("p")).sendKeys(password);
		Thread.sleep(1000);
		driver.findElement(By.xpath("(//button)[2]")).click();
		System.out.println("Test annotaion is executed");
	   }
	  
	  
	
}
