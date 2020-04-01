package frameworkpractice;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;

public class setup {
	
	public static  void start(WebDriver driver, String ul)
	{
		 System.out.println("INSIDE START METHOD"); 
		 driver.manage().deleteAllCookies();
			driver.manage().window().maximize();
			driver.get(ul);
	
	 System.out.println("The start process completed"); 
	 
	
}
}