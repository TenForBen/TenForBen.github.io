
function tableShakers()
{
	
	document.getElementsByTagName('tr')[0].children[0].style.backgroundColor='orange'
	document.getElementsByTagName('tr')[0].style.backgroundColor='salmon'

	for(p=2;p<=12;p++)
		{
		document.getElementsByTagName('tr')[0].children[p].style.backgroundColor='red'
		}

	for(p=13;p<=16;p++)
		{
		document.getElementsByTagName('tr')[0].children[p].style.backgroundColor='turquoise'
		}


	for(r=1;r<=28;r++)
		{
		if(r%2)
			document.getElementsByTagName('tr')[r].style.backgroundColor='rgba(0,0,0,.04)'

		}	
}
function loader4()
{
    if (s)
     {
        //wordsArray = JSON.parse(worter);
        for (var i = 0; i < s.length; i++)
         {
            prepareTableCell3(s[i].Teams,s[i].Player_1,s[i].Player_2,s[i].Player_3,s[i].Player_4,s[i].Player_5,s[i].Player_6,s[i].Player_7,s[i].Player_8,s[i].Player_9,s[i].Player_10,s[i].Player_11,s[i].Player_12,s[i].Player_13,s[i].Player_14,s[i].Player_15,s[i].SXL, s[i].Bench);
         }
    }
    tableShakers();
}
function prepareTableCell3(Team, p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15, krups, stick) 
{
    var table = document.getElementById("regtable");
    var row = table.insertRow();
    var firstNameCell = row.insertCell(0);
    var lastNameCell = row.insertCell(1);
    var pp1 = row.insertCell(2);
    var pp2 = row.insertCell(3);
    var pp3 = row.insertCell(4);
    var pp4 = row.insertCell(5);
    var pp5 = row.insertCell(6);
    var pp6 = row.insertCell(7);
    var pp7 = row.insertCell(8);
    var pp8 = row.insertCell(9);
    var pp9 = row.insertCell(10);
    var pp10 = row.insertCell(11);
    var pp11 = row.insertCell(12);
    var pp12 = row.insertCell(13);
    var pp13 = row.insertCell(14);
    var pp14 = row.insertCell(15);
    var pp15 = row.insertCell(16);
    var stickI = row.insertCell(17);     
    firstNameCell.innerHTML = Team;
    lastNameCell.innerHTML = krups;
    stickI.innerHTML = stick;
    pp1.innerHTML = p1;
    pp2.innerHTML = p2;
    pp3.innerHTML = p3;
    pp4.innerHTML = p4;
    pp5.innerHTML = p5;
    pp6.innerHTML = p6;
    pp7.innerHTML = p7;
    pp8.innerHTML = p8;
    pp9.innerHTML = p9;
    pp10.innerHTML = p10;
    pp11.innerHTML = p11;
    pp12.innerHTML = p12;
    pp13.innerHTML = p13;
    pp14.innerHTML = p14;
    pp15.innerHTML = p15;
    
}
function loader4mgw()
{
    if (s)
     {
        //wordsArray = JSON.parse(worter);
        for (var i = 0; i < s.length; i++)
         {
            prepareTableCell3mgw(s[i].Teams,s[i].manager_Name,s[i].Player_1,s[i].Player_2,s[i].Player_3,s[i].Player_4,s[i].Player_5,s[i].Player_6,s[i].Player_7,s[i].Player_8,s[i].Player_9,s[i].Player_10,s[i].Player_11,s[i].Player_12,s[i].Player_13,s[i].Player_14,s[i].Player_15,s[i].SXL, s[i].Bench);
         }
    }
    //tableShakers();
}

function prepareTableCell3mgw(Team,mN,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15, krups, stick) 
{
    var table = document.getElementById("regtable");
    var row = table.insertRow();
    var teamName = row.insertCell(0);
    var manager_Name = row.insertCell(1);
    var lastNameCell = row.insertCell(2);
    var pp1 = row.insertCell(3);
    var pp2 = row.insertCell(4);
    var pp3 = row.insertCell(5);
    var pp4 = row.insertCell(6);
    var pp5 = row.insertCell(7);
    var pp6 = row.insertCell(8);
    var pp7 = row.insertCell(9);
    var pp8 = row.insertCell(10);
    var pp9 = row.insertCell(11);
    var pp10 = row.insertCell(12);
    var pp11 = row.insertCell(13);
    var pp12 = row.insertCell(14);
    var pp13 = row.insertCell(15);
    var pp14 = row.insertCell(16);
    var pp15 = row.insertCell(17);
    var stickI = row.insertCell(18);     
    teamName.innerHTML = Team;
    manager_Name.innerHTML = mN;
    lastNameCell.innerHTML = krups;
    stickI.innerHTML = stick;
    pp1.innerHTML = p1;
    pp2.innerHTML = p2;
    pp3.innerHTML = p3;
    pp4.innerHTML = p4;
    pp5.innerHTML = p5;
    pp6.innerHTML = p6;
    pp7.innerHTML = p7;
    pp8.innerHTML = p8;
    pp9.innerHTML = p9;
    pp10.innerHTML = p10;
    pp11.innerHTML = p11;
    pp12.innerHTML = p12;
    pp13.innerHTML = p13;
    pp14.innerHTML = p14;
    pp15.innerHTML = p15;
    
}
    