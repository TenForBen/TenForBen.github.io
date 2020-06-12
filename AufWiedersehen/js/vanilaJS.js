document.addEventListener('click', function (event) {

				// Only run if the clicked link was an accordion toggle
				if ( !event.target.classList.contains('accordion-toggle') ) return;

				// Get the target content
				var content = document.querySelector(event.target.hash);
				if ( !content ) return;

				// Prevent default link behavior
				event.preventDefault();

				// If the content is already expanded, collapse it and quit
				if ( content.classList.contains('active') ) {
					content.classList.remove('active');
					return;
				}

				// Get all accordion content, loop through it, and close it
				var accordions = document.querySelectorAll('.accordion');
				for (var i = 0; i < accordions.length; i++) {
					accordions[i].classList.remove('active');
				}

				// Open our target content area
				content.classList.add('active');

			}, false);