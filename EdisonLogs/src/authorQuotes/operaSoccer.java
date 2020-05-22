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
public class operaSoccer 
{
	public  String  bohraa(int place)throws InterruptedException

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
		String DateofNews= driver.findElement(By.xpath("(//div[@class='clearfix'])[5]/p")).getText() ;
		System.out.println("DateofNews  IS - " +DateofNews );
		fwt.quitbrowser(driver);
		return HeadLine;
		/*driver.findElement(By.xpath("//*[@id=\"Rzn5id\"]/div/a[2]")).click(); 
		System.out.println("Clicked on makeshift  link" );		
		String searchResult= driver.findElement(By.xpath("//*[@id=\"rso\"]/div[1]/div[1]/div[1]/div[1]/div/div[2]/div/div/div/div[1]	")).getText() ;
		System.out.println("coordinates updated in excel  ");		 */
	
		//return searchResult;	
		
	}
	
	public void triggerere() throws InterruptedException
	{
		Xls_Reader r= new Xls_Reader("H:\\vsos\\TenForBen.github.io\\EdisonLogs\\operaSoccer.xlsx");
		int  LR =  r.getLastRwoNum("Sheet1");
		System.out.println("The last row by method  " + LR);
		int LRs=LR+2;
		int starter=1099087;
		System.out.println("New Row is at " + LRs);
		int limiter= LRs+29;
		for(int i=LRs;i<=limiter;i++)
		{
			String innsbruck = bohraa(starter);
			r.setCellData("Sheet1", "NewsHeadline", i, innsbruck);
			//newsId
			String str1 = Integer.toString(starter);
			r.setCellData("Sheet1", "newsId", i,str1);
			starter=starter+1;
			
		}
	}
	//reverse checking -1099740 cd H:/\vsos/\TenForBen.github.io

	@Test
	public void AureviourTtriggerere() throws InterruptedException
	{
		Xls_Reader r= new Xls_Reader("H:\\vsos\\TenForBen.github.io\\EdisonLogs\\operaSoccer.xlsx");
		int  LR =  r.getLastRwoNum("Sheet1");
		System.out.println("The last row by method  " + LR);
		int LRs=LR+2;
		int starter=1099734; // this is for the newsId
		System.out.println("New Row is at " + LRs);
		int limiter= LRs+50; // this one is for rows
		for(int i=LRs;i<=limiter;i++)
		{
			String innsbruck = bohraa(starter);
			r.setCellData("Sheet1", "NewsHeadline", i, innsbruck);
			//newsId
			String str1 = Integer.toString(starter);
			r.setCellData("Sheet1", "newsId", i,str1);
			starter=starter-1; //
			
		}
	}


	
}







