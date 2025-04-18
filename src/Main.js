import React from "react";
import MovieList from "./MovieList";
import MovieCarousel from "./MovieCarousel";


function Main({ movies }) {
    return (
        <main>
            <>
                <MovieCarousel />
                <MovieList movies={movies} />
            </>
        </main>
    );
}

export default Main;
