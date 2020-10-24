
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
    sortTable();

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
    // sorter
     sortTable_col3();



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

function larojita(t)
{



    // Set the date we're counting down to
            var countDownDate = new Date(t).getTime();

          // Update the count down every 1 second
          var x = setInterval(function() {

            // Get todays date and time
            var now = new Date().getTime();

            // Find the distance between now an the count down date
            var distance = countDownDate - now;

            // Time calculations for days, hours, minutes and seconds
            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);



            var tdays = Math.floor(distance / (1000 * 60 * 60 * 24));
            var thours = Math.floor((distance) / (1000 * 60 * 60));
            var tminutes = Math.floor((distance) / (1000 * 60));
            var tseconds = Math.floor((distance) / 1000);


            document.getElementById("sofOL").innerHTML=tseconds + " seconds from nextGW";
           //document.getElementById("hofOL").innerHTML=thours+ " hours";
            document.getElementById("mofOL").innerHTML=tminutes+ " minutes from nextGW";

            // Display the result in the element with id="demo"
            //document.getElementById("emo").innerHTML = days + "d " + hours + "h "+ minutes + "m " + seconds + "s ";
            

            // If the count down is finished, write some text 
            if (distance < 0) {
              clearInterval(x);
              document.getElementById("emo").innerHTML = "EXPIRED";
            }
          }, 100);
}

function noMoreSameName()
{
    if (pcc)
     {
        //wordsArray = JSON.parse(worter);
        for (var i = 0; i < pcc.length; i++)
         {
            harryMaguire(pcc[i].PLAYERS,pcc[i].PLAYERS_COUNT);
         }
    }
    //tableShakers();
}
function harryMaguire(p1,p2) 
{
    var table = document.getElementById("regtable");
    var row = table.insertRow();
    var teamName = row.insertCell(0);
    var manager_Name = row.insertCell(1);   
    teamName.innerHTML = p1;
    manager_Name.innerHTML = p2;
}
    
function sortTable() {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("regtable");
  switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[1];
      y = rows[i + 1].getElementsByTagName("TD")[1];
      //check if the two rows should switch place:
      if (Number(x.innerHTML) < Number(y.innerHTML)) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}

function sortTable_col3() {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("regtable");
  switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[2];
      y = rows[i + 1].getElementsByTagName("TD")[2];
      //check if the two rows should switch place:
      if (Number(x.innerHTML) < Number(y.innerHTML)) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}