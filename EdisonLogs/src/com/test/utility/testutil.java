package com.test.utility;

import java.util.ArrayList;

public class testutil {
	static Xls_Reader reader;
	public static ArrayList<Object[]> datatotest() {
		ArrayList<Object[]> mydata= new ArrayList<Object[]>();
		try {
		 reader= new Xls_Reader("/H:/vsos/TenForBen.github.io/EdisonLogs/src/testdatalogin.xlsx");
		} catch(Exception e) {
			e.printStackTrace();
		}
		int rowcount= reader.getRowCount("testdata");
		System.out.println(rowcount);
			
		for (int rownum=2; rownum<=rowcount;rownum++) {		
		String username= reader.getCellData("testdata", "username", rownum);
		String password= reader.getCellData("testdata", "password", rownum);
		Object ob[] = {username, password};
		mydata.add(ob);
	}
		return mydata;
} 
	
}
