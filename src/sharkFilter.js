// sharkFilter.js
// Filtro centralizado para excluir cualquier película relacionada con tiburones.
// Se normaliza el texto (minúsculas + sin acentos) y se revisa tanto el título
// traducido como el título original para evitar que se cuele algo.

export const normalize = (str = "") =>
  str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/\s+/g, " ")
    .trim();

// Palabras clave prohibidas (ya normalizadas, sin acentos).
// Se mantienen conservadoras para no bloquear títulos inocentes por accidente.
const FORBIDDEN_KEYWORDS = [
  "shark",
  "tiburon",
  "jaws",
  "sharknado",
  "megalodon",
  "sharktopus",
  "requin", // francés
  "tubarao", // portugués
];

// Títulos exactos prohibidos (se comparan normalizados).
const FORBIDDEN_TITLES = [
  "no way up",
  "jaws",
  "jaws 2",
  "jaws 3-d",
  "jaws 3",
  "jaws: the revenge",
  "deep blue sea",
  "deep blue sea 2",
  "deep blue sea 3",
  "the meg",
  "meg 2: the trench",
  "meg 2 the trench",
  "sharknado",
  "the shallows",
  "47 meters down",
  "47 meters down: uncaged",
  "open water",
  "the reef",
  "the reef: stalked",
  "bait",
  "sharktopus",
  "under paris",
  "sous la seine",
  "deep water", // solicitado explícitamente
  "great white",
  "shark night",
  "dark tide",
  "ghost shark",
  "sand sharks",
  "2-headed shark attack",
  "3-headed shark attack",
  "5-headed shark attack",
  "6-headed shark attack",
  "toxic shark",
  "something in the water",
  "maneater",
  "the black demon",
  "bull shark",
  "shark bait",
  "shark lake",
  "shark side of the moon",
  "house shark",
  "planet of the sharks",
  "avalanche sharks",
  "ice sharks",
  "trailer park shark",
  "raiders of the lost shark",
  "santa jaws",
  "noah's shark",
  "shark exorcist",
  "nightmare shark",
  "jurassic shark",
  "atomic shark",
  "mega shark versus giant octopus",
  "the last sharknado",
];

// Acepta un objeto película (de TMDb) y devuelve true si parece relacionada con tiburones.
export const isSharkRelated = (movie = {}) => {
  const titles = [movie.title, movie.original_title, movie.name]
    .filter(Boolean)
    .map(normalize);

  if (titles.length === 0) return false;

  const keywordHit = titles.some((t) =>
    FORBIDDEN_KEYWORDS.some((kw) => t.includes(kw))
  );
  if (keywordHit) return true;

  return titles.some((t) => FORBIDDEN_TITLES.includes(t));
};

// Filtra una lista de películas quitando las relacionadas con tiburones.
export const filterSharks = (movies = []) =>
  Array.isArray(movies) ? movies.filter((m) => !isSharkRelated(m)) : [];

export default isSharkRelated;
