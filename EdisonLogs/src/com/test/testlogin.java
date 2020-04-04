package com.test;

import org.testng.annotations.Test;
import org.testng.annotations.Test;
import org.testng.annotations.Test;
import java.util.ArrayList;
import java.util.Iterator;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

import com.test.utility.testutil;

public class testlogin {
	WebDriver driver;

	@BeforeMethod
	public void Setup() {
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		driver.manage().deleteAllCookies();
		driver.manage().window().maximize();
		String url ="https://tenforben.github.io/Movies/HoMe.html";
		driver.get(url);
		driver.findElement(By.xpath("(//button)[1]")).click();
	}
	
	@DataProvider
	public Iterator<Object[]> getdata() {
		ArrayList <Object[]> data=testutil.datatotest();
		return  data.iterator();
	}
	  
	    @Test(dataProvider= "getdata")
	    public void login(String username, String password) throws InterruptedException {
		driver.findElement(By.id("u")).clear();
		driver.findElement(By.id("u")).sendKeys(username);
		Thread.sleep(2000);
		driver.findElement(By.id("p")).clear();
		driver.findElement(By.id("p")).sendKeys(password);
		Thread.sleep(2000);
		}
	    
	    
			
	    }


