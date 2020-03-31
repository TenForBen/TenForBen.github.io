package frameworkpractice;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;

import com.test.utility.Xls_Reader;

public class methods extends setup {
 //WebDriver driver= new ChromeDriver();
 

public   void elements(WebDriver driver, String url)  {	
	System.out.println("Elements method started running");
	 driver.get(url);
	 Xls_Reader reader= new Xls_Reader("/H:/vsos/TenForBen.github.io/EdisonLogs/src/testdatalogin.xlsx");
	 WebElement Login= driver.findElement(By.xpath("(//button)[1]"));  
	 Login.click();
	 WebElement usernamefield= driver.findElement(By.xpath("//div[@class='container']//input[@id='u']"));
	 WebElement passwordfield= driver.findElement(By.id("p"));
	
	 
	 int rowcount= reader.getRowCount("testdata");
		System.out.println(rowcount);
		reader.addColumn("testdata", "Status");
			
		for (int rownum=2; rownum<=rowcount;rownum++) {		
		String username= reader.getCellData("testdata", "username", rownum);
		String password= reader.getCellData("testdata", "password", rownum);
		usernamefield.clear();
	    usernamefield.sendKeys(username);
	    passwordfield.clear();
	    passwordfield.sendKeys(password);
	    reader.setCellData("testdata", "Status", rownum, "Pass");
	    System.out.println(username +"  "  +password); 

}
}
}
