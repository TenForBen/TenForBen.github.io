$(document).ready(function(){
    $("#barnes").click(function(){
        $("table").removeClass("table table-bordered main").addClass("table");
		
    });
	$("#lowton").click(function(){
        $("table").toggleClass("table-bordered main");
		coeatril();
    });
});

function trnxId(wk)
{
	
for(i=0;i<wk.steps.length;i++)
	console.log(`${i+1} step ${wk.steps[i].name}  ${wk.steps[i].status}  \n ${wk.steps[i].description}`)


	
}
function PMtrnxId(wk)
{
	
for(i=0;i<jsonData.steps.length;i++)
	console.log(`${i+1} step ${jsonData.steps[i].name}  ${jsonData.steps[i].status}  \n ${jsonData.steps[i].description}`)


	
}
//for Skipped steps name
var SkippedResponse= wk =>{
		let counter=0;
	for (let list in wk.steps )
{
if(wk.steps[list].status=="SKIPPED")
{
console.log(wk.steps[list].name)
counter=counter+1;
}
}
console.log(`${counter} steps skipped`)		
}
//for Successfull steps name
var SuccessResponse= wk =>{
	
	let counter=0;
	for (let list in wk.steps )
{
if(wk.steps[list].status=="SUCCESS")
{
console.log(wk.steps[list].name)
counter=counter+1;

}

}
console.log(`${counter} steps successfull`)
		
}
//for Successfull steps details
var SuccessResponseDetails= wk =>
{
	
    	let counter=0;
    	for (let list in wk.steps )
    {
    if(wk.steps[list].status=="SUCCESS")
    {
    console.log(wk.steps[list])
    counter=counter+1;

    }

}
console.log(`${counter} steps successfull`)
		
}

var SuccessResponseDescription= wk =>{
	
	let counter=0;
	for (let list in wk.steps )
{
if(wk.steps[list].status=="SUCCESS")
{
console.log(wk.steps[list].description)



}

}
console.log(`${counter} steps successfull`)
		
}

var ResponseDescription= wk =>{
	
	let counter=0;
	for (let list in wk.steps )
{
//if(wk.steps[list].status=="SUCCESS")

counter=counter+1;
console.log(` ${wk.steps[list].status}  ${counter}  ${wk.steps[list].description}`)



}
console.log(` Total ${counter} steps `)
		
}
function coeatril(){
	
	var tarkaw=document.getElementById("regtable").className
		if(tarkaw=="table table-hover main")
		{
		$("#Staging").css("display","block");
		$("#PreProd").css("display","none");

		}
		else
		{

		$("#Staging").css("display","none");
		$("#PreProd").css("display","block");


		}
	
}


function boat()
	{
	document.getElementsByClassName("rexx")[0].classList.toggle("pexx");
	}	
	
	
	
	
	function AgentRyan(){
	//protected static String TabsTable="//div[2]/div/div/div[1]/ul/li"
	garyspeed();
	}
    var modal = document.getElementById('myModal');

    // Get the button that opens the modal
    var btn = document.getElementById("myBtn");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks the button, open the modal 
    //btn.onclick = function () {
    //    modal.style.display = "block";
    //}
    function vardy() {
       // document.getElementById('myModal').style.display = "block";
        document.getElementsByClassName("modal")[0].style.display = "block";
        document.getElementsByClassName("modal-content")[0].style.display = "block";
        
    }

    // When the user clicks on <span> (x), close the modal
    //span.onclick = function () {
    //    modal.style.display = "none";
    //}
    function travis() {
        document.getElementById('myModal').style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    //window.onclick = function (event) {
    //    if (event.target == modal) {
    //        //modal.style.display = "none";
    //        document.getElementsByClassName("modal")[0].style.display = "none";
    //        document.getElementsByClassName("modal-content")[0].style.display = "none";

    //    }
    //}
    //localWalaStorage.js
    //alert("st. petersburg");
    function myFunction(event) {
        var x = event.target;
        if (x == document.getElementsByClassName("modal")[0]) {
            modal.style.color = "orange";
            modal.style.backgroundColor = "black";
            modal.style.display = "none";
            //document.getElementsByClassName("modal")[0].style.display = "none";
            //document.getElementsByClassName("modal-content")[0].style.display = "none";

        }

        //document.getElementById("demo").innerHTML = Triggered by a " + x.tagName + " element";
        //alert("Triggered by a " + x.tagName + " element");
    }

    var studentsArray = [];

    function brennan() {

        var fn = document.getElementById("fc").value;
        var ln = document.getElementById("ff").value;
        var rn = document.getElementById("bg").value;
        
        // Array being created here
        var d = new Date();
        var jsdateNum=d.getTime();
        var stuObj = { firstname: fn, lastname: ln, rollnum: rn ,jsd:jsdateNum};
        studentsArray.push(stuObj);
        localStorage.studentsRecord = JSON.stringify(studentsArray);
        var sn=0;
        var tn=0;
        
        prepareTableCell(fn, ln, rn,sn,tn);

        //acton();

        document.getElementById("fc").value = " ";
        document.getElementById("ff").value = " ";
        document.getElementById("bg").value = " ";
    }

    function garyspeed() {

        var fn = document.getElementById("fc").value;
        var ln = document.getElementById("ff").value;
        var rn = document.getElementById("bg").value;
		
		// Array being created here
		var d = new Date();
		var jsdateNum=d.getTime();
        var stuObj = { firstname: fn, lastname: ln, rollnum: rn ,jsd:jsdateNum};
        studentsArray.push(stuObj);
        localStorage.studentsRecord = JSON.stringify(studentsArray);
		var sn=0;
		var tn=0;
		
        prepareTableCell(fn, ln, rn,sn,tn);

        acton();

        document.getElementById("fc").value = " ";
        document.getElementById("ff").value = " ";
        document.getElementById("bg").value = " ";
    }
    function prepareTableCell(firstName, lastName, rollNum,maula,udf) {
        var table = document.getElementById("regtable");
        var row = table.insertRow();
        var firstNameCell = row.insertCell(0);
        var lastNameCell = row.insertCell(1);
        var rollNumCell = row.insertCell(2);
        var subjectCell = row.insertCell(3);
		var TSCell = row.insertCell(4);
        firstNameCell.innerHTML = firstName;
        lastNameCell.innerHTML = lastName;
        //firstNameCell.colSpan = 2;
        rollNumCell.innerHTML = rollNum;
        TSCell.innerHTML= udf;
		if(maula==0)
		{
		var mix=$("tr").length;
		subjectCell.innerHTML = mix-1;
		var d = new Date();
		TSCell.innerHTML = d;
		}
		else
		subjectCell.innerHTML = maula;
    }
    function loader() {
        //document.getElementById('Tbag').style.display=='none';
		//$("body").css("background-color","beige");
		//document.getElementById("regtable").style.backgroundColor="white";
        if (localStorage.studentsRecord) {
            studentsArray = JSON.parse(localStorage.studentsRecord);
            for (var i = 0; i < studentsArray.length; i++) {
                prepareTableCell(studentsArray[i].firstname, studentsArray[i].lastname, studentsArray[i].rollnum,i+1,studentsArray[i].jsd);
            }
        }

    }
    function loader2() {
        //document.getElementById('Tbag').style.display=='none';
        //$("body").css("background-color","beige");
        //document.getElementById("regtable").style.backgroundColor="white";
        if (localStorage.studentsRecord) {
            studentsArray = JSON.parse(localStorage.studentsRecord);
            for (var i = 0; i < studentsArray.length; i++) {
                prepareTableCell(studentsArray[i].firstname, studentsArray[i].lastname, studentsArray[i].rollnum,i+1,studentsArray[i].jsd);
            }
        }

    }
	function milano(){
	
				document.getElementById("fc").value="orange";
				document.getElementById("ff").value="arial";
				document.getElementById("bg").value="crimson";
	}

    function acton() {

        document.getElementById("monreal").style.color = document.getElementById("fc").value;
        document.getElementById("monreal").style.fontFamily = document.getElementById("ff").value;
        document.getElementById("monreal").style.backgroundColor = document.getElementById("bg").value;

    }


    function sss() {
        if (document.getElementById('Tbag').style.display == 'none') {
            document.getElementById('Tbag').style.display = 'block';
        }
        else {
            document.getElementById('Tbag').style.display = 'none';
        }
    }

    function garbage() {
        var imageID = "5a8fa95b36d1a00001b0bceb";
        var Device101 = "504582192261830";


    }