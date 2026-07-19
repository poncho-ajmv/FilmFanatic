import React from "react";
import MovieCarousel from "./MovieCarousel";

// Componente auxiliar opcional. La app principal vive en App.js;
// se deja como envoltorio válido y reutilizable del carrusel.
function Main({ movies = [], selectMovie = () => {} }) {
  return (
    <main>
      <MovieCarousel movies={movies} selectMovie={selectMovie} />
    </main>
  );
}

export default Main;
