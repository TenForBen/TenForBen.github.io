
function taklani() 
{ 
    if (document.cookie.length != 0) 
        { var nameValueArray = document.cookie.split("=");
         document.getElementById("ddlTheme").value = nameValueArray[1]; 
        document.getElementById('bandgi').style.backgroundColor = nameValueArray[1]; 
        } 
}
   function setColorCookie() 
  { var selectedValue = document.getElementById("ddlTheme").value; 
    if (selectedValue != "Select Color") 
      { 
          document.getElementById('bandgi').style.backgroundColor = selectedValue;
           document.cookie = "color=" + selectedValue + ";"; 
         }
  }


var modal = document.getElementById('myModal');

// Get the button that opens the modal
var btn = document.getElementById("myBtn");
$(document).ready(function()
{
$("button:last").css("padding","10px 10px");
$("#fonte").css("display","block");
//$("#fonte").change(stockholm());

});
// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal 
function oohaah() {

    document.getElementById('myModal').style.display = "block";
    //$('.modal').css("zIndex","-1")
}

// When the user clicks on <span> (x), close the modal
 function xjuma() {
    document.getElementById('myModal').style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
/*window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}*/

function WinClick(event)
{
    var modal = document.getElementById('myModal');
  //
   if (event.target == modal) 
    {
       modal.style.display = "none";
    //alert(event.target);
    }


}
      function DCchillin(){
        document.getElementById("wale").style.fontWeight="700";
        var myWindow = window.open("https://www.youtube.com/watch?v=rs974rx1uxQ", "", "width=600,height=600");
      }

      function stockholm()
      {
          document.getElementById('myModal').style.fontFamily=document.getElementById('fonte').value;
        //document.getElementById('myModal').style.fontFamily=$("#fonte")[0].value;
        //var sh=$("#fonte")[0].value;
        //$('#myModal').css("font-family",sh)
      }