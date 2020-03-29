function nodejayass(){

	//alert("hello world\n Gandu");


}
/*
var app = angular.module("myApp", []);
app.controller("myCtrl", function($scope)
 {
    //$scope.bokonkh = "Bocka Choda";
    //$scope.lastName = "Doe";

    var Maaneger={
			    	FN:"Slavan",
			    	LN:"Bilic",
			    	Crime:"of being a Cocky"
			    	flagSrc:"../img/OSodd34/amlarge.gif"

			     };
			     $scope.M=Maaneger;

	});

	*/
	function insideJob()
	{
	    var bx=$('#txtBox').val();
	    //alert(bx);

	    var result=bx.match(/\d+/g);
	    if(result!=null)
	    $("#txtArea").val(result);
    }

	/*$(document).ready(function(){
	
    });
});*/



function myFunction() {
    var para = document.createElement("P");
    var t = document.createTextNode("This is a paragraph.");
    para.appendChild(t);
    document.body.appendChild(para);


}

function RedBlack(){
	//With JQ
	
	$("body").css({"color":"#f00","background-color":"#000"});
	//$("body").css('background-color', 'black');
	//*/
	//with JS
	//document.body.style.backgroundColor = "#afc";
	//document.body.style.color = "red";




}
function WhiteRed(){
	$("body").css('color', '#fff');
	$("body").css('background-color', 'red');
}




function dusra()
{

	//u can add the first two p tags of (0 and 1 ) of the div tag using createElement option
	nodejayass()
	var Ptaglen=document.getElementsByTagName('div')[0].children.length;
	/*if (Ptaglen%2)
		RedBlack()
	else
		WhiteRed()*/
	

	var first=parseInt(document.getElementsByTagName('div')[0].children[Ptaglen-2].innerText);
	var second=parseInt(document.getElementsByTagName('div')[0].children[Ptaglen-1].innerText);
	var amos=document.createElement('p');//needs to be tested with any other HTML elements like Div or Section.
	var sumo=parseInt(first+second);
	amos.innerText=sumo;
	document.getElementsByTagName('div')[0].appendChild(amos);
	shaggy()
}
function treee(){
	var Ptaglen=document.getElementsByTagName('ol')[0].children.length;
	var first=parseInt(document.getElementsByTagName('ol')[0].children[Ptaglen-2].innerText);
	var second=parseInt(document.getElementsByTagName('ol')[0].children[Ptaglen-1].innerText);
	var amos=document.createElement('li');//needs to be tested with any other HTML elements like Div or Section.
	var sumo=parseInt(first+second);
	amos.innerText=sumo;
	$('ol').append(amos);
	//document.getElementsByTagName('ol')[0].appendChild(amos);
}
function shaggy()
{

					var vg=document.getElementsByTagName("p").length;
					for(i=0;i<vg;i++)
					{
						document.getElementsByTagName("p")[i].style.lineHeight="1";
						if(i%2)
							document.getElementsByTagName("p")[i].style.backgroundColor="#f4f4f4";
						else
							document.getElementsByTagName("p")[i].style.backgroundColor="#fff";
					}
						

}

function fibs(){

	var Ptaglen=document.getElementsByTagName('div')[0].children.length;


	var first=document.getElementsByTagName('div')[0].children[Ptaglen-2].innerText;
	var second=document.getElementsByTagName('div')[0].children[Ptaglen-1].innerText;
	var amos=document.createElement('p');
	var sumo=parseInt(first+second);
	amos.innerText=sumo;
	document.getElementsByTagName('div')[0].appendChild(amos);


}





