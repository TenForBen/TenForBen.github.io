package com.parameters;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;

import com.test.utility.Xls_Reader;

public class registration {

	public static void main(String[] args) throws InterruptedException {
		
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		driver.manage().deleteAllCookies();
		driver.manage().window().maximize();
		String url ="https://tenforben.github.io/Movies/HoMe.html";
		driver.get(url);
		driver.findElement(By.xpath("(//button)[1]")).click();
		
		//get data from excel sheet
		Xls_Reader reader= new Xls_Reader("/H:/vsos/TenForBen.github.io/EdisonLogs/src/testdatalogin.xlsx");
		int rowcount= reader.getRowCount("testdata");
		for (int rownum=2; rownum<=rowcount;rownum++) {		
		
		String username= reader.getCellData("testdata", "username", rownum);
		String password= reader.getCellData("testdata", "password", rownum);
		//webelement
		driver.findElement(By.id("u")).clear();
		driver.findElement(By.id("u")).sendKeys(username);
		Thread.sleep(5000);
		driver.findElement(By.id("p")).clear();
		driver.findElement(By.id("p")).sendKeys(password);
		Thread.sleep(5000);
		System.out.println("The login details " +username);
		}
	}

}
