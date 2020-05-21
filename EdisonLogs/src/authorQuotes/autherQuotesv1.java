package authorQuotes;


import java.util.List;
import java.util.concurrent.TimeUnit;

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

public class autherQuotesv1 {

	@Test
	public  void autorQUotes()throws InterruptedException
	
	{
		frameworktest fwt = new frameworktest();
		
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		driver.manage().deleteAllCookies();
		driver.manage().window().maximize();		
		//Xls_Reader reader= new Xls_Reader("H:\\vsos\\TenForBen.github.io\\EdisonLogs\\gps.xlsx");
		//int rowcount= reader.getRowCount("testdata"); // passing sheet name
		//reader.addColumn("testdata", "status"); //sunBath,20 min lunch, Mixy , mysteryDeutsch caller, 2'oclock strom. taxConsultant, band news., 10k steps, 5k run, near paralysys feel, new routes , naidu video call
	/*	int  LR =  reader.getLastRwoNum("Sheet1");
		System.out.println("The last row by method  " + LR);
		int LRs=LR+1;
		System.out.println("The last row count is  " + LRs);
		String place =reader.getCellData("Sheet1", "Places", LRs);		
		String searchParam=place +" coordinates";		
		String uri= "https://www.google.com/search?q=" + place +"+coordinates&aqs=chrome..69i57j0l4.8570j0j9&sourceid=chrome&ie=UTF-8";
		System.out.println("URL formed -" +uri);*/
		String url ="https://www-5eb3b7359f390c51aeb5c034.recruit.eb7.io";
		driver.get(url);
		driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);
		
		///	/p[contains(@class,'quotes__title')]
		WebElement content= driver.findElement(By.xpath("//p[@class=\'quotes__title\']"));
		if(!content.getTagName().contains("input"))
			System.out.println("Its a non-editable paragraph");
		
		
		driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);
		WebElement addData=driver.findElement(By.id("show-modal"));
		addData.click();
		System.out.println("clicked on the button  " );
		WebElement Author=driver.findElement(By.id("autorInput"));
		Author.sendKeys("wentworths");
		WebElement quoteInput=driver.findElement(By.id("quoteInput"));
		quoteInput.sendKeys("seems to be like thasssts");
		//$("#quoteInput").value="abraham lincoln was a great Man"
		 List<WebElement> errorlist= driver.findElements(By.className("modal-footer"));
		 errorlist.get(0).click();
   		 int errnum= errorlist.size();
   		 for(int i=0; i<=errnum;i++)
   		 {
   			 //errorlist.get(0).click();
   			 //System.out.println("The total error text: " +errnum);
   			// System.out.println("The error texts are: " +errortext);
   		 }
		
		
		
		
		
		/*driver.findElement(By.xpath("//*[@id=\"Rzn5id\"]/div/a[2]")).click(); 
		System.out.println("Clicked on makeshift  link" );		
		String searchResult= driver.findElement(By.xpath("//*[@id=\"rso\"]/div[1]/div[1]/div[1]/div[1]/div/div[2]/div/div/div/div[1]	")).getText() ;
		System.out.println("coordinates for "+ place  +  " are "+searchResult);
		reader.setCellData("Sheet1", "Coordinates", LRs, searchResult);
		System.out.println("coordinates updated in excel  ");		*/
		fwt.quitbrowser(driver);
		
	}

}
