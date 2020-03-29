//var anc=document.C


function bgchange(){
    alert("gussa hai");
    document.body.style.backgroundColor = "#000";
    document.body.style.backgroundImage = "none";
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


function Resetadodini()//Created on 9/26 for Reset the checked radio buttons
{
/*if(document.getElementById('henrikh').checked==1){
                            tatt.style.display="block";
                            var jhanda=0;
                        }
                        else
                        {=="EXPIRED"
                            tatt.style.display="none";
                        }
                        if(document.getElementById('torshvan').checked==1){
                            Fislands.style.display="block";
                            var jhanda=0;

                            document.getElementById('gyulfi').checked=0;
                            document.getElementById('torshvan').checked=0;
                            document.getElementById('henrikh').checked=0;

                            //document.getElementById('username').value="";*/

                           var Iaitee=document.getElementsByTagName('input');
                            len=Iaitee.length;

                            for(i=0;i<len;i++){
                                if(Iaitee[i].type=="radio")
                                {
                                    Iaitee[i].checked=0;
                                    if(Iaitee[i].type=="text")
                                        {
                                            Iaitee[i].value="";
                                        }

                                }
                            }





luizYellow();

document.getElementById('username').value="";
}

function stabini(){
    var Iaitee=document.getElementsByTagName('input');
    len=Iaitee.length;

    for(i=0;i<len;i++){
        if(Iaitee[i].type=="radio")
        {
            Iaitee[i].checked=0;
        }
    }
}

function totalinputtags()
{
    var it=document.getElementsByTagName('input').length;
    alert("total input tags =" +it);
}

function focusJS(){
    //alert("Guss gaya hu function ke andar");
    var x=document.getElementById('username');
    //un.style.background-color="orange";
    x.style.background = "red";
}
function blurrJS(){
    //alert("Guss gaya hu function ke andar");
    var x=document.getElementById('username');
    //un.style.background-color="orange";
    x.style.background = "white";
}

function focusJQ(){
    //alert("Guss gaya hu function ke andar");
    //var x=document.getElementById('username');
    //un.style.background-color="orange";
    //x.style.background = "red";
    $("#username").css("background-color", "#cccccc");
}
function blurrJQ(){
    //alert("Guss gaya hu function ke andar");
    //var x=document.getElementById('username');
    //un.style.background-color="orange";
    //x.style.background = "white";
    $("#username").css("background-color", "#00a200");
}



function scranton(){
    var element = document.getElementById("myDIV");
    element.classList.toggle("mystyle");
}
function kanha(){
    //alert("Guss gaya hu function ke andar");
    b=document.getElementById("manohari");
    c=document.getElementById("Nsiblingwala");
    c.style.display="inline";

    //we can split the input here..

    var chamar=b.value;
    cock=chamar.split(" ");

    pitt=cock[0];
    c.innerHTML = "<br>" +pitt;
}

function SplitsVilla() {

    var x = document.getElementById("manohari").value;
    nwstr=x.toUpperCase();
    document.getElementById("manohari").value=nwstr;

    var str = "31:05:00";
    var res = str.split(":");
    //alert(str.length);
    //var WL=("Win " + res[0] + ": Loss " + res[1]");
    //alert("W "  +res[0] +"/ L " +res[1]);
    //document.getElementById("demo").innerHTML = WL;
}

function lawda(){
    //var element = document.getElementById("div1");
    ds=document.getElementsByTagName('div')[0];
    //kids never use tagname selector cuz it will prove costly later.
    var ps=document.getElementsByTagName('p');

    var uw=ps[4];
    $('fieldset').css("background-color", "#333");
    //ds.removeChild(uw);
    // wat u learnt earlier is ds=document.body/head or something...
    var un=document.getElementById('username');

    un.addEventListener("blur",bumroh)/*{
            //alert("mission kashmir ");

            document.getElementById('username').value="u have been blurred";
        });*/


    function bumroh()
        {
            //alert("mission kashmir ");
            //document.getElementById('username').value="u have been blurred";
        }

        var x = document.getElementById("myBtn");
        x.addEventListener("mouseover", myFunction);
        x.addEventListener("click", mySecondFunction);
        x.addEventListener("mouseout", myThirdFunction);
        //x.addEventListener("contextmenu", bullshit);

        function myFunction() {
            document.getElementById("demo").innerHTML += "Moused over!<br>"
        }

        function mySecondFunction() {
            document.getElementById("demo").innerHTML += "Clicked!<br>"
        }

        function myThirdFunction() {
            document.getElementById("demo").innerHTML += "Moused out!<br>"
        }
        /*function bullshit{
            document.getElementById("demo").style.display="none";
        }*/

}
        function luizRed(){

                




            if (document.getElementById('username').value=="v")
                {
                    var xx = document.getElementById("logo");
                    /*if (*/xx.style.visibility="visible";
                      /* {
                            xx.style.visibility="hidden";
                        }
                    else{
                        xx.style.visibility="visible";
                    }*/
                        //For ISL

                        var t=document.getElementById('ISL');
                        var tatt=document.getElementById('ARM');

                        if(document.getElementById('gyulfi').checked==1){
                            t.style.display="block";
                        }
                        if(document.getElementById('henrikh').checked==1){
                            tatt.style.display="block";
                        }



                    


            }
            if (document.getElementById('username').value=="vv")
                {
                    var xx = document.getElementById("logo");
                    /*if (*/xx.style.visibility="hidden";
                      /* {
                            xx.style.visibility="hidden";
                        }
                    else{
                        xx.style.visibility="visible";
                    }*/


            }





            document.getElementById("logo").innerHTML += "Clicked!<br>"
        }


        function luizYellow(){
            var usN=document.getElementById('username');

            if(usN.value=="input") 
            totalinputtags();


            if (document.getElementById('username').value=="v")
                {
                    var xx = document.getElementById("logo2");
                    /*if (*/xx.style.visibility="visible";
                      /* {
                            xx.style.visibility="hidden";
                        }
                    else{
                        xx.style.visibility="visible";
                    }*/
                        //For ISL
                          var jhanda=1;  
                        var t=document.getElementById('ISL');
                        var tatt=document.getElementById('ARM');
                        var jack=document.getElementById('jw10');
                        var Fislands=document.getElementById('FIL');
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
                         jhanda=0;




                    


            }
            if (document.getElementById('username').value=="vv")
                {
                    var xx = document.getElementById("logo2");
                    /*if (*/xx.style.visibility="hidden";
                      /* {
                            xx.style.visibility="hidden";
                        }
                    else{
                        xx.style.visibility="visible";
                    }*/


            }


            if (document.getElementById('username').value=="CodeRed")
                    despacito();

            function despacito(){
                    var t=document.getElementById('ISL');
                        var tatt=document.getElementById('ARM');
                        var jack=document.getElementById('jw10');
                        var Fislands=document.getElementById('FIL');
                 if (document.getElementById('username').value=="CodeRed")
                    Fislands.style.display="block";



            }





            //document.getElementById("logo").innerHTML += "Clicked!<br>"
        }

        function channingTatum()
        {

                    if (document.getElementById('username').value=="v")
                    {

                        var jhanda=1;  
                        var t=document.getElementById('ISL');
                        var tatt=document.getElementById('ARM');
                        var jack=document.getElementById('jw10');
                        var Fislands=document.getElementById('FIL');
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

        }

        function hgwells(x){

            if (document.getElementById('username').value=="SKA"){

                document.getElementById("demo").style.display="block";
            }
        }
        function jimiki(){

            var s=document.getElementById('sheril');

            s.style.display="block";

            var aas=document.getElementById('ISC');

            aas.style.display="none";

            var s=document.getElementById('zapa');

            s.style.display="block";
        }

        function kammal(){

            var s=document.getElementById('zapa');

            s.style.display="none";

            var aas=document.getElementById('sheril');

            aas.style.display="none";

            var as=document.getElementById('ISC');

            as.style.display="block";

             var para = document.createElement("p");
            var node = document.createTextNode("This is new.");
            //para.appendChild(node);

            var element = document.getElementById("div1");
            //element.appendChild(para);



        }
        function pogba(){
            
                setTimeout(vlad, 2000, "First parameter", "Second parameter");

        }


        function vlad(){

            var ly =document.getElementById('LP');
            
            if (ly.style.display=="block"){
                ly.style.display="none";
            }

            else
            ly.style.display="block";
        }

        function shitaku(){
            //var ly =document.getElementById('LP');


            var ly =document.getElementById('LY');
            ly.style.color='white';
            ly.style.textDecoration='line-through'


        }


function kashmir(){
    var un=document.getElementById('username')


}

$(document).ready(function(){
    $("#email").focus(function(){
        $(this).css("background-color", "#cccccc");
    });
    $("#email").blur(function(){
        $(this).css("background-color", "#ffffff");
    });
});

function myFunction(e) {
    x = e.clientX;
    y = e.clientY;
    coor = "Coordinates: (" + x + "," + y + ")";
    var Reun=document.getElementById('on');
    if (Reun.checked==1)
        {
            document.getElementById("demon").innerHTML = coor;
        }
}

function clearCoor() {
    document.getElementById("demon").innerHTML = "";
}