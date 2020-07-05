function hideous()
{
	var xxx=document.getElementsByTagName('div')[2];

	//.style.textDecoration = "underline overline";
	//xxx.style.textDecoration="none";
	xxx.style.textDecoration="underline";
	//"none|underline|overline|line-through|blink|initial|inherit"
	//setTimeout(function(){ alert("New funcgtion is about 2 get calledss"); }, 3000);
	//newFuction(xxx);
	setTimeout(nf,8000);
	setTimeout(nf2,5000);
	setTimeout(nf3,5000);
	
}

function newFuction(ss){

	//object.style.visibility = "visible|hidden|collapse|initial|inherit"
	//document.getElementsByTagName('div')[2].style.textDecoration="line-through";
	ss.style.visibility="hidden"
	//document.getElementsByTagName('div')[2].style.visibility="hidden"

}

function nf(){
	document.getElementsByTagName('div')[1].style.visibility="hidden"
	console.log("hidden the 2nd div ,here starts 8s delay");
}
function nf2(){
	//document.getElementsByTagName('div')[2].style.visibility="hidden"
	document.getElementsByTagName('div')[2].style.textDecoration="none";
	console.log("made text textDecoration none on 3rd div 5s delay");
	
}
function nf3(){
	document.getElementsByTagName('div')[2].style.display="none";
	console.log("made the display none for 3rd Div element");
}

