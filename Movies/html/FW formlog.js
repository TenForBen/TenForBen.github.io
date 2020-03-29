function validate(form) 
{  var returnValue = true;  
	document.getElementById('UsernameError').innerHTML="";
	document.getElementById('PwdError').innerHTML="";
	document.getElementById('CPwdError').innerHTML="";

	var username = form.txtUserName.value; 
	 var password1 = form.txtPassword.value; 
	  var password2 = form.txtPassword2.value;
	  if(username.length < 6) 
	  {  returnValue = false;  
	  	//alert("Your username must be at least\n6 characters long.\n  Please try again.");
	  	document.getElementById('UsernameError').innerHTML="Your username must be at least\n6 characters long.\n  Please try again.";
	    document.frmRegister.txtUserName.focus();
	  }
	  if (password1.length < 6) 
	    {  
	    	returnValue = false; 
	    	// alert("Your password must be at least\n6 characters long.\n  Please try again.");  
	    	document.getElementById('PwdError').innerHTML="Your password must be at least\n6 characters long.\n  Please try again.";
	    	document.frmRegister.txtPassword.value = "";  
	    	document.frmRegister.txtPassword2.value = "";  
	    	document.frmRegister.txtPassword.focus();
	    }
	    if (password1 != password2)
	     {  returnValue = false;  
	     	//alert("Your password entries did not match.\nPlease try again.");
	     	document.getElementById('CPwdError').innerHTML="Your password entries did not match.Please try again.";
	     	  document.frmRegister.txtPassword.value = ""; 
	     	   document.frmRegister.txtPassword2.value = ""; 
	     	    document.frmRegister.txtPassword.focus();
     	}  
     	$(".message").css("display","block");
	     	return returnValue;
 }

 function dadlani(){

 	window.open("http://www.travelarmenia.am", "_self", "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=400");
 }

 function aCash(){

 	window.open("http://www.travelarmenia.am", "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=400");
 }
	//var x = document.getElementById("txtPassword");

	//x.addEventListener("blur",iwobi);
	//document.getElementById("txtPassword").addEventListener("blur",iwobi);
	//document.getElementById("txtPassword").addEventListener("blur",iwobi);
	//document.getElementById("txtPassword").style.backgroundColor="#900";
 //var iwobi=function()
 function iwobi()

 {
 	//var x = document.getElementById("txtPassword");
	this.style.backgroundColor="#fff";
	//alert(this.value);

	var password1=this.value;
	if (password1.length < 6) 
	    {  
	    	//returnValue = false; 
	    	// alert("Your password must be at least\n6 characters long.\n  Please try again.");  
	    	//document.getElementById('HeaderError').innerHTML="Your Entry must be at least\n6 characters long.\n  Please try again.";
	    	//document.getElementById('HeaderError').textContent="Your Entry must be at least\n6 characters long.\n  Please try again.";
	    	$("#HeaderError").css("visibility", "visible");
	    	this.value = "";  
	    	this.style.backgroundColor="#c11";
	    	//document.frmRegister.txtPassword2.value = "";  
	    	//this.focus();
	    }
    
}
function Nelson(){
	//var x = document.getElementById("txtPassword");
	this.style.backgroundColor="#ccc";
	//$("#HeaderError").css("display", "none");

}
function ainsley()
{
	//("#HeaderError").css("display", "none");
	//console.log("Selma woaking");
	$("#HeaderError").css("visibility", "hidden");
}
function HeaderError(){


}
$(document).ready(function(){
	$("#HeaderError").css("visibility", "hidden");
   $('#txtPassword').blur(iwobi);
   $('#txtPassword').focus(Nelson);
   $('#txtUserName').blur(iwobi);
   $('#txtUserName').focus(Nelson);
   $('#txtPassword2').focus(Nelson);
    $('#txtPassword2').blur(iwobi);
    $("input").keydown(ainsley);
    $(".message").css("display","block");

    //$("input").keydown(function(){
       // $("#HeaderError").css("display", "none");
   // });

});