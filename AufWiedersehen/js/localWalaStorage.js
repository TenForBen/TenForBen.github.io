     

//localWalaStorage.js
//alert("st. petersburg");

var studentsArray=[];
	

function garyspeed()
{

var fn=document.getElementById("fc").value;
var ln=document.getElementById("ff").value;
var rn=document.getElementById("bg").value;

                var stuObj = {firstname: fn, lastname: ln, rollnum: rn};
                studentsArray.push(stuObj);
                localStorage.studentsRecord = JSON.stringify(studentsArray);
				prepareTableCell(fn, ln, rn);

acton();

document.getElementById("fc").value=" ";
document.getElementById("ff").value=" ";
document.getElementById("bg").value=" ";
}
function prepareTableCell(firstName, lastName, rollNum) {
                var table = document.getElementById("regtable");
                var row = table.insertRow();
                var firstNameCell = row.insertCell(0);
                var lastNameCell = row.insertCell(1);
                var rollNumCell = row.insertCell(2);
                //var subjectCell = row.insertCell(3);
                firstNameCell.innerHTML = firstName;
                lastNameCell.innerHTML = lastName;
                //firstNameCell.colSpan = 2;
                rollNumCell.innerHTML = rollNum;
                //subjectCell.innerHTML = subject;
            }
function loader()
{
//document.getElementById('Tbag').style.display=='none';

		if (localStorage.studentsRecord) 
				{
                    studentsArray = JSON.parse(localStorage.studentsRecord);
                    for (var i = 0; i < studentsArray.length; i++)
					{
                        prepareTableCell(studentsArray[i].firstname, studentsArray[i].lastname, studentsArray[i].rollnum);
                    }
                }

}

function acton(){

document.getElementById("monreal").style.color=document.getElementById("fc").value;
document.getElementById("monreal").style.fontFamily=document.getElementById("ff").value;
document.getElementById("monreal").style.backgroundColor=document.getElementById("bg").value;

}
 
 
function sss(){
				if(document.getElementById('Tbag').style.display=='none')
				{
					document.getElementById('Tbag').style.display='block';
				}
					else
					{
					document.getElementById('Tbag').style.display='none';
					}
			}
 
 function garbage(){
	 var imageID="5a8fa95b36d1a00001b0bceb";
     var Device101 = "504582192261830";

	 
 }