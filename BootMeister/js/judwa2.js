//document.getElementById('inputbutton').addEventListener("click", Manjuel);
//document.getElementById('gauge').addEventListener("focus", manny);

/*function tablenoikkis {

    var ar=document.getElementById('gauge').value;
    //alert(ar);
    if(ar!="")
        kdb(ar);
    else
        document.getElementById('payyoli').style.display="block";
}
*/

function loader(){
    document.getElementById('gauge').addEventListener("focus", manny);

    //document.getElementById('timerbutton').addEventListener("click", chandp);
    var dtime="Oct 09, 2017 12:57:25";
    chand(dtime);
    document.getElementById('comrade').innerText=dtime;

    document.getElementById('timerid').addEventListener("keydown", luke);
        

}

function luke(){
    document.getElementById('comrade').innerHTML="";

}
function manny(){
    document.getElementById('payyoli').style.display="none";
}

function chandp(){
    var tp=document.getElementById('timerid').value;

    //chand(tp);
}

function KI(){
    var tati=document.getElementById('timerid').value;
    larojita(tati);

}

function Manjuel(){

    var ar=document.getElementById('gauge').value;
    //alert(ar);
    if(ar!="")
        kdb(ar);
    else
        document.getElementById('payyoli').style.display="block";
        //alert("give some value  in  text box");
    



}


//document.getElementById("myFrame").addEventListener("load", myFunction);
function ludwig(r){
    if(r=="Red")
        document.body.style.backgroundColor = "#f00";
    if(r=="Green")
        document.body.style.backgroundColor = "#0f0";
    if(r=="Blue")
        document.body.style.backgroundColor = "#00f";

}

function liking(){
    var gn=document.getElementsByName('selColor')[0]
    for(i=0;i<4;i++)
    { 
        if(gn.children[i].selected==1){
            alert(gn.children[i].value);
            ludwig(gn.children[i].value);

        }
    
    }
}

function MagicMike()
{
    //alert("welcome aboard");
    liking();

}

function kdb(x){

    //Green content

    var thing="#0" +x +"0";
    //alert(thing);
    document.body.style.backgroundColor = thing;

}

function bgchange(){
    alert("gussa hai");
    document.body.style.backgroundColor = "#000";
    document.body.style.backgroundImage = "H:\study stuff\Udemy - Become a Professional Web Developer\02 HTML and HTML5\codeds\img\isl.gif";
}
function Meade()
{
    var r=document.getElementById('remo');
    if(document.getElementById('remo').innerText=="EXPIRED"){

        var s=document.getElementById('Sion');

            if(s.style.display=="none")
                s.style.display="block";
            else
                s.style.display="none";

    }
}

function cuntkane()
{
    var s=document.getElementById('wale');

            if(s.style.display=="none")
                s.style.display="block";
            else
                s.style.display="none";
}

function cuntalli(){


    if(document.body.style.backgroundColor == "#0f0")
        document.body.style.backgroundColor = "#f00";
    else
        document.body.style.backgroundColor = "#0f0";
    
    //else
      //  document.body.style.backgroundImage = "url(img/isl.gif)";


}

function cuntdavies(){

    //if (document.body.style.backgroundImage == "url(img/isl.gif)")
    {
        document.body.style.backgroundImage ="url(H:/study stuff/Udemy - Become a Professional Web Developer/02 HTML and HTML5/codeds/img/Map_of_China.png)";

    }

}

function chand(t)
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

  // Display the result in the element with id="demo"
  document.getElementById("remo").innerHTML = days + "d " + hours + "h "
  + minutes + "m " + seconds + "s ";

  // If the count down is finished, write some text 
  if (distance < 0) {
    clearInterval(x);
    document.getElementById("remo").innerHTML = "EXPIRED";
  }
}, 100);
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


  document.getElementById("sofOL").innerHTML=tseconds + " seconds";
  document.getElementById("hofOL").innerHTML=thours+ " hours";
  document.getElementById("mofOL").innerHTML=tminutes+ " minutes";

  // Display the result in the element with id="demo"
  document.getElementById("emo").innerHTML = days + "d " + hours + "h "
  + minutes + "m " + seconds + "s ";

  // If the count down is finished, write some text 
  if (distance < 0) {
    clearInterval(x);
    document.getElementById("emo").innerHTML = "EXPIRED";
  }
}, 100);
}

function channingT()
        {

                    
                        var jhanda=1;  
                        var t=document.getElementById('hofOL');
                        var tatt=document.getElementById('mofOL');
                        //var jack=document.getElementById('sofOL');
                        var Fislands=document.getElementById('sofOL');
                        if(document.getElementById('gyulfi').checked==1){
                            t.style.display="block";
                            var jhanda=0;
                        }
                        else
                            t.style.display="none";
                            
                        
                        
                        if(document.getElementById('henrikh').checked==1){
                            tatt.style.display="block";
                            var jhanda=0;
                        }
                        else
                        {
                            tatt.style.display="none";
                        }
                        if(document.getElementById('torshvan').checked==1){
                            Fislands.style.display="block";
                            var jhanda=0;
                        }
                        else
                        {
                            Fislands.style.display="none";
                        }
                        
                        if (jhanda==1) {

                            jack.style.display="none";
                            //jack.style.display="block";
                        }
                    

        }

