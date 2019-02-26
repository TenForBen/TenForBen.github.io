function SRD(wk,j)
{
	
    	let counter=0;
   for (let list in wk.Tag )
    {
	    if(wk.Tag[list].id==j)
	    {
	    //console.log(wk.Tag[list].Bets)
	    //counter=counter+1;
	    //ref.Tag[3].Bets.length
	    		var totBets=wk.Tag[list].Bets.length
	    		var rew=0
	    		for(i=0;i<totBets;i++)
	    				{
							counter=wk.Tag[list].Bets[i].wager+counter
							var res=wk.Tag[list].Bets[i].Result
							if(res=="L")
							{
								rew=rew-wk.Tag[list].Bets[i].wager
							}
							else
								rew=rew+wk.Tag[list].Bets[i].Reward

	    				}
	    				//console.log(counter)
	    				$("#e")[0].value=counter
	    				$("#r")[0].value=rew



	    }
    }

}
function furious()
{

	var j=$("#s")[0].value
	SRD(ref,j)


}

