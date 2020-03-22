import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;


public class Imagedisplay {

	public static void main(String[] args) 
	{
		
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		driver.manage().deleteAllCookies();
		driver.manage().window().maximize();
		String url ="https://tenforben.github.io/Movies/HoMe.html";
		driver.get(url);
	/*	WebElement ele= driver.findElement(By.id("LemonH1"));
		String bgcolor= ele.getCssValue("backgroundColor");
		System.out.println(gettitle(driver));
		for(int i=0;i<100;i++) {
			changecolor("rgb(0,200,0)",ele, driver);
			changecolor(bgcolor,ele,driver);
			
		}
		clickele(ele, driver); */
		
		driver.findElement(By.xpath("(//button)[1]")).click();            // Clicking login button;
		boolean result = driver.findElement(By.xpath("//div[@class='imgcontainer']//img")).isDisplayed();                       // to check the availability of image
		System.out.println("The result of boolean is" +result);
		String imagename= driver.findElement(By.xpath("//div[@class='imgcontainer']//img")).getAttribute("src");
		System.out.println(imagename);
		String[] filename= imagename.split(".");
		int i;
		for (i=0; i<= filename.length; i++)		
		{
			if (filename[i].contains("png"))
			{
				System.out.println("The image is of .png format");
				System.out.println("The result of splitting the imagename is" +filename[i]);
				break;
			}
			
			else
			{
					System.out.println("The image is not png format");
					
			}
				
		}	
	}
}
/* public static void clickele(WebElement ele, WebDriver driver) {
	JavascriptExecutor js= ((JavascriptExecutor) driver);
	js.executeScript("arguments[0].click();", ele);
}
public static void changecolor (String color, WebElement ele,WebDriver driver) {
	JavascriptExecutor js= ((JavascriptExecutor) driver);
	js.executeScript("arguments[0].style.backgroundColor= '"+color+"'", ele);
}
public static String gettitle(WebDriver driver) {
	JavascriptExecutor js= ((JavascriptExecutor) driver);
	String title= js.executeScript("return document.title;").toString();
	return title;
	
} */


