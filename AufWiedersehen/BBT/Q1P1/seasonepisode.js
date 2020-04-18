//let seasonnumber= prompt("Enter the season number")


//let episodenumber= prompt("Enter the episode number")

function sindhu()
{

	let seasonnumber= document.getElementById('s').value
	let episodenumber= document.getElementById('e').value

	output(seasonnumber,episodenumber);



}
let output=(input1= 1, input2=7)=>		//Used Arrow Function and default value assigned which is lastest season & episode number
{
	for (let list in tvshow._embedded.episodes)
	{	
		if (tvshow._embedded.episodes[list].season == input1)
		{
			if(tvshow._embedded.episodes[list].number== input2)
			{
				let information= tvshow._embedded.episodes[list]
				//console.log(information);
				var epiosodefound=1;

				document.getElementById("apdi").value=tvshow._embedded.episodes[list].name
				$("#groundBreaking")[0].src=tvshow._embedded.episodes[list].image.original
			}
		}
	}
	//
	//if (epiosodefound==1)
		//alert("details in console")
	//else
		//alert("Please enter a valid epiosode name")

}
if((seasonnumber.length==0)||(episodenumber.length==0))	//If either of the inputs are blank or 0, it will take the assigned default values as inputs
output();
else
output(seasonnumber, episodenumber);	//Else it will the search for the given inputs



