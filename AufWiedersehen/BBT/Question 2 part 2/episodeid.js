var inputid= prompt("Enter an Episode Id")

let fulldetails= (input= 1410334)=>	//Used Arrow function
{
	for (list in tvshow._embedded.episodes)
	{
		if (tvshow._embedded.episodes[list].id == input)
		{
			let episodeinformation= tvshow._embedded.episodes[list]
			console.log(episodeinformation);
			var epiosodefound=1;
		}
	}
	//
	if (epiosodefound==1)
		alert("details in console")
	else
		alert("Please enter a valid epiosode name")


}
if (inputid.length>0)				//It will take the given episode id
	fulldetails(inputid, tvshow);
else
	fulldetails()					//It will take the recent episode id by default


