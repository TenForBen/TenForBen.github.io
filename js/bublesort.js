let bubbe_Sort= (a=[5,2,8,7,1,6])=>// Arrow Function and default values are assigned
{
	let swapp;
	var n= a.length-1;
	var x=a;
	do {
		swapp= false;
		for (let i=0; i<n; i++)
		{
			if(x[i]< x[i+1])
			{
				var temp= x[i];
				x[i]=x[i+1];
				x[i+1]= temp;
				swapp= true;
			}
		}
		n--;
	} while(swapp);
	for (let ii=0; ii<x.length; ii++)
		console.log(`element ${ii+1} is  ${x[ii]} `); // Template literals of ES6 are used here to mention the new positions of the array
	//console.log(x)
}

aa=[712,621,232,845,554];
bubbe_Sort(aa);
bubbe_Sort(); // To show the default argugments work for this function 


