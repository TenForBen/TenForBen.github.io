package authorQuotes;

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
public class operaSoccer {
	

	public  String  gpsExcel(String place)throws InterruptedException
	
	{
		frameworktest fwt = new frameworktest();
		
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		driver.manage().deleteAllCookies();
		driver.manage().window().maximize();		
		String searchParam=place +" coordinates";		
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
			System.out.println("Places  at position   "+ i +"   is " + place);
			String SR=gpsExcel(place);                                                               // method call
			r.setCellData("Sheet1", "Coordinates", i, SR);
			System.out.println("coordinates updated in excel  ");	
			 Date date = new Date();
		       System.out.println(new Timestamp(date.getTime()));
		       System.out.println( TimeStamp.getCurrentTime());
		       //TimeStamp  ts = TimeStamp.getCurrentTime();
		   	//r.setCellDataTS("Sheet1", "timeStamp", i, ts);
			
		}
		
	}

	
	public void ExcelCounter() throws InterruptedException
	{
		Xls_Reader r= new Xls_Reader("H:\\vsos\\TenForBen.github.io\\EdisonLogs\\operaSoccer.xlsx");
		int  LR =  r.getLastRwoNum("Sheet1");
		System.out.println("The last row by method  " + LR);
		int LRs=LR+1;
		System.out.println("The last row count is  " + LRs);
		for( int i =2;i<=LRs;i++)
		{
			String place =r.getCellData("Sheet1", "Places", i);	
			System.out.println("Places  at position -"+ i +" is " + place);
			String SR=gpsExcel(place);                                                               // method call
			r.setCellData("Sheet1", "Coordinates", i, SR);
			System.out.println("coordinates updated in excel  ");	
			 Date date = new Date();
		       System.out.println(new Timestamp(date.getTime()));
		       System.out.println( TimeStamp.getCurrentTime());
		       //TimeStamp  ts = TimeStamp.getCurrentTime();
		   	//r.setCellDataTS("Sheet1", "timeStamp", i, ts);
			
		}
		
	}
	
	public  void  bohraa(int place)throws InterruptedException

	{
		frameworktest fwt = new frameworktest();
		//int place=1099585;
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		driver.manage().deleteAllCookies();
		driver.manage().window().maximize();		
		String searchParam=place +" coordinates";	
		//http://www.m.soccerway.mobi/?sport=soccer&page=news&view=article&news_id=1099580&localization_id=www
		String uri= "http://www.m.soccerway.mobi/?sport=soccer&page=news&view=article&news_id=" + place +"&localization_id=www";
		System.out.println("URL formed -" +uri);
		driver.get(uri);
		String HeadLine= driver.findElement(By.xpath("(//div[@class='clearfix'])[5]/h1")).getText() ;
		System.out.println("HEADLINE IS - " +HeadLine );		
		/*driver.findElement(By.xpath("//*[@id=\"Rzn5id\"]/div/a[2]")).click(); 
		System.out.println("Clicked on makeshift  link" );		
		String searchResult= driver.findElement(By.xpath("//*[@id=\"rso\"]/div[1]/div[1]/div[1]/div[1]/div/div[2]/div/div/div/div[1]	")).getText() ;
		System.out.println("coordinates updated in excel  ");		 */
		fwt.quitbrowser(driver);
		//return searchResult;	
		
	}
	@Test
	public void triggerere() throws InterruptedException {
		
		for(int i=1099580;i<1099584;i++)
			bohraa(i);
	}


}







