document.addEventListener("mousemove", myFunction);

function myFunction() {
    document.getElementById("RandomNumber").innerHTML = Math.random();
}

function removeHandler() {
    document.removeEventListener("mousemove", myFunction);
}


function mouseDown() {
    document.getElementById("myP").style.color = "red";
}

function mouseUp() {
    document.getElementById("myP").style.color = "green";
}

function bigImg(x) {
    //x.style.height = "64px";
    //x.style.width = "64px";
    x.style.color="#00f";


}

function normalImg(x) {
    //x.style.height = "32px";
    //x.style.width = "32px";
    x.style.color="#f0f";
}