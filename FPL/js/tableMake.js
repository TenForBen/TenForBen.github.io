
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

function moveToNextMonth() {
                               // Find the current script element
                               const currentScript = document.querySelector('script[src*="_"]');
                               if (currentScript) {
                                   // Extract the current month and year from the script's src
                                   const srcParts = currentScript.src.split('/');
                                   const currentFile = srcParts.pop();
                                   const [baseName, date] = currentFile.split('_');
                                   const [year, month, day] = date.split('-');

                                   // Increment the month
                                   let nextMonth = parseInt(month, 10) + 1;
                                   let nextYear = parseInt(year, 10);

                                   // Handle year rollover
                                   if (nextMonth > 12) {
                                       nextMonth = 1;
                                       nextYear += 1;
                                   }

                                   // Format the new month and date
                                   const formattedMonth = nextMonth.toString().padStart(2, '0');
                                   const newFileName = `${baseName}_${nextYear}-${formattedMonth}-${day}`;
                                   const newSrc = [...srcParts, newFileName].join('/');

                                   // Create a new script element
                                   const newScript = document.createElement('script');
                                   newScript.src = newSrc;

                                   // Update the page title and content after the new script is loaded
                                   newScript.onload = () => {
                                       document.title = newFileName;
                                       // Optionally, update other parts of the page here
                                   };

                                   // Append the new script to the document head
                                   document.head.appendChild(newScript);
                               }
                           }


function loader4Klima()
{
    if (s)
     {
        //wordsArray = JSON.parse(worter);
        for (var i = 0; i < s.length; i++)
         {
            prepareTableCellKlima(s[i].City,s[i].Coords,s[i].Nation,s[i].temp);
         }
    }

}
function loader4BudgetTrips()
{
    if (s)
     {
        //wordsArray = JSON.parse(worter);
        for (var i = 0; i < s.length; i++)
         {
            prepareTableCell4BudgetTrips(s[i].Stadt,s[i].Coordinates,s[i].timeStamp,s[i].Weather,s[i].Country,s[i].DayLength);
         }
    }

}

function prepareTableCell4BudgetTrips(p1,p2,p3,p4,p5,p6)
{
    var table = document.getElementById("regtable");
    var row = table.insertRow();

    var pp1 = row.insertCell(0);
    var pp2 = row.insertCell(1);
    var pp3 = row.insertCell(2);
    var pp4 = row.insertCell(3);
    var pp5 = row.insertCell(4);
    var pp6 = row.insertCell(5);

    pp1.innerHTML = p1;
    pp2.innerHTML = p2;
    pp3.innerHTML = p3;
    pp4.innerHTML = p4;
     pp5.innerHTML = p5;
    pp6.innerHTML = p6;


}


function prepareTableCellKlima(p1,p2,p3,p4)
{
    var table = document.getElementById("regtable");
    var row = table.insertRow();

    var pp1 = row.insertCell(0);
    var pp2 = row.insertCell(1);
    var pp3 = row.insertCell(2);
    var pp4 = row.insertCell(3);

    pp1.innerHTML = p1;
    pp2.innerHTML = p2;
    pp3.innerHTML = p3;
    pp4.innerHTML = p4;


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
            prepareTableCell3mgw(s[i].Teams,s[i].manager_Name,s[i].Player_1,s[i].Player_2,s[i].Player_3,s[i].Player_4,s[i].Player_5,s[i].Player_6,s[i].Player_7,s[i].Player_8,s[i].Player_9,s[i].Player_10,s[i].Player_11,s[i].Player_12,s[i].Player_13,s[i].Player_14,s[i].Player_15,s[i].SXL, s[i].Latp);
         }
    }
    //tableShakers();
    // sorter
    // sortTable_col19()
    document.getElementsByTagName('tr')[0].addEventListener('click', function() {
                                    sortTable_col19();  // Execute abc() when the first <tr> is clicked
                                });
     //let isSorted = false;  // Track the sort state
	 colorCoder(s.length);
	 updatePageTitle();
	 newButtons();
   //loader4zero
}

function updatePageTitle() {
    // Assume the original title is "Test"
    const originalTitle = document.title;

    // Extract the gwNumber from the URL
    const path = window.location.href; // Get current URL
    const gwNumber = path.split("/FPL/GW/GW")[1].split('/')[0];

    // Set the new title of the page
    document.title = `${originalTitle}-GW-${gwNumber}`; // Sets title to "Test-GW-6"
}

function loader4zero()
{
    if (s)
     {
        //wordsArray = JSON.parse(worter);
        for (var i = 0; i < s.length; i++)
         {
             var totalInvested = (s[i].realised_quantity * s[i].average_price )
             s[i].pnl = Math.round(s[i].pnl);
             s[i].day_change = s[i].day_change.toFixed(2);
             s[i].average_price = s[i].average_price.toFixed(2);
             
             s[i].day_change_percentage = s[i].day_change_percentage.toFixed(2);
              s[i].day_change_percentage = s[i].day_change_percentage +" % " // to be replaced with AfterLoad UI regulators in table
              totalInvested = totalInvested.toFixed(2);


            prepareTableCell3zero(s[i].tradingsymbol,s[i].realised_quantity,s[i].average_price,s[i].last_price,s[i].pnl,s[i].day_change,s[i].day_change_percentage,totalInvested);
         }
    }
    //tableShakers();
    // sorter
     //sortTable_col3();
     //captainSignRemovar();
   //colorCoder();
   //loader4zero
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

function prepareTableCell3zero(p1,p2,p3,p4,p5,p6,p7,p8) 
{
    var table = document.getElementById("regtable");
    var row = table.insertRow();

    var tradingsymbol = row.insertCell(0);
    var realised_quantity = row.insertCell(1);
    var average_price = row.insertCell(2);
    var last_price = row.insertCell(3);
    var pnl = row.insertCell(4);
    var day_change = row.insertCell(5);
    var day_change_percentage = row.insertCell(6);
    var totalInvested = row.insertCell(7);
        
    tradingsymbol.innerHTML = p1;
    realised_quantity.innerHTML = p2;
    average_price.innerHTML = p3;
    last_price.innerHTML = p4;
    pnl.innerHTML = p5;
    day_change.innerHTML = p6;
    day_change_percentage.innerHTML = p7;
    totalInvested.innerHTML = p8;
    
}
function loader4mgwFPL6()
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
     captainSignRemovar();
	 colorCoder(s.length);
	
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


            //document.getElementById("sofOL").innerHTML=tseconds + " seconds from nextGW";
            document.getElementById("sofOL").innerHTML=tseconds + " seconds";
            if(tseconds%60==0)
              {
                document.getElementById("sofOL").style.color="cyan"

              }
            else
              {
                document.getElementById("sofOL").style.color="#8DB600"
                //https://en.wikipedia.org/wiki/List_of_colors:_A%E2%80%93F

              }

              let isPrime = true;
              for ( let i =2;i<tseconds;i++)
              {

                if ( tseconds % i == 0)
                {
                  isPrime = false;
                  break;
                }

              }
              if(isPrime)
              {
                console.log(`  ${tseconds} is a crime number ` );
                document.getElementById("sofOL").style.color="orange"


              }

           //document.getElementById("hofOL").innerHTML=thours+ " hours";
           // document.getElementById("mofOL").innerHTML=tminutes+ " minutes from nextGW";
            document.getElementById("mofOL").innerHTML=tminutes+ " minutes ";

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
    sortTable();
    document.getElementById("uqPc").innerText=pcc.length
    //tableShakers();
}

function noMoreSameName_airline()
{
    if (s)
     {
        //wordsArray = JSON.parse(worter);
        for (var i = 0; i < s.length; i++)
         {
            harryMaguire_airline(s[i].Day,s[i].PriceValue,s[i].Departure,s[i].Arrival);
         }
    }
    //sortTable();
    //document.getElementById("uqPc").innerText=s.length
    //tableShakers();
    updateDateColumn();
    // Call the function to update the row 1.
    updateThWithTime();
    airlineTable();
}

function airlineTable() {
   if (s)
   {
               for (var i = 0; i < s.length; i++)
                {
                   if(i%2)
                       document.getElementsByTagName("tr")[i].bgColor="silver"
                }
                document.getElementsByTagName("tr")[0].bgColor="Lime"
  }
}
function updateThWithTime() {
    // Find all script elements
    const scripts = document.querySelectorAll('script[src]');

    // Look for a script with "_" in its src
    const targetScript = Array.from(scripts).find(script => script.src.includes('_'));

    // If found, set the title of the page and update the <th> element
    if (targetScript) {
        const srcValue = targetScript.src.split('/').pop(); // Extract the file name
        document.title = srcValue;

        const thElement = document.querySelector('th');
        if (thElement) {
            const derivedValue = srcValue.split('_').pop().split('.')[0]; // Extract the last part before ".js"
            const unixTime = parseInt(derivedValue, 10); // Convert the derived value to an integer
            const date = new Date(unixTime * 1000); // Convert Unix time to milliseconds
            const dateTime = date.toLocaleString(); // Convert to local time zone string
            thElement.textContent = `Day @ ${dateTime}`;
        }
    }
}

function LeagueJson()
{
    if (s)
     {
        //wordsArray = JSON.parse(worter);
        for (var i = 0; i < s.length; i++)
         {
            harryMaguire(s[i].manager_id,s[i].teamName);
         }
    }
    sortTable1();
    document.getElementById("uqPc").innerText=s.length
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

function noMoreSameName4()
{
    if (pcc)
     {
        //wordsArray = JSON.parse(worter);
        for (var i = 0; i < pcc.length; i++)
         {
            harryMaguire4(pcc[i].PLAYERS,pcc[i].PLAYERS_COUNT,pcc[i].CAPTAIN_COUNT,pcc[i].CAPTAINED_MGR);
         }
    }
    sortTable_col3();
    document.getElementById("uqPc").innerText=pcc.length
    //tableShakers();
}
function harryMaguire_airline(p1,p2,p3,p4)
{
    var table = document.getElementById("regtable");
    var row = table.insertRow();
    var Day = row.insertCell(0);
    var PriceValue = row.insertCell(1);
    var Departure = row.insertCell(2);
    var Arrival = row.insertCell(3);
    Day.innerHTML = p1;
    PriceValue.innerHTML = p2;
    Departure.innerHTML = p3;
    Arrival.innerHTML = p4;
}

function harryMaguire4(p1,p2,p3,p4)
{
    var table = document.getElementById("regtable");
    var row = table.insertRow();
    var teamName = row.insertCell(0);
    var manager_Name = row.insertCell(1);
    var capC = row.insertCell(2);
    var Cap_manager_Name = row.insertCell(3);
    teamName.innerHTML = p1;
    manager_Name.innerHTML = p2;
    capC.innerHTML = p3;
    Cap_manager_Name.innerHTML = p4;
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

function sortTable1() {
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

function sortTable_col19() {
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
      x = rows[i].getElementsByTagName("TD")[18];
      y = rows[i + 1].getElementsByTagName("TD")[18];
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

function captainSignRemovar()
{
    var trl = document.getElementsByTagName("tr").length
    var colms = document.getElementsByTagName("tr")[0].children.length
    for(u=0;u<trl;u++)
    {
        for(uu=0;uu<colms;uu++)
        {
            var cap =document.getElementsByTagName("tr")[u].children[uu].innerText
            res= cap.split("$")
            if (res.length>1)
            {
                document.getElementsByTagName("tr")[u].children[uu].innerText=res[0]
                document.getElementsByTagName("tr")[u].children[uu].style.fontWeight = "800";
            }

            if (uu==13)
            {
                
                document.getElementsByTagName("tr")[u].children[uu].style.borderRight =  "thin solid #000000";
            }
            if (uu==2)
            {
                
                document.getElementsByTagName("tr")[u].children[uu].style.borderRight =  "thin solid #000000";
            }

        }
       //var cap =document.getElementsByTagName("tr")[1].children[8].innerText 

    }
}

function loader4grocery()
{
    if (s)
     {
        //wordsArray = JSON.parse(worter);
        for (var i = 0; i < s.length; i++)
         {
            prepareTableCellgrocery(s[i].itemID,s[i].ItemName,s[i].dayOfPurchase,s[i].expiryDate,s[i].consumedFlag,s[i].Comment);
         }
    }
    //tableShakers();
    // sorter
     //sortTable_col3();
     //captainSignRemovar();

     



}
 function updateDateColumn() {
     const rows = document.querySelectorAll('tr');
     rows.forEach(row => {
         const dateCell = row.cells[0]; // Assuming the first column contains the date
         if (dateCell) {
             const dateValue = dateCell.textContent.trim();
             const dateObj = new Date(dateValue);
             if (!isNaN(dateObj)) {
                 const dayName = dateObj.toLocaleString('en-US', { weekday: 'long' });
                 dateCell.textContent = `${dateValue} (${dayName})`;
             }
         }

         // Process the 3rd and 4th columns (index 2 and 3)
         [2, 3].forEach(colIndex => {
             const cell = row.cells[colIndex];
             if (cell) {
                 const cellValue = cell.textContent.trim();
                 const timePart = cellValue.split('T')[1]; // Extract time after 'T'
                 if (timePart) {
                     cell.textContent = timePart; // Update cell with time only
                 }
             }
         });
     });
 }
function prepareTableCellgrocery(p1,p2,p3,p4,p5,p6) 
{
    var table = document.getElementById("regtable");
    var row = table.insertRow();
    
    var pp1 = row.insertCell(0);
    var pp2 = row.insertCell(1);
    var pp3 = row.insertCell(2);
    var pp4 = row.insertCell(3);
    var pp5 = row.insertCell(4);
    var pp6 = row.insertCell(5);
       
    
    pp1.innerHTML = p1;
    pp2.innerHTML = p2;
    pp3.innerHTML = p3;
    pp4.innerHTML = p4;
    pp5.innerHTML = p5;
    pp6.innerHTML = p6;
    
    
}


function colorCoder(darshana)

{
	

		for(rw=1;rw<=darshana;rw++)
	{
				for(i=3;i<18;i++)
			{
					console.log(document.getElementsByTagName("tr")[1].children[3].innerText)
					let zam =document.getElementsByTagName("tr")[rw].children[i].innerText
					myArr = zam.split(" ")  
					let myArrLen =myArr.length 
					let ron = myArr[myArrLen-1].length
					if(ron<3)
					{
						let pts = myArr[myArrLen-1]
						if(pts>4)
                        {
							document.getElementsByTagName("tr")[rw].children[i].bgColor="#cd7f32"
                            document.getElementsByTagName("tr")[rw].children[i].style.color="white"
                        }
                        if(pts>8)
                        {
                            document.getElementsByTagName("tr")[rw].children[i].bgColor="#9ea39e"
                            document.getElementsByTagName("tr")[rw].children[i].style.color="black"
                        }
                        if(pts>12)
                        {
                            document.getElementsByTagName("tr")[rw].children[i].bgColor="#e5d514"
                            document.getElementsByTagName("tr")[rw].children[i].style.color="black"
                        }

					}
					else
					{
						//console.log(myArr[myArrLen-2])
					}

			}
	}

  //button logics

    

}

function loader4mgwFPL6_1_0()
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
     captainSignRemovar();
   colorCoder(s.length);
  
}

function shenai()
	{
		var tt =document.getElementsByTagName('title')[0].innerText
	  dm = tt.split("-")  
	   var callum =dm[dm.length-1]
	   var prevGW = callum-1
	   var nextGW = parseInt(callum)
	   nextGW=nextGW+1
	   document.getElementById("prev").innerText= "Previous GW -> " + prevGW 
	   document.getElementById("next").innerText= "Next GW <-> " + nextGW
	   var prevHref = "../../GW" +prevGW +"/FPL6/playerCountNew.html"
	   var nextHref = "../../GW" +nextGW +"/FPL6/playerCountNew.html"
	   //GW11/FPL6/playerCountNew.html
	   document.getElementById("prev").href=prevHref
	   document.getElementById("next").href=nextHref
	}
	
	
	function thunderbolt()
	{
		var tt =document.getElementsByTagName('title')[0].innerText
		dm = tt.split("-")  
	   var callum =dm[dm.length-1]
	   var prevGW = callum-1
	   var nextGW = parseInt(callum)
	   nextGW=nextGW+1
	   document.getElementById("prev").innerText= "Previous GW -> " + prevGW 
	   document.getElementById("next").innerText= "Next GW <-> " + nextGW
	   var prevHref = "../../GW" +prevGW +"/FPL6/punkte.html"
	   var nextHref = "../../GW" +nextGW +"/FPL6/punkte.html"
	   //GW11/FPL6/punkte.html
	   document.getElementById("prev").href=prevHref
	   document.getElementById("next").href=nextHref
	}

	function newButtons()
	{
		var tt =document.getElementsByTagName('title')[0].innerText
		dm = tt.split("-")
	   var callum =dm[dm.length-1]
	   var prevGW = callum-1
	   var nextGW = parseInt(callum)
	   nextGW=nextGW+1
	   document.getElementById("barnes").innerText= "Previous GW <- " + prevGW
	   document.getElementById("lowton").innerText= "Next GW -> " + nextGW
	   // Get the pathname from the current page's URL
       const path = window.location.pathname;
       // Split by "/" and get the last part
       const fileName = path.split('/').pop();
	   var prevHref = "../../GW" +prevGW + "/new/" +fileName
	   var nextHref = "../../GW" +nextGW + "/new/" +fileName
	   //GW11/FPL6/punkte.html
	   document.getElementById("barnes").href=prevHref
	   document.getElementById("lowton").href=nextHref
	}


