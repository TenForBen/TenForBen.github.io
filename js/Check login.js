function starter()
{
//var userid= prompt("Enter the username")
	var userid=$("#txtUserName")[0].value
	//var password= prompt("Enter the password")
	var password=$("#txtPassword")[0].value
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
				$("#user")[0].innerText=allusers.userslist[currentuser].name
				$("#bottomMQ")[0].innerText=allusers.userslist[currentuser].name
				//$('span')[1].innerText=allusers.userslist[currentuser].name
					
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
		//alert(`You are logged in, Welcome ${userid}`)
		$('#WelcomeText')[0].style.visibility="visible"
		$('#nosuser2')[0].style.display="block"

	}
	else if(userfound==true && passwordcorrect==false)
	{
		$("#CPwdError")[0].innerText=`You are unable to login with ${userid}, please provide correct password`
	}
	else 
	{
		$("#CPwdError")[0].innerText ='Invalid Userid, Please provide valid Userid'
	}

	}
	


	