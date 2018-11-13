for(let i=0;i<45;i++)
{
	var div=document.createElement("div");
	document.getElementsByTagName("section")[0].appendChild(div);
	div.onclick=function()
	{
		//alert("you have clicked on # "+ (i+1))
		alert(`you have clicked on # ${i+1}`)
	}
}

var course = new Map();
		course.set('react', {description: 'ui'});
		course.set('jest', {description: 'testing'});

		console.log(course);
		console.log(course.react);
		console.log(course.get('jest'));




		var books = new Set();
		books.add('Pride and Prejudice');
		books.add('War and Peace')
			 .add('Oliver Twist');

		console.log(books);
		console.log('how many books?', books.size);
		console.log('has Oliver Twist?', books.has('Oliver Twist'));
		books.delete('Oliver Twist');
		console.log('has Oliver Twist still?', books.has('Oliver Twist'));

		var data = [4,2,4,4,2,5,1,6,7,5,6,8,2,7];
		var set = new Set(data);
		console.log('data.length', data.length);
		console.log('set.size', set.size);

		