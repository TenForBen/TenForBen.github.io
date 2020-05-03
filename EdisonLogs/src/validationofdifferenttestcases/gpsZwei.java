package validationofdifferenttestcases;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
//import validationofdifferenttest;




import com.test.utility.Xls_Reader;

import validationofdifferenttestcases.frameworktest;

public class gpsZwei {

	public static void main(String[] args) throws InterruptedException
	
	{
		frameworktest fwt = new frameworktest();
		
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		driver.manage().deleteAllCookies();
		driver.manage().window().maximize();		
		Xls_Reader reader= new Xls_Reader("H:\\vsos\\TenForBen.github.io\\EdisonLogs\\gps.xlsx");
		int rowcount= reader.getRowCount("testdata"); // passing sheet name
		//reader.addColumn("testdata", "status"); 
		String place =reader.getCellData("Sheet1", "Places", 2);		
		String searchParam=place +" coordinates";		
		String uri= "https://www.google.com/search?q=" + place +"+coordinates&aqs=chrome..69i57j0l4.8570j0j9&sourceid=chrome&ie=UTF-8";
		System.out.println("URL formed -" +uri);
		String url ="https://tenforben.github.io/Movies/HoMe.html";
		driver.get(uri);
		driver.findElement(By.xpath("//*[@id=\"Rzn5id\"]/div/a[2]")).click(); 
		System.out.println("Clicked on makeshift  link" );		
		String searchResult= driver.findElement(By.xpath("//*[@id=\"rso\"]/div[1]/div[1]/div[1]/div[1]/div/div[2]/div/div/div/div[1]	")).getText() ;
		System.out.println("coordinates for "+ place  +  " are "+searchResult);
		reader.setCellData("Sheet1", "Coordinates", 2, searchResult);
		System.out.println("coordinates updated in excel  ");		
		fwt.quitbrowser(driver);
		
	}

}
