var nameofepisode= prompt("Enter the name of episode")

let searchepisode= (input="Pilot")=>		//Used Arrow function and default value assigned
{
	for (list in tvshow._embedded.episodes)
	{
		if(tvshow._embedded.episodes[list].name == input)
		{
			let episodedetails= tvshow._embedded.episodes[list]
			console.log(episodedetails);
			var epiosodefound=1;
		}
		
	}
	//var epiosodefound=1;
	if (epiosodefound==1)
		alert("details in console")
	else
		alert("Please enter a valid epiosode name")



}
   if(nameofepisode.length>0)
   		searchepisode(nameofepisode)		//When a valid episode name is searched.
   	else
   		searchepisode()						//Default argument value will be used in case of blank search