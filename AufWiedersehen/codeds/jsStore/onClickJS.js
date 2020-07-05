function myFunction() {
    document.getElementById("demo").innerHTML = "Hello World";
    document.getElementById("btn1").value = "m d unsung hero of CRS";
    
}	


function palat(){

	//$("p").html="something";
	document.getElementById("demo").innerHTML = "baffeHello World";


}

function dhiyan(x) {
	document.getElementById("demo").innerHTML = "Hello World";
    x.style.height = "32px";
    x.style.width = "32px";
    x.style.textDecoration = "line-through underline";
}

$(document).ready(function(){
    $("p").hover(function()
    {
        $(this).css("background-color", "yellow");
        }, 

    function(){
        $(this).css("background-color", "pink");
    });
});

$(document).ready(function(){

	//Differance between find and children
	//
    $("dl").find("span").css({"color": "black", "border": "1px solid green"});

    $("dl").children("dd").css({"color": "red", "border": "1px solid green"});
});


$(document).ready(function(){
    $("button").click(function(){
        $("div").contents().filter("marquee").wrap("<b/>");
    });
});

$(document).ready(function(){
    $("button[id='double']").click(function(){
        $("#demo").css("color", "red")
            .slideUp(2000)
            //$(dl).css("color","black")
            .slideDown(2000);
    });
});

function Dropdwn() {
    document.getElementById("myDropdown").classList.toggle("show");
}

function Genara(){

	var gene=$("#btn2").val();
	//ar gene=document.getElementById('btn2').value;
	if (gene=="")
	alert("somethign is not cool");
	else
		alert("here u have  "+gene);


}
