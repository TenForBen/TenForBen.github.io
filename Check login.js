function starter()
{

	var userid= prompt("Enter the username")
	var password= prompt("Enter the password")
	var userfound= false
	var passwordcorrect= false
	result(userid, password, allusers);

}

let result=(userid,password, allusers)=>
{
	for (currentuser in allusers.userslist)
	{
		//let fulldet= allusers.userslist[currentuser]
		console.log(allusers.userslist[currentuser])  //look into this
		
		if(allusers.userslist[currentuser].username== userid)
		{
			if(allusers.userslist[currentuser].password== password)
			{
				userfound= true
				passwordcorrect= true
				var UserNma=allusers.userslist[currentuser].name
				$('span')[0].innerText=allusers.userslist[currentuser].name
				$('span')[1].innerText=allusers.userslist[currentuser].name
				break

			}
			else
			{
				userfound= true
				passwordcorrect=false
				break
			}

		} else{
			userfound=false
		}

	}//end of loop
	if (userfound== true && passwordcorrect==true)
	{
		alert(`You are logged in, Welcome ${userid}`)

	}
	else if(userfound==true && passwordcorrect==false)
	{
		alert(`You are unable to login ${userid}, please provide correct password`)
	}
	else 
	{
		alert('Invalid Userid, Please provide valid Userid')
	}

	}
	


	