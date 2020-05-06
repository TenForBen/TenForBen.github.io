package validationofdifferenttestcases;

import java.util.List;

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

public class gpsVier {


	public  String  gpsExcel(String place)throws InterruptedException
	
	{
		frameworktest fwt = new frameworktest();
		
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		driver.manage().deleteAllCookies();
		driver.manage().window().maximize();		
		//Xls_Reader reader= new Xls_Reader("H:\\vsos\\TenForBen.github.io\\EdisonLogs\\gps.xlsx");
		//int rowcount= reader.getRowCount("testdata"); // passing sheet name
		//reader.addColumn("testdata", "status"); //sunBath,20 min lunch, Mixy , mysteryDeutsch caller, 2'oclock strom. taxConsultant, band news., 10k steps, 5k run, near paralysys feel, new routes , naidu video call
	//	int  LR =  reader.getLastRwoNum("Sheet1");
		//System.out.println("The last row by method  " + LR);
		//int LRs=LR+1;
		//System.out.println("The last row count is  " + LRs);
		//String place =reader.getCellData("Sheet1", "Places", LRs);		
		String searchParam=place +" coordinates";		
		String uri= "https://www.google.com/search?q=" + place +"+coordinates&aqs=chrome..69i57j0l4.8570j0j9&sourceid=chrome&ie=UTF-8";
		System.out.println("URL formed -" +uri);
		driver.get(uri);
		driver.findElement(By.xpath("//*[@id=\"Rzn5id\"]/div/a[2]")).click(); 
		System.out.println("Clicked on makeshift  link" );		
		String searchResult= driver.findElement(By.xpath("//*[@id=\"rso\"]/div[1]/div[1]/div[1]/div[1]/div/div[2]/div/div/div/div[1]	")).getText() ;
		//System.out.println("coordinates for "+ place  +  " are "+searchResult);
		
		//reader.setCellData("Sheet1", "Coordinates", LRs, searchResult);
		System.out.println("coordinates updated in excel  ");		
		fwt.quitbrowser(driver);
		return searchResult;
		
	}
	@Test
	public void iteraetor() throws InterruptedException
	{
		Xls_Reader r= new Xls_Reader("H:\\vsos\\TenForBen.github.io\\EdisonLogs\\gps.xlsx");
		int  LR =  r.getLastRwoNum("Sheet1");
		System.out.println("The last row by method  " + LR);
		int LRs=LR+1;
		System.out.println("The last row count is  " + LRs);
		for( int i =1;i<=2;i++)
		{
			String place =r.getCellData("Sheet1", "Places", i+1);	
			System.out.println("Places  at position -"+ i +1+" is " + place);
			String SR=gpsExcel(place);
			r.setCellData("Sheet1", "Coordinates", i+1, SR);
			System.out.println("coordinates updated in excel  ");		
			
		}
		
	}

}
