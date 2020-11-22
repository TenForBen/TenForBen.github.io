function pageLodader() 
{
        //document.getElementById('Tbag').style.display=='none';
        //$("body").css("background-color","beige");
        //document.getElementById("regtable").style.backgroundColor="white";
        if (train)
         {
            //wordsArray = JSON.parse(worter);
            for (var i = 0; i < train.length; i++)
             {
                BrepareTableCell(train[i].Places, train[i].Coordinates);               
             }
        }
}

 function BrepareTableCell(firstName, lastName) 
{
        var table = document.getElementById("regtable");
        var row = table.insertRow();
        var firstNameCell = row.insertCell(0);
        var lastNameCell = row.insertCell(1);
        
        firstNameCell.innerHTML = firstName;
        lastNameCell.innerHTML = lastName;              
}


function channelAnchors()
{
    var nextB = document.getElementsByTagName("button")[1]
    var prevB = document.getElementsByTagName("button")[0]

    nextB.classList.add("btn-success")
    prevB.classList.add("btn-danger")

    

}



