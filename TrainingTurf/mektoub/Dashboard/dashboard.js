

function fabrecoder{

		for(var i=0;i<9;i++)
	{
		
		if(i==2)
        {
         }
        else{
		var c=document.getElementsByTagName("table")[i].children[0].children[1].children[2].innerText
		var c_split=c.split("%")
		console.log(c_split[0])
		var el=c_split[0];


		if(el>90)
			document.getElementsByTagName("table")[i].children[0].children[1].children[2].style.backgroundColor="green"
		else
			document.getElementsByTagName("table")[i].children[0].children[1].children[2].style.backgroundColor="red"}   

		

	}

	}