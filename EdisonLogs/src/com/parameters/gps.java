package com.parameters;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
//import validationofdifferenttest;




import com.test.utility.Xls_Reader;

import validationofdifferenttestcases.frameworktest;

public class gps {

	public static void main(String[] args) throws InterruptedException
	
	{
		frameworktest fwt = new frameworktest();
		
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		driver.manage().deleteAllCookies();
		driver.manage().window().maximize();
		String place ="torshavn";
		String searchParam=place +" coordinates";
		//https://www.google.com/search?q=barrow+coordinates&oq=barrow+coordinates&aqs=chrome..69i57j0l4.8570j0j9&sourceid=chrome&ie=UTF-8
		//String uri= "https://www.google.com/search?q=mysore+coordinates&oq=mysore+coordinates&aqs=chrome..69i57j0j69i65j69i60j69i65l2j69i60l2.4398j0j9&sourceid=chrome&ie=UTF-8";
		String uri= "https://www.google.com/search?q=" + place +"+coordinates&aqs=chrome..69i57j0l4.8570j0j9&sourceid=chrome&ie=UTF-8";
		System.out.println("URL formed -" +uri);
		String url ="https://tenforben.github.io/Movies/HoMe.html";
		driver.get(uri);
		
		//driver.findElement(By.xpath("(//button)[1]")).click();
		
		//WebElement s = driver.findElement(ByLinkText);
		driver.findElement(By.xpath("//*[@id=\"Rzn5id\"]/div/a[2]")).click(); 
		System.out.println("Clicked on link" );
		
		String searchResult= driver.findElement(By.xpath("//*[@id=\"rso\"]/div[1]/div[1]/div[1]/div[1]/div/div[2]/div/div/div/div[1]	")).getText() ;
		System.out.println("coordinates for "+ place  +  " are "+searchResult);
		/*	
		List<WebElement> searchBar= driver.findElements(By.xpath("//*[@id=\"tsf\"]/div[2]/div[1]/div[2]/div/div[2]/input"));
		String ddsf = searchBar.get(0).getText();
		System.out.println("total elements of exPath  " +searchBar.size());
		//get data from excel sheet
		Xls_Reader reader= new Xls_Reader("/H:/vsos/TenForBen.github.io/EdisonLogs/src/testdatalogin.xlsx");
		int rowcount= reader.getRowCount("testdata"); // passing sheet name
		reader.addColumn("testdata", "status"); 
	
		for (int rownum=2; rownum<=rowcount;rownum++) 
		{		
			String username= reader.getCellData("testdata", "username", rownum);
			String password= reader.getCellData("testdata", "password", rownum);
			//webelement
			driver.findElement(By.id("u")).clear();
			driver.findElement(By.id("u")).sendKeys(username);
			Thread.sleep(2000);
			driver.findElement(By.id("p")).clear();
			driver.findElement(By.id("p")).sendKeys(password);
			Thread.sleep(2000);
			System.out.println("The login details " +username);
			String passer= ("text" + rownum);
			reader.setCellData("testdata", "status", rownum, "pass");
		}*/
		fwt.quitbrowser(driver);
		
	}

}
