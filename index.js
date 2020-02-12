const fetchData = async (search) => {
	if (!search) return;
	var fakeData = [
		{
			Title: 'The Avengers',
			Year: '2012',
			imdbID: 'tt0848228',
			Type: 'movie',
			Poster:
				'https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg'
		}
	];
	// return fakeData;
	try {
		const response = await axios.get('http://www.omdbapi.com/', {
			params: {
				apikey: '3177e88b',
				s: search
			}
		});
		if (response.data.Error) return [ { Title: "We didn't find any content", Poster: '' } ];
		return response.data.Search;
	} catch (err) {
		return [];
	}
};

async function fetchMovieDetail(imdbID) {
	if (!imdbID) return;
	var fakeData = {
		Title: 'The Avengers',
		Year: '2012',
		Rated: 'PG-13',
		Released: '04 May 2012',
		Runtime: '143 min',
		Genre: 'Action, Adventure, Sci-Fi',
		Director: 'Joss Whedon',
		Writer: 'Joss Whedon (screenplay), Zak Penn (story), Joss Whedon (story)',
		Actors: 'Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth',
		Plot:
			"Earth's mightiest heroes must come together and learn to fight as a team if they are going to stop the mischievous Loki and his alien army from enslaving humanity.",
		Language: 'English, Russian, Hindi',
		Country: 'USA',
		Awards: 'Nominated for 1 Oscar. Another 38 wins & 79 nominations.',
		Poster:
			'https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg',
		Ratings: [
			{ Source: 'Internet Movie Database', Value: '8.0/10' },
			{ Source: 'Rotten Tomatoes', Value: '91%' },
			{ Source: 'Metacritic', Value: '69/100' }
		],
		Metascore: '69',
		imdbRating: '8.0',
		imdbVotes: '1,213,103',
		imdbID: 'tt0848228',
		Type: 'movie',
		DVD: '25 Sep 2012',
		BoxOffice: '$623,279,547',
		Production: 'Walt Disney Pictures',
		Website: 'N/A',
		Response: 'True'
	};
	// return fakeData;
	try {
		const response = await axios.get('http://www.omdbapi.com/', {
			params: {
				apikey: '3177e88b',
				i: imdbID
			}
		});
		return response.data;
	} catch (err) {
		return {};
	}
}

class Autocomplete {
	constructor(root, onInputDelay = 500) {
		if (!root) throw new Error(`Invalid root ${root}`);
		this.root = root;
		this.root.classList.add('autocomplete');
		this.root.innerHTML = `
			<label><b>Search for a movie</b></label>
			<div class="dropdown">
				<input type="text" class="dropdown-input">
				<div class="dropdown-menu">
					<div class="dropdown-content"><div>
				</div>
			</div>
		`;
		this.input = this.root.querySelector('.dropdown-input');
		this.dropdown = this.root.querySelector('.dropdown');
		this.dropdownContent = this.root.querySelector('.dropdown-content');
		this.onItemClick = null;
		this.onInput = null;

		this.input.addEventListener('input', debounce(this.handleInput, onInputDelay));
		document.addEventListener('click', this.handleHide);
	}

	handleHide = (e) => {
		if (!this.dropdown.contains(e.target)) {
			this.dropdown.classList.remove('is-active');
		} else if (e.target === this.input) {
			this.input.value && this.dropdown.classList.add('is-active');
		}
	};

	handleInput = (e) => {
		if (this.onInput) this.onInput(e.target.value);
	};

	renderItems = (items, callback) => {
		if (items.length <= 0) {
			this.dropdown.classList.remove('is-active');
		} else {
			this.dropdownContent.innerHTML = '';
			for (let item of items) {
				const element = document.createElement('a');
				if (callback) callback(item, element);

				element.classList.add('dropdown-item');
				element.addEventListener('click', (e) => {
					this.handleItemClick(e, item);
				});

				this.dropdownContent.append(element);
			}
			this.dropdown.classList.add('is-active');
		}
	};

	handleItemClick = (e, item) => {
		this.dropdown.classList.remove('is-active');
		if (this.onItemClick) this.onItemClick(item, e);
	};
}

class Movie {
	constructor(selector) {
		this.root = document.querySelector(selector);
		if (!document.contains(this.root)) throw new Error(`Error selecting ${selector}`);
		this.root.classList.add('movie');

		const autoCom = document.createElement('div');
		this.root.append(autoCom);

		this.detailElement = document.createElement('div');
		this.detailElement.classList.add('movie__detail');
		this.root.append(this.detailElement);

		this.isDone = false;
		this.onChange = null;
		this.onRender = null;

		this.autocomplete = new Autocomplete(autoCom);
		this.autocomplete.onInput = this.renderMovieItems;
		this.autocomplete.onItemClick = this.handleMovieClick;
	}

	renderMovieItems = async (value) => {
		const movies = await fetchData(value);
		this.autocomplete.renderItems(movies, this.renderMovieItem);
	};

	renderMovieItem(movie, element) {
		const imgUrl = movie.Poster === 'N/A' ? './img/placeholder.png' : movie.Poster;
		element.innerHTML = `
				<img src="${imgUrl}"/>
				<h1>${movie.Title} (${movie.Year})</h1>
			`;
	}

	handleMovieClick = (movie) => {
		this.autocomplete.input.value = movie.Title;
		this.autocomplete.renderItems([ movie ], this.renderMovieItem);
		this.renderMovieDetail(movie);
		this.isDone = true;
		if (this.onChange) this.onChange(movie);
	};

	renderMovieDetail = async (movie) => {
		const movieDetail = await fetchMovieDetail(movie.imdbID);

		if (movieDetail.Response === 'True') {
			this.detailElement.innerHTML = this.movieDetailTemplate(movieDetail);

			this.setMovieDetail(movieDetail);
			if (this.onRender) this.onRender(movie);
		}
	};

	setMovieDetail({ Awards, BoxOffice, Metascore, imdbRating, imdbVotes }) {
		this.movieDetail = {
			dollars: {
				value: +BoxOffice.replace(/\$/g, '').replace(/,/g, ''),
				element: this.root.querySelector('.dollars')
			},
			metascore: {
				value: parseInt(Metascore),
				element: this.root.querySelector('.metascore')
			},
			imdbRating: {
				value: parseFloat(imdbRating),
				element: this.root.querySelector('.imdbRating')
			},
			imdbVotes: {
				value: parseInt(imdbVotes.replace(/,/g, '')),
				element: this.root.querySelector('.imdbVotes')
			},
			awards: {
				value: Awards.split(' ').reduce((prev, curr) => {
					const currentInt = parseInt(curr);
					if (isNaN(currentInt)) {
						return prev;
					}
					return prev + currentInt;
				}, 0),
				element: this.root.querySelector('.awards')
			}
		};
	}

	movieDetailTemplate = (movieDetail) => {
		const {
			Poster,
			Title,
			Genre,
			Plot,
			Awards,
			BoxOffice,
			Metascore,
			imdbRating,
			imdbVotes
		} = movieDetail;
		return `
			<article class="media">
				<figure class="media-left">
					<p class="image">
						<img src="${Poster}" alt=""/>
					</p>
				</figure>	
				<div class="media-content">
					<div class="content">
						<h1>${Title}</h1>
						<h4>${Genre}</h4>
						<p>${Plot}</p>
					</div>
				</div>	
			</article>
			<article class="awards notification is-primary">
				<p class="title">${Awards}</p>
				<p class="subtitle">Awards</p>
			</article>
			<article class="dollars notification is-primary">
				<p class="title">${BoxOffice}</p>
				<p class="subtitle">BoxOffice</p>
			</article>
			<article class="metascore notification is-primary">
				<p class="title">${Metascore}</p>
				<p class="subtitle">Metascore</p>
			</article>
			<article class="imdbRating notification is-primary">
				<p class="title">${imdbRating}</p>
				<p class="subtitle">imdbRating</p>
			</article>
			<article class="imdbVotes notification is-primary">
				<p class="title">${imdbVotes}</p>
				<p class="subtitle">imdbVotes</p>
			</article>
		`;
	};
}

(function MovieFight() {
	const movieL = new Movie('#left-movie');
	const movieR = new Movie('#right-movie');
	let isTutorialHidden = false;

	movieL.onRender = runComprison;
	movieR.onRender = runComprison;

	function runComprison() {
		if (!isTutorialHidden) {
			document.querySelector('.tutorial').classList.add('is-hidden');
			isTutorialHidden = true;
		}

		if (movieL.isDone && movieR.isDone) {
			let loser;
			for (let detail of Object.keys(movieL.movieDetail)) {
				if (movieL.movieDetail[detail].value === movieR.movieDetail[detail].value) continue;

				if (movieL.movieDetail[detail].value < movieR.movieDetail[detail].value) {
					loser = movieL;
				} else {
					loser = movieR;
				}
				loser.movieDetail[detail].element.classList.add('is-warning');
				loser.movieDetail[detail].element.classList.remove('is-primary');
			}
		}
	}
})();
