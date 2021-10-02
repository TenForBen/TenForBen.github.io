package validationofdifferenttestcases;

import java.sql.Timestamp;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

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

//gps -0001 to make the code adaptable to take from the last vacant row 
// gps - 0002 to make the error handling incase the browser stops or fails in any of the iterations.
// gps - 0003 to make another sheet available get the entries of all the searched places..

public class FPLscrapper {
	

	public  String  fplExcel(String place,int gw,int crete)throws InterruptedException
	
	{
		frameworktest fwt = new frameworktest();	
		System.out.println("inside iterator method");	
		Xls_Reader r= new Xls_Reader("H:\\vsos\\TenForBen.github.io\\EdisonLogs\\weather.xlsx");
		String snj ="turf";
		int i = crete;
		int  LR =  r.getLastRwoNum(snj);
		System.out.println("The last row by method  " + LR);
		int LRs=LR+1;
		System.out.println("The last row count is  " + LRs);
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe"); // declaring the chrome driver locatoion
		WebDriver driver= new ChromeDriver();// initializing chrome driver
		//driver.manage().deleteAllCookies(); // deleting all cookies
		driver.manage().window().maximize();		// maximizing the window
		String searchParam=place +" coordinates";		// earlier param
		int  gameweek =gw ;
		String  ticker = place;
		String uri= "https://fantasy.premierleague.com/entry/" + ticker + "/event/"+ gameweek ;
		System.out.println("URL formed -" +uri);
		driver.get(uri);
		driver.manage().timeouts().implicitlyWait(2, TimeUnit.SECONDS);		
		String searchReq =place;
		String fp= driver.findElement(By.xpath("//*[@id=\"root\"]/div[2]/div[2]/div[1]/div[3]/div/div[1]/div[1]/div/div ")).getText() ;
		// xpath extraction is leading to error in fp- reload points and reload texts are also coming up.. 
		//best way IMO is using conventional className operator..
		// teamNameXpath - //*[@id="root"]/div[2]/div[2]/div[2]/div/div[1]/div[1]/div[1]/h4
		String[] latestPoints = fp.split("\n");
		fp=latestPoints[0];
		System.out.println("after split  " +latestPoints[0]);
		
		String teamName= driver.findElement(By.xpath("//*[@id=\"root\"]/div[2]/div[2]/div[2]/div/div[1]/div[1]/div[1]/h4")).getText() ;	
		String playerName= driver.findElement(By.xpath("//*[@id=\"root\"]/div[2]/div[2]/div[2]/div/h2")).getText() ;
		////*[@id="root"]/div[2]/div[2]/div[2]/div/div[1]/div[1]/div[2]/ul/li[2]/div
		String transferXpath = "//*[@id=\"root\"]/div[2]/div[2]/div[1]/div[3]/div/div[2]/div[2]/div[2]/div/a";
		String overallPoints= driver.findElement(By.xpath("//*[@id=\"root\"]/div[2]/div[2]/div[2]/div/div[1]/div[1]/div[2]/ul/li[1]/div")).getText() ;
		String overallRank= driver.findElement(By.xpath("//*[@id=\"root\"]/div[2]/div[2]/div[2]/div/div[1]/div[1]/div[2]/ul/li[2]/div")).getText() ;
		String gwTransfer= driver.findElement(By.xpath(transferXpath)).getText() ;
		
		System.out.println("final points -  " +fp);	
		System.out.println("Teams Name is  -  " +teamName);	
		System.out.println("Player Name is  -  " +playerName);	
		System.out.println("overall points -  " +overallPoints);	
		System.out.println("gw transfer -  " +gwTransfer);
		String searchResult= fp +"~" + teamName +"~"+ playerName+"~" + overallPoints  +"~" + overallRank;
		
		
		System.out.println("Final ORPoints "+" are " + fp +" points ");
		r.setCellData(snj, "Latest Score", i, fp);
		r.setCellData(snj, "Manager_Name", i, teamName);
		r.setCellData(snj, "playerName", i, playerName);
		r.setCellData(snj, "overallRank", i, overallRank);
		r.setCellData(snj, "overallPoints", i, overallPoints);
		r.setCellData(snj, "gwXfr", i, gwTransfer);
		fwt.quitbrowser(driver);
		
		
		return searchResult; // stores the value of searchResult in SR string  in teh iterator method
		// for multiple return we can condense the the two varriable temp and coords in one and then split in the main mehtod.
		
		
	}
	
	@Test
	public void iteraetor() throws InterruptedException
	{
		System.out.println("inside iterator method");	
		Xls_Reader r= new Xls_Reader("H:\\vsos\\TenForBen.github.io\\EdisonLogs\\weather.xlsx");
		String snj ="turf";
		int  LR =  r.getLastRwoNum(snj);
		System.out.println("The last row by method  " + LR);
		int LRs=LR+1;
		System.out.println("The last row count is  " + LRs);
		int numVar = 2;
		int gw=7;		
		for( numVar =1;numVar<=1;numVar++)
		{
				for( int i =2;i<=LRs;i++)
				{
							String place =r.getCellData(snj, "Manager_iD", i);	
							System.out.println("Places  at position "+ i +" is " + place);
							String receivedValue=fplExcel(place,gw,i);
							String[] result = receivedValue.split("~");
						
							
											
				}
			Thread.sleep(100);
		}
		String s1="Sheet1";
		String s2="Sheet2";
		 //swicherr(s1,s2);
		
		
		
		
	}
	
}
