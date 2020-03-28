package com.test.utility;

import java.util.ArrayList;

public class testutil {
	
	public static ArrayList<Object[]> datatotest() {
		ArrayList<Object[]> mydata= new ArrayList<Object[]>();
		Xls_Reader reader= new Xls_Reader("/H:/vsos/TenForBen.github.io/EdisonLogs/src/testdatalogin.xlsx");
		int rowcount= reader.getRowCount("testdata");
		System.out.println(rowcount);
			
		for (int rownum=2; rownum<=rowcount;rownum++) {		
		String usernam= reader.getCellData("testdata", "username", rownum);
		String passwor= reader.getCellData("testdata", "password", rownum);
		Object ob[] = {usernam, passwor};
		mydata.add(ob);
	}
		return mydata;
} 
	
}
