function lastGw() 
{
  var x = document.createElement("BUTTON");
  var t = document.createTextNode("LAST_GW");
  x.appendChild(t);
  //document.body.section.appendChild(x);
  document.getElementById("myList").appendChild(x);
}

lastGw();

function nextGw() 
{
  var x = document.createElement("BUTTON");
  var t = document.createTextNode("NextGW");
  x.appendChild(t);
  //document.body.section.appendChild(x);
  document.getElementById("myList").appendChild(x);
}

nextGw();