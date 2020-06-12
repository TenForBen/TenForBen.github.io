package validationofdifferenttestcases;

import java.sql.Timestamp;
import java.util.Date;
import java.util.List;

import org.apache.commons.net.ntp.TimeStamp;
import org.apache.poi.sl.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
//import validationofdifferenttest;
import org.testng.annotations.Test;

import com.test.utility.Xls_Reader;

import validationofdifferenttestcases.frameworktest;

//ciot-0001 to make the code adaptable to take from the last vacant row 
public class gpsVier {
	

	public  String  gpsExcel(String place)throws InterruptedException
	
	{
		frameworktest fwt = new frameworktest();
		
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe"); // declaring the chrome driver locatoion
		WebDriver driver= new ChromeDriver();// initializing chrome driver
		driver.manage().deleteAllCookies(); // deleting all cookies
		driver.manage().window().maximize();		// maximizing the window
		String searchParam=place +" coordinates";		// earlier param
		String uri= "https://www.google.com/search?q=" + place +"+coordinates&aqs=chrome..69i57j0l4.8570j0j9&sourceid=chrome&ie=UTF-8";
		System.out.println("URL formed -" +uri);
		driver.get(uri);
		driver.findElement(By.xpath("//*[@id=\"Rzn5id\"]/div/a[2]")).click(); 
		System.out.println("Clicked on makeshift  link" );		
		String searchResult= driver.findElement(By.xpath("//*[@id=\"rso\"]/div[1]/div[1]/div[1]/div[1]/div/div[2]/div/div/div/div[1]	")).getText() ;
		System.out.println("coordinates updated in excel  ");		
		fwt.quitbrowser(driver);
		return searchResult;
		
	}
	
	public void iteraetor() throws InterruptedException
	{
		Xls_Reader r= new Xls_Reader("H:\\vsos\\TenForBen.github.io\\EdisonLogs\\gps.xlsx");
		int  LR =  r.getLastRwoNum("Sheet1");
		System.out.println("The last row by method  " + LR);
		int LRs=LR+1;
		System.out.println("The last row count is  " + LRs);
		for( int i =2;i<=LRs;i++)
		{
			String place =r.getCellData("Sheet1", "Places", i);	
			System.out.println("Places  at position -"+ i +" is " + place);
			String SR=gpsExcel(place);
			r.setCellData("Sheet1", "Coordinates", i, SR);
			System.out.println("coordinates updated in excel  ");	
			 Date date = new Date();
		       System.out.println(new Timestamp(date.getTime()));
		       System.out.println( TimeStamp.getCurrentTime());
		       //TimeStamp  ts = TimeStamp.getCurrentTime();
		   	//r.setCellDataTS("Sheet1", "timeStamp", i, ts);
			
		}
		
	}

	@Test
	public void tryere() throws InterruptedException
	{
		Xls_Reader r= new Xls_Reader("H:\\vsos\\TenForBen.github.io\\EdisonLogs\\gps.xlsx");
		//int  LR =  r.getLastRwofaColm("Sheet1",2);
		 r.getLastRwofaColm("Sheet1",2);
		//System.out.println("The last row by method  " + LR);
		 //wat we can do is iterate over the elements in the collumn and then break wen cells starts throwing blank values..
		 
	}
}
