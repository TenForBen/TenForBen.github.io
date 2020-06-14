function pageLodader() {
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
      
        //lastNameCell.innerHTML = ;
        //var eurl= "<a href="http://www.m.soccerway.mobi/?sport=soccer&page=news&view=article&news_id=1099740&localization_id=www" > sample link</a>";
       // http://www.m.soccerway.mobi/?sport=soccer&page=news&view=article&news_id=1099740&localization_id=www
       //<a href="http://www.m.soccerway.mobi/?sport=soccer&page=news&view=article&news_id=1099740&localization_id=www" > sample link</a>

        //firstNameCell.colSpan = 2;
        
    }