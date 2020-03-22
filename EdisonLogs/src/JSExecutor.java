import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;


public class JSExecutor {

	public static void main(String[] args) {
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		WebDriver driver= new ChromeDriver();
		driver.manage().deleteAllCookies();
		driver.manage().window().maximize();
		driver.get("https://tenforben.github.io/TrainingTurf/mektoub/quora/WhenYouHaveALemon.html");
		WebElement ele= driver.findElement(By.id("LemonH1"));
		String bgcolor= ele.getCssValue("backgroundColor");
		System.out.println(gettitle(driver));
		for(int i=0;i<100;i++) {
			changecolor("rgb(0,200,0)",ele, driver);
			changecolor(bgcolor,ele,driver);
			
		}
		clickele(ele, driver);
		String url ="https://tenforben.github.io/Movies/HoMe.html";
		
		
	}
public static void clickele(WebElement ele, WebDriver driver) {
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
	
}

}
