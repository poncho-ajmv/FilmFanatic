// api.js — Todas las llamadas a TMDb centralizadas (películas y series)
import axios from "axios";
import { filterSharks } from "./sharkFilter";

const API_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.REACT_APP_API_KEY;
let LANG = "es-MX";

export const setLanguage = (lang) => {
  LANG = lang === "en" ? "en-US" : "es-MX";
};
export const getLanguage = () => LANG;

// --- Rutas de imágenes ---
export const IMG = {
  poster: "https://image.tmdb.org/t/p/w500",
  backdrop: "https://image.tmdb.org/t/p/original",
  profile: "https://image.tmdb.org/t/p/w185",
  provider: "https://image.tmdb.org/t/p/w92",
};

export const NO_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='750'>
      <rect width='100%' height='100%' fill='#1c212b'/>
      <text x='50%' y='50%' fill='#97a1b0' font-family='sans-serif' font-size='26'
        text-anchor='middle' dominant-baseline='middle'>Sin imagen</text></svg>`
  );

export const NO_PROFILE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='185' height='185'>
      <rect width='100%' height='100%' fill='#1c212b'/>
      <circle cx='92' cy='72' r='34' fill='#2b3340'/>
      <rect x='42' y='120' width='100' height='70' rx='35' fill='#2b3340'/></svg>`
  );

export const posterUrl = (p) => (p ? `${IMG.poster}${p}` : NO_IMAGE);
export const profileUrl = (p) => (p ? `${IMG.profile}${p}` : NO_PROFILE);

// En producción la clave la maneja el proxy serverless, así que siempre "hay clave".
export const hasApiKey = () => IS_PROD || Boolean(API_KEY);

// --- Normalización (película o serie comparten forma) ---
export const titleOf = (item = {}) => item.title || item.name || "";
export const dateOf = (item = {}) => item.release_date || item.first_air_date || "";
export const yearOf = (item = {}) => {
  const d = dateOf(item);
  return d ? d.slice(0, 4) : null;
};
export const mediaOf = (item = {}) =>
  item.media_type === "tv" || item.first_air_date || item.name ? "tv" : "movie";

export const formatRuntime = (min) => {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}min` : `${m}min`;
};

// Clasificación por edad (película: release_dates; serie: content_ratings)
export const getCertification = (data, media) => {
  if (media === "tv") {
    const results = data.content_ratings?.results || [];
    for (const code of ["GT", "MX", "US"]) {
      const r = results.find((x) => x.iso_3166_1 === code);
      if (r?.rating) return r.rating;
    }
    return results.find((r) => r.rating)?.rating || "";
  }
  const results = data.release_dates?.results || [];
  const pick = (entry) =>
    (entry?.release_dates || []).map((d) => d.certification).find((c) => c);
  for (const code of ["GT", "MX", "US"]) {
    const cert = pick(results.find((r) => r.iso_3166_1 === code));
    if (cert) return cert;
  }
  for (const r of results) {
    const cert = pick(r);
    if (cert) return cert;
  }
  return "";
};

// En producción usamos el proxy serverless (/api/tmdb) para que la API key
// no quede expuesta en el navegador. En desarrollo llamamos a TMDb directo
// con la clave del .env (REACT_APP_API_KEY).
const IS_PROD = process.env.NODE_ENV === "production";

const get = async (path, params = {}) => {
  if (IS_PROD) {
    const { data } = await axios.get(`/api/tmdb`, {
      params: { path, language: LANG, ...params },
    });
    return data;
  }
  const { data } = await axios.get(`${API_URL}${path}`, {
    params: { api_key: API_KEY, language: LANG, ...params },
  });
  return data;
};

// --- Explorar (con filtros y paginación) ---
export const browse = async ({
  media = "movie",
  searchKey = "",
  category = "",
  sort = "",
  fromDate,
  toDate,
  voteCountGte,
  page = 1,
}) => {
  let path;
  const params = { page };

  if (searchKey) {
    path = `/search/${media}`;
    params.query = searchKey;
  } else if (sort === "top_rated") {
    path = `/${media}/top_rated`;
  } else {
    path = `/discover/${media}`;
    if (category) params.with_genres = category;
    if (sort) params.sort_by = sort;
    if (fromDate && toDate) {
      const field = media === "movie" ? "primary_release_date" : "first_air_date";
      params[`${field}.gte`] = fromDate;
      params[`${field}.lte`] = toDate;
    }
    // Mínimo de votos: evita estrenos "de la nada" sin público (solo populares/conocidas)
    if (voteCountGte) params["vote_count.gte"] = voteCountGte;
  }

  const data = await get(path, params);
  return {
    results: filterSharks(data.results || []),
    page: data.page || page,
    totalPages: Math.min(data.total_pages || 1, 500),
  };
};

// --- Detalle completo ---
export const getDetail = async (media, id) => {
  const append =
    media === "tv"
      ? "videos,credits,content_ratings,recommendations,external_ids,reviews"
      : "videos,credits,release_dates,recommendations,external_ids,reviews";
  return get(`/${media}/${id}`, { append_to_response: append });
};

// --- Proveedores (dónde ver), región Guatemala ---
export const getProviders = async (media, id) => {
  try {
    const data = await get(`/${media}/${id}/watch/providers`, {});
    const region = data.results?.GT || data.results?.MX || data.results?.US || null;
    return region ? { list: region.flatrate || [], link: region.link } : null;
  } catch {
    return null;
  }
};

// --- Tendencias de la semana ---
export const getTrending = async (media = "movie") => {
  const data = await get(`/trending/${media}/week`);
  return filterSharks(data.results || []);
};

// --- En cines / en emisión (actualmente) ---
export const getNowPlaying = async (media = "movie") => {
  const path = media === "tv" ? "/tv/on_the_air" : "/movie/now_playing";
  const data = await get(path, {});
  return filterSharks(data.results || []);
};

// --- Persona (actor) + filmografía ---
export const getPerson = async (id) => {
  const data = await get(`/person/${id}`, {
    append_to_response: "combined_credits,external_ids",
  });
  const credits = filterSharks(data.combined_credits?.cast || []);
  // ordena por fecha desc y quita duplicados por id
  const seen = new Set();
  const filmography = credits
    .filter((c) => c.poster_path)
    .filter((c) => (seen.has(c.id) ? false : seen.add(c.id)))
    .sort((a, b) => (dateOf(b) || "").localeCompare(dateOf(a) || ""));
  return { ...data, filmography };
};

// Arma la URL del título. Toma el DOMINIO que puso el usuario (ej. https://www.imdb.com/
// o https://playimdb.online/) y le agrega automáticamente la ruta /es/title/{imdb_id}/.
export const buildTitleUrl = (base, imdbId) => {
  if (!imdbId) return "";
  const root = (base || "").trim().replace(/\/+$/, ""); // quita barras finales
  return `${root}/es/title/${imdbId}/`;
};

// --- Clasificación por edad (para censurar) ---
const ADULT_MOVIE = new Set(["R", "NC-17", "NC17", "X", "18", "18+"]);
const ADULT_TV = new Set(["TV-MA"]);

export const isAdultRating = (rating, media) => {
  const r = (rating || "").toUpperCase().trim();
  if (!r) return false;
  return media === "tv" ? ADULT_TV.has(r) : ADULT_MOVIE.has(r);
};

// Devuelve true si la película/serie es de clasificación adulta (US: R/NC-17/TV-MA).
export const getRating = async (media, id) => {
  try {
    if (media === "tv") {
      const data = await get(`/tv/${id}/content_ratings`, {});
      const r =
        (data.results || []).find((x) => x.iso_3166_1 === "US")?.rating || "";
      return isAdultRating(r, "tv");
    }
    const data = await get(`/movie/${id}/release_dates`, {});
    const us = (data.results || []).find((x) => x.iso_3166_1 === "US");
    const cert =
      (us?.release_dates || []).map((d) => d.certification).find((c) => c) || "";
    return isAdultRating(cert, "movie");
  } catch {
    return false;
  }
};

// Extrae el mejor tráiler de un detalle
export const pickTrailer = (data) => {
  const vids = data.videos?.results || [];
  return (
    vids.find((v) => /official trailer/i.test(v.name || "")) ||
    vids.find((v) => v.type === "Trailer") ||
    vids[0] ||
    null
  );
};
