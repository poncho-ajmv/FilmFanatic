import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import MovieCarousel from "./MovieCarousel";
import Footer from "./Footer";
import StarRating from "./StarRating";
import useDebounce from "./useDebounce";
import "./MovieList.css";
import "./MovieDetail.css";
import "./Logocss.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const API_URL = "https://api.themoviedb.org/3";
const API_KEY = "674684d28cd5c404ad1bf06cd1a5d482";
const IMAGE_PATH = "https://image.tmdb.org/t/p/w200";
const BACKDROP_PATH = "https://image.tmdb.org/t/p/w1280";

function App() {
  const [movies, setMovies] = useState([]);
  const [searchKey, setSearchKey] = useState("");
  const [trailer, setTrailer] = useState(null);
  const [movie, setMovie] = useState({ title: "Loading Movies" });
  const [playing, setPlaying] = useState(false);
  const [cast, setCast] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [category, setCategory] = useState("");
  const [searchType, setSearchType] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(window.devicePixelRatio);

  const debouncedSearchKey = useDebounce(searchKey, 400);

  const isSharkRelated = (title) => {
    const lowerTitle = title.toLowerCase();
    const forbiddenKeywords = ["tiburón", "shark"];
    const forbiddenExactTitles = [
      "No Way Up", "Jaws", "Sharknado", "Deep Blue Sea",
      "The Meg", "Under Paris", "Shark"
    ];
    return forbiddenKeywords.some(keyword => lowerTitle.includes(keyword)) ||
      forbiddenExactTitles.includes(title);
  };

  const fetchMovies = async (searchKey, category, searchType, fromDate, toDate) => {
    const type = searchKey ? "search" : "discover";
    let params = {
      api_key: API_KEY,
      query: searchKey,
      with_genres: category || undefined,
    };

    if (searchType) params.sort_by = searchType;
    if (fromDate && toDate) {
      params["primary_release_date.gte"] = fromDate;
      params["primary_release_date.lte"] = toDate;
    }

    const { data: { results } } = await axios.get(`${API_URL}/${type}/movie`, { params });
    const filteredMovies = results.filter(movie => !isSharkRelated(movie.title));
    setMovies(filteredMovies);
    if (filteredMovies.length) {
      setMovie(filteredMovies[0]);
      await fetchMovie(filteredMovies[0].id);
    }
  };

  const fetchMovie = async (id) => {
    const { data } = await axios.get(`${API_URL}/movie/${id}`, {
      params: {
        api_key: API_KEY,
        append_to_response: "videos,credits",
      },
    });

    if (data.videos?.results) {
      const official = data.videos.results.find(vid => vid.name === "Official Trailer");
      setTrailer(official || data.videos.results[0]);
    }

    setMovie(data);
    setCast(data.credits?.cast || []);
    setDirectors(data.credits?.crew?.filter(person => person.job === "Director") || []);
  };

  const selectMovie = async (movie) => {
    await fetchMovie(movie.id);
    setMovie(movie);
    window.scrollTo(0, 0);
  };

  const searchMovies = (e) => {
    e.preventDefault();
    fetchMovies(searchKey, category, searchType);
  };

  const goToHomePage = () => window.location.href = "/";

  const handleCategoryChange = (value) => {
    setCategory(value);
    setSearchType("");
    fetchMovies(searchKey, value, "");
  };

  const fetchPopularMovies = () => {
    setSearchType("popularity.desc");
    fetchMovies(searchKey, category, "popularity.desc");
  };

  const fetchRecentMovies = () => {
    const now = new Date();
    const fromDate = new Date(now);
    const toDate = new Date(now);
    fromDate.setMonth(now.getMonth() - 1);
    toDate.setMonth(now.getMonth() + 1);
    setSearchType("release_date.desc");
    fetchMovies(
      searchKey,
      category,
      "release_date.desc",
      fromDate.toISOString().split("T")[0],
      toDate.toISOString().split("T")[0]
    );
  };

  const fetchTopRatedMovies = () => {
    setSearchType("vote_average.desc");
    fetchMovies(searchKey, category, "vote_average.desc");
  };

  const fetchTopRatedMoviesAll = async () => {
    setSearchType("top_rated");
    const { data: { results } } = await axios.get(`${API_URL}/movie/top_rated`, {
      params: { api_key: API_KEY }
    });
    const filtered = results.filter(movie => !isSharkRelated(movie.title));
    setMovies(filtered);
    setMovie(filtered[0]);
    if (filtered.length) await fetchMovie(filtered[0].id);
  };

  const toggleFavorite = (movie) => {
    setFavorites((prev) =>
      prev.find(fav => fav.id === movie.id)
        ? prev.filter(fav => fav.id !== movie.id)
        : [...prev, movie]
    );
  };

  const renderFavorites = () => (
    <div className="favorites-section">
      <h1>Favorites</h1>
      <div className="container_movies">
        <div className="row_movies">
          {favorites.map((movie) => (
            <div key={movie.id} className="col_movies" onClick={() => selectMovie(movie)}>
              <img
                src={IMAGE_PATH + movie.poster_path}
                alt={movie.title}
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/200x300?text=No+Image";
                }}
              />
              <h4>{movie.title}</h4>
              <p>Rating: {movie.vote_average}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const categories = {
    28: "Action", 35: "Comedy", 18: "Drama", 27: "Horror", 10749: "Romance",
    878: "Science Fiction", 10751: "Family", 16: "Animation", 80: "Crime",
    37: "Western", 36: "History", 14: "Fantasy", 53: "Thriller", 10752: "War",
    12: "Adventure", 99: "Documentary", 10402: "Music", 10770: "TV Movie", 9648: "Mystery",
  };

  useEffect(() => {
    fetchMovies("", "", "");
    const handleResize = () => setZoomLevel(window.devicePixelRatio);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize); // eslint-disable-next-line
  }, []); 

  useEffect(() => {
    if (debouncedSearchKey) {
      fetchMovies(debouncedSearchKey, category, searchType);
    } // eslint-disable-next-line
  }, [debouncedSearchKey]);

  return (
    <div className="App" style={{ zoom: zoomLevel }}>
      <header className="menu">
        <div className="logo-and-search">
          <button className="logo" onClick={goToHomePage}>
            <img src="http://imgfz.com/i/5hQ3ZSJ.png" alt="Logo" />
          </button>
          <button className="filter-button" onClick={fetchTopRatedMoviesAll}>All Time</button>
        </div>

        <form className="search-container" onSubmit={searchMovies}>
          <input
            type="text"
            placeholder="Search"
            className="search-input"
            onChange={(e) => setSearchKey(e.target.value)}
          />
          <button className="search-button">Search</button>
        </form>

        <div className="category-buttons">
          <select value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
            <option value="">All</option>
            {Object.entries(categories).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <button className="filter-button" onClick={fetchPopularMovies}>Popular</button>
          <button className="filter-button" onClick={fetchRecentMovies}>Recent</button>
          <button className="filter-button" onClick={fetchTopRatedMovies}>Top Rated</button>
        </div>
      </header>

      <MovieCarousel movies={movies} selectMovie={selectMovie} />

      <main>
        {movie && (
          <div
            className="viewtrailer-bg"
            style={{
              backgroundImage: `url(${BACKDROP_PATH}${movie.backdrop_path})`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundColor: "#000",
            }}
          >
            <div className="viewtrailer">
              <StarRating rating={movie.vote_average} />
              {trailer && (
                <div className="trailer-container">
                  <img
                    src={IMAGE_PATH + movie.poster_path}
                    alt={movie.title}
                    width="510"
                    height="815"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/200x300?text=No+Image";
                    }}
                  />
                  <iframe
                    width="560"
                    height="315"
                    src={`https://www.youtube.com/embed/${trailer.key}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              <button
                className={`favorite-button ${favorites.find(fav => fav.id === movie.id) ? "favorited" : ""}`}
                onClick={() => toggleFavorite(movie)}
              >
                {favorites.find(fav => fav.id === movie.id)
                  ? "Remove from Favorites"
                  : "Add to Favorites"}
              </button>

              <div className="cast-container">
                <h2>Directors</h2>
                <ul>{directors.map(d => <li key={d.id}>{d.name}</li>)}</ul>
                <h2>Cast</h2>
                <ul>{cast.filter(a => a.order <= 10).map(a => <li key={a.id}>{a.character} - {a.name}</li>)}</ul>
              </div>

              <div className="container">
                <div>
                  <h1 className="text-white">{movie.title}</h1>
                  <p className="text-white">{movie.overview}</p>
                </div>
                {playing && (
                  <button onClick={() => setPlaying(false)} className="boton">Close</button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="container_movies">
        <div className="row_movies">
          {movies.map((movie) => (
            <div key={movie.id} className="col_movies" onClick={() => selectMovie(movie)}>
              <img
                src={IMAGE_PATH + movie.poster_path}
                alt={movie.title}
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/200x300?text=No+Image";
                }}
              />
              <h4>{movie.title}</h4>
              <p>Rating: {movie.vote_average}</p>
            </div>
          ))}
        </div>
        {renderFavorites()}
      </div>

      <Footer />
    </div>
  );
}

export default App;
