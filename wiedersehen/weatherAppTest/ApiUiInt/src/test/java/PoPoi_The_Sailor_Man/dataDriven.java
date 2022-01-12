package PoPoi_The_Sailor_Man;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;

public class dataDriven {

	public static void main(String[] args) throws IOException
	{
		// TODO Auto-generated method stub
		// FIS arguement 
		FileInputStream fis =new FileInputStream("H:\\vsos\\TenForBen.github.io\\EdisonLogs\\weather.xlsx ");
		
		XSSFWorkbook workbook = new XSSFWorkbook(fis);
		
		int smpl = workbook.getNumberOfSheets();
		System.out.println("number of sheets -  " + smpl);
		for( int i=0;i<smpl;i++)
		{
			System.out.println("Sheet number " +"- " +(i+1)  +" is " + workbook.getSheetName(i)  );
		}

	}

}
