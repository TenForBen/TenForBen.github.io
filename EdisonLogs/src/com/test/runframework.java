package com.test;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;

import frameworkpractice.methods;

public class runframework extends methods
{
	 WebDriver driver;
	  
	
	 
	
	public static void main(String[] args) {
		//start();
		System.setProperty("webdriver.chrome.driver","D:\\Selenium\\chromedriver.exe");
		String url= "https://tenforben.github.io/Movies/HoMe.html";
		WebDriver driver= new ChromeDriver();
		
		
		methods abc= new methods();
		abc.elements(driver, url);
	}

}
