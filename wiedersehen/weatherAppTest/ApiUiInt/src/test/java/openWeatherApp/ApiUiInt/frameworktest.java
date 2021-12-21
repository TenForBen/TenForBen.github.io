package openWeatherApp.ApiUiInt;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;

public class frameworktest {

	
	public void setup(WebDriver driver, String url)
	{
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		
		driver.manage().deleteAllCookies();
		driver.manage().window().maximize();
		driver.get(url);
         System.out.println("The setup process completed"); 
	}
	
	
	public void hyperlinks(WebDriver driver)
	{
		//System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
	    System.out.println("hyperlinks started");
		List <WebElement> anchor= driver.findElements(By.tagName("a"));
		int a= anchor.size();
		System.out.println("Number of anchor tag in this webpage is "+a);
		String button= driver.findElement(By.tagName("button")).getText();
		System.out.println("The button text is "+button);
		
	}
	
	
	public void emptyuser(WebDriver driver) throws InterruptedException {
		
		System.out.println("the emptyuser field test case started");
		WebElement Login= driver.findElement(By.id("zwei"));
		 Login.click();
		WebElement username=driver.findElement(By.id("txtUserName"));
		username.click();
		Thread.sleep(2000);
		WebElement password=driver.findElement(By.id("txtPassword"));
		password.click();
		Thread.sleep(2000);
		WebElement headererror= driver.findElement(By.id("HeaderError"));
		if (headererror.isDisplayed()) {
		String error=	headererror.getText();
		System.out.println("The error is " +error);
		}else {
			System.out.println("Test case failed");
		}
	}

	
	public  void wrongpass(WebDriver driver) throws InterruptedException {
		
		System.out.println("wrongpass method started");
		WebElement Login= driver.findElement(By.xpath("//a[@id='zwei']"));
		 Login.click();
		 WebElement username=driver.findElement(By.id("txtUserName"));
		 username.sendKeys("sibinq");
			Thread.sleep(2000);
			WebElement password=driver.findElement(By.id("txtPassword"));
			password.sendKeys("werdfghjk");
			WebElement confirmpass=driver.findElement(By.id("txtPassword2"));
			confirmpass.sendKeys("kijdfghjk");
			WebElement enterlogin=driver.findElement(By.id("psycho"));
			 enterlogin.click();
			WebElement error= driver.findElement(By.id("CPwdError"));
			String msg= error.getText();
			System.out.println(msg);
	}

   
    public void minimun(WebDriver driver) throws InterruptedException {
    	System.out.println("Test for username less than 6 chars");
	WebElement Login= driver.findElement(By.id("zwei"));
	 Login.click();
	 WebElement username=driver.findElement(By.id("txtUserName"));
	 username.sendKeys("abc");
	 Thread.sleep(2000);
	 //WebElement password=driver.findElement(By.id("txtPassword"));
	 //password.sendKeys("test");
	 WebElement enterlogin=driver.findElement(By.id("psycho"));
	 enterlogin.click();
	 WebElement headererror= driver.findElement(By.id("HeaderError"));
		if (headererror.isDisplayed()) {
		String error=	headererror.getText();
		System.out.println("The error is " +error);
		}else {
			System.out.println("Test case failed");
		}
	
}
   
       
        public void withoutpass(WebDriver driver) throws InterruptedException {
    	 
		WebElement Login= driver.findElement(By.id("zwei"));
		 Login.click();
		 WebElement username=driver.findElement(By.id("txtUserName"));
		 username.sendKeys("sibinq");
			Thread.sleep(2000);
			//WebElement password=driver.findElement(By.id("txtPassword"));
			WebElement enterlogin=driver.findElement(By.id("psycho"));
			 enterlogin.click();
				WebElement gerror= driver.findElement(By.id("PwdError"));
				String msgg= gerror.getText();
				System.out.println(msgg);
}
       
       
   	public void emptypage() throws InterruptedException {
    	   WebDriver driver= new ChromeDriver();
   		WebElement Login= driver.findElement(By.id("zwei"));
   		 Login.click();
   		 WebElement enterlogin=driver.findElement(By.id("psycho"));
   		 enterlogin.click();
   		 Thread.sleep(2000);
   		 List<WebElement> errorlist= driver.findElements(By.tagName("span"));
   		 int errnum= errorlist.size();
   		 for(int i=0; i<=errnum;i++) {
   			 String errortext= errorlist.get(i).getText();
   			 System.out.println("The total error text: " +errnum);
   			 System.out.println("The error texts are: " +errortext);
   		 }
   		
   	}
       
       
       public  void webelements() {
    	   WebDriver driver= new ChromeDriver();
  		 WebElement Login= driver.findElement(By.id("zwei"));
  		 Login.click();
  		 List <WebElement> anchor= driver.findElements(By.tagName("a"));
  			int a= anchor.size();
  			System.out.println("Number of anchor tag in this webpage is "+a);
  			for (int i=0; i<=a; i++) {
  				String anchortagname=  anchor.get(i).getText();
  				System.out.println("The text of anchor tags are "+anchortagname);
  			}
  			String button= driver.findElement(By.tagName("button")).getText();
  			System.out.println("The button text is "+button);
  			 List <WebElement> labels= driver.findElements(By.tagName("label"));
  			 int l= labels.size();
  			 System.out.println("Nuber of user input fields in this webpage is "+l);
  			 for (int ik=0; ik<=a; ik++) {
  					String labeltagname=  labels.get(ik).getText();
  					System.out.println("The text of labels tags are "+labeltagname);
  			 }	
  	}

       
       
       public void quitbrowser(WebDriver driver) 
       {
    	  
   		driver.quit();
   		System.out.println("Program ends by closing the browser");
   		}
}
