import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import "./Modal.css";
import "./MovieList.css";
import "./MovieDetail.css";
import "./Logocss.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import MovieCarousel from "./MovieCarousel";
import Footer from "./Footer";
import StarRating from "./StarRating";
import useDebounce from "./useDebounce";
import DetailModal from "./DetailModal";
import PersonModal from "./PersonModal";
import ShareMenu from "./ShareMenu";
import SettingsMenu, { DEFAULT_BASE, DEFAULT_LABEL } from "./SettingsMenu";
import { filterSharks } from "./sharkFilter";
import { t, setUiLang } from "./i18n";
import {
  browse,
  getTrending,
  getNowPlaying,
  getDetail,
  getProviders,
  pickTrailer,
  getCertification,
  getRating,
  setLanguage as apiSetLanguage,
  hasApiKey,
  posterUrl,
  titleOf,
  yearOf,
  formatRuntime,
  buildTitleUrl,
  IMG,
  NO_IMAGE,
} from "./api";
import {
  SearchIcon,
  ClearIcon,
  FilterIcon,
  BookmarkIcon,
  StarGlyph,
  ExternalIcon,
  EyeIcon,
} from "./Icons";

const movieCategories = {
  28: "Acción",
  35: "Comedia",
  18: "Drama",
  27: "Terror",
  10749: "Romance",
  878: "Ciencia ficción",
  10751: "Familia",
  16: "Animación",
  80: "Crimen",
  37: "Western",
  36: "Historia",
  14: "Fantasía",
  53: "Thriller",
  10752: "Bélica",
  12: "Aventura",
  99: "Documental",
  10402: "Música",
  10770: "Película de TV",
  9648: "Misterio",
};

const tvCategories = {
  10759: "Acción y aventura",
  16: "Animación",
  35: "Comedia",
  80: "Crimen",
  99: "Documental",
  18: "Drama",
  10751: "Familia",
  10762: "Infantil",
  9648: "Misterio",
  10765: "Ciencia ficción y fantasía",
  10768: "Bélica y política",
  37: "Western",
  10764: "Reality",
  10767: "Talk show",
};

const movieCategoriesEN = {
  28: "Action",
  35: "Comedy",
  18: "Drama",
  27: "Horror",
  10749: "Romance",
  878: "Science Fiction",
  10751: "Family",
  16: "Animation",
  80: "Crime",
  37: "Western",
  36: "History",
  14: "Fantasy",
  53: "Thriller",
  10752: "War",
  12: "Adventure",
  99: "Documentary",
  10402: "Music",
  10770: "TV Movie",
  9648: "Mystery",
};

const tvCategoriesEN = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10765: "Sci-Fi & Fantasy",
  10768: "War & Politics",
  37: "Western",
  10764: "Reality",
  10767: "Talk",
};

const inferMedia = (m = {}) =>
  m.media_type === "tv" || m.media_type === "movie"
    ? m.media_type
    : m.first_air_date || m.name
    ? "tv"
    : "movie";
const favKey = (m) => `${inferMedia(m)}-${m.id}`;
const slim = (m) => ({
  id: m.id,
  title: m.title,
  name: m.name,
  poster_path: m.poster_path,
  vote_average: m.vote_average,
  media_type: inferMedia(m),
});

function App() {
  const [media, setMedia] = useState("movie");
  const [movies, setMovies] = useState([]);
  const [trending, setTrending] = useState([]);
  const [featured, setFeatured] = useState([]); // "En cines" (actualmente en cartelera)
  // Recomendaciones del último título abierto en modo ventana (modal).
  const [modalRecs, setModalRecs] = useState([]);
  const [modalRecsMedia, setModalRecsMedia] = useState("movie");

  const [detail, setDetail] = useState(null); // detalle inline (1 clic)
  const [providers, setProviders] = useState(null);

  // Los modales (ficha ampliada y actor) se manejan por la URL, para poder
  // compartir enlaces (/movie/123, /tv/45, /person/9) y que el botón atrás los cierre.
  const navigate = useNavigate();
  const location = useLocation();
  const routeMatch = location.pathname.match(/^\/(movie|tv|person)\/(\d+)/);
  const detailItem =
    routeMatch && (routeMatch[1] === "movie" || routeMatch[1] === "tv")
      ? { media: routeMatch[1], id: Number(routeMatch[2]) }
      : null;
  const personId =
    routeMatch && routeMatch[1] === "person" ? Number(routeMatch[2]) : null;

  const openItem = (it) => navigate(`/${it.media}/${it.id}`);
  const openPerson = (id) => navigate(`/person/${id}`);
  const closeModal = () =>
    location.key && location.key !== "default" ? navigate(-1) : navigate("/");

  const [searchKey, setSearchKey] = useState("");
  const [category, setCategory] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentQuery, setCurrentQuery] = useState({ media: "movie" });

  const [dark, setDark] = useState(true);
  // El enlace del botón SIEMPRE arranca en IMDb al recargar (no se persiste).
  const [settings, setSettings] = useState({
    externalBase: DEFAULT_BASE,
    externalLabel: DEFAULT_LABEL,
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ff-favorites")) || [];
    } catch {
      return [];
    }
  });

  const debouncedSearchKey = useDebounce(searchKey, 400);
  const clickTimer = useRef(null);
  const heroRef = useRef(null);

  // Modo de interacción al hacer clic en un póster: "inline" (detalle arriba) o "modal" (ventana Ver más)
  const [clickMode, setClickMode] = useState(() => {
    try {
      return localStorage.getItem("ff-clickmode") || "modal";
    } catch {
      return "modal";
    }
  });

  // Idioma (aplica al contenido de TMDb y a la interfaz)
  const [language, setLanguageState] = useState(() => {
    let l = "es";
    try {
      l = localStorage.getItem("ff-lang") || "es";
    } catch {
      /* ignorar */
    }
    apiSetLanguage(l);
    setUiLang(l);
    return l;
  });

  // Censura de contenido adulto: "libre" | "censurar" | "ocultar"
  const [contentMode, setContentMode] = useState(() => {
    try {
      return localStorage.getItem("ff-content") || "censurar";
    } catch {
      return "censurar";
    }
  });
  const ratingsRef = useRef({});
  const ratingsFetching = useRef(new Set());
  const [, setRatingsVersion] = useState(0);
  const [revealed, setRevealed] = useState(() => new Set());

  // --- Persistencia ---
  useEffect(() => {
    try {
      localStorage.setItem("ff-favorites", JSON.stringify(favorites));
    } catch {
      /* ignorar */
    }
  }, [favorites]);

  // --- Tema ---
  useEffect(() => {
    let useDark = true;
    try {
      const saved = localStorage.getItem("ff-theme");
      if (saved) useDark = saved === "dark";
    } catch {
      /* ignorar */
    }
    document.documentElement.classList.toggle("dark", useDark);
    setDark(useDark);
  }, []);

  const applyTheme = (mode) => {
    const run = () => {
      const next = mode === "dark";
      document.documentElement.classList.toggle("dark", next);
      setDark(next);
      try {
        localStorage.setItem("ff-theme", mode);
      } catch {
        /* ignorar */
      }
    };
    if (typeof document.startViewTransition === "function") {
      document.startViewTransition(run);
    } else {
      run();
    }
  };

  // --- Detalle inline (1 clic) ---
  const selectItem = async ({ media: m, id }, scroll = false) => {
    if (scroll) {
      heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setProviders(null);
    try {
      const data = await getDetail(m, id);
      setDetail({ ...data, __media: m });
      setProviders(await getProviders(m, id));
    } catch (err) {
      console.error("Error al cargar detalle:", err);
    }
  };

  // --- Consultas ---
  const runQuery = async (q = {}, pageNum = 1, append = false) => {
    if (!hasApiKey()) return;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(false);
    try {
      const data = await browse({ ...q, page: pageNum });
      setTotalPages(data.totalPages);
      setPage(data.page);
      setMovies((prev) => {
        if (!append) return data.results;
        const seen = new Set(prev.map(favKey));
        return [...prev, ...data.results.filter((x) => !seen.has(favKey(x)))];
      });
      if (!append) {
        if (data.results.length && clickMode === "inline") {
          selectItem({ media: q.media, id: data.results[0].id });
        } else {
          setDetail(null);
        }
      }
    } catch (err) {
      console.error("Error al cargar:", err);
      setError(true);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  };

  const applyQuery = (q) => {
    setCurrentQuery(q);
    runQuery(q, 1, false);
  };

  const loadMore = () => {
    if (page < totalPages) {
      runQuery(currentQuery, page + 1, true);
      return;
    }
    // Feed de inicio: al agotarse los estrenos recientes, sigue "infinito"
    // rellenando con populares (solo al pulsar "Cargar más").
    if (currentQuery.__home && !currentQuery.__fill) {
      const fill = {
        media,
        sort: "popularity.desc",
        voteCountGte: currentQuery.voteCountGte,
        __home: true,
        __fill: true,
      };
      setCurrentQuery(fill);
      runQuery(fill, 1, true);
    }
  };

  const fetchTrendingFor = async (m) => {
    try {
      setTrending(await getTrending(m));
    } catch (err) {
      console.error(err);
    }
  };

  // "En cines": lo que está actualmente en cartelera (now_playing / on_the_air)
  const fetchFeaturedFor = async (m) => {
    try {
      setFeatured(await getNowPlaying(m));
    } catch (err) {
      console.error(err);
    }
  };

  // Consulta por defecto del inicio: estrenos recientes Y populares (conocidos),
  // ordenados por popularidad y con un mínimo de votos para descartar lo desconocido.
  const recentQuery = (m) => {
    const now = new Date();
    const from = new Date(now);
    from.setMonth(now.getMonth() - 4);
    return {
      media: m,
      sort: "popularity.desc",
      fromDate: from.toISOString().split("T")[0],
      toDate: now.toISOString().split("T")[0],
      voteCountGte: m === "movie" ? 80 : 20,
      __home: true,
    };
  };

  // --- Carga inicial ---
  useEffect(() => {
    applyQuery(recentQuery("movie"));
    fetchTrendingFor("movie");
    fetchFeaturedFor("movie");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debouncedSearchKey) {
      setActiveFilter("");
      applyQuery({ media, searchKey: debouncedSearchKey, category });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchKey]);

  // Trae la clasificación (en segundo plano) de las películas visibles, para censurar.
  useEffect(() => {
    if (contentMode === "libre") return;
    [...movies, ...trending, ...featured].forEach((m) => {
      const key = favKey(m);
      if (
        ratingsRef.current[key] !== undefined ||
        ratingsFetching.current.has(key)
      )
        return;
      ratingsFetching.current.add(key);
      getRating(inferMedia(m), m.id).then((adult) => {
        ratingsRef.current[key] = adult;
        ratingsFetching.current.delete(key);
        setRatingsVersion((v) => v + 1);
      });
    });
  }, [movies, trending, featured, contentMode]);

  // Al abrir un título en modo ventana, trae sus recomendaciones para
  // mostrarlas abajo ("Recomendadas"), basadas en lo que se dio clic.
  useEffect(() => {
    if (!detailItem) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getDetail(detailItem.media, detailItem.id);
        if (cancelled) return;
        const list = filterSharks(data.recommendations?.results || []).filter(
          (r) => r.poster_path
        );
        setModalRecs(list);
        setModalRecsMedia(detailItem.media);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailItem?.media, detailItem?.id]);

  // --- Handlers ---
  const handleMediaChange = (m) => {
    if (m === media) return;
    setMedia(m);
    setSearchKey("");
    setCategory("");
    setActiveFilter("");
    setModalRecs([]);
    applyQuery(recentQuery(m));
    fetchTrendingFor(m);
    fetchFeaturedFor(m);
  };

  const searchMovies = (e) => {
    e.preventDefault();
    setActiveFilter("");
    applyQuery({ media, searchKey, category });
  };

  const goToHomePage = () => {
    setSearchKey("");
    setCategory("");
    setActiveFilter("");
    setFiltersOpen(false);
    setModalRecs([]);
    applyQuery(recentQuery(media));
    fetchFeaturedFor(media);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    setActiveFilter("");
    applyQuery({ media, searchKey, category: value });
  };

  const fetchPopular = () => {
    setActiveFilter("popular");
    applyQuery({ media, searchKey, category, sort: "popularity.desc" });
  };
  const fetchRecent = () => {
    const now = new Date();
    const from = new Date(now);
    const to = new Date(now);
    from.setMonth(now.getMonth() - 1);
    to.setMonth(now.getMonth() + 1);
    setActiveFilter("recent");
    applyQuery({
      media,
      searchKey,
      category,
      sort: media === "movie" ? "release_date.desc" : "first_air_date.desc",
      fromDate: from.toISOString().split("T")[0],
      toDate: to.toISOString().split("T")[0],
    });
  };
  const fetchTop = () => {
    setActiveFilter("top");
    applyQuery({ media, searchKey, category, sort: "vote_average.desc" });
  };
  const fetchAllTime = () => {
    setActiveFilter("alltime");
    setSearchKey("");
    setCategory("");
    applyQuery({ media, sort: "top_rated" });
  };

  // --- Interacción al hacer clic ---
  const onCardClick = (m) => {
    if (clickMode === "modal") {
      // Modo ventana: 1 clic abre directamente el "Ver más"
      openItem({ media: inferMedia(m), id: m.id });
      return;
    }
    // Modo integrado: 1 clic = detalle arriba ; doble clic = ventana
    if (clickTimer.current) return;
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      selectItem({ media: inferMedia(m), id: m.id }, true);
    }, 220);
  };
  const onCardDouble = (m) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    openItem({ media: inferMedia(m), id: m.id });
  };

  // Cambia el modo de interacción (persistido)
  const changeClickMode = (mode) => {
    setClickMode(mode);
    try {
      localStorage.setItem("ff-clickmode", mode);
    } catch {
      /* ignorar */
    }
    if (mode === "modal") {
      setDetail(null);
    } else if (movies.length) {
      selectItem({ media: inferMedia(movies[0]), id: movies[0].id });
    }
  };

  // --- Idioma ---
  const changeLanguage = (l) => {
    apiSetLanguage(l);
    setUiLang(l);
    setLanguageState(l);
    try {
      localStorage.setItem("ff-lang", l);
    } catch {
      /* ignorar */
    }
    applyQuery(currentQuery);
    fetchTrendingFor(media);
    if (detail) selectItem({ media: detail.__media, id: detail.id });
  };

  // --- Censura de contenido ---
  const changeContentMode = (mode) => {
    setContentMode(mode);
    try {
      localStorage.setItem("ff-content", mode);
    } catch {
      /* ignorar */
    }
  };

  const censorStatus = (m) => {
    if (contentMode === "libre") return "show";
    const key = favKey(m);
    if (revealed.has(key)) return "show";
    const adult = ratingsRef.current[key];
    if (adult === undefined) return "pending";
    if (adult) return contentMode === "ocultar" ? "hidden" : "censor";
    return "show";
  };
  const reveal = (m) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(favKey(m));
      return next;
    });

  const isFavorite = (m) => favorites.some((f) => favKey(f) === favKey(m));
  const toggleFavorite = (m) =>
    setFavorites((prev) => {
      const k = favKey(m);
      return prev.some((f) => favKey(f) === k)
        ? prev.filter((f) => favKey(f) !== k)
        : [...prev, slim(m)];
    });

  const categories =
    language === "en"
      ? media === "movie"
        ? movieCategoriesEN
        : tvCategoriesEN
      : media === "movie"
      ? movieCategories
      : tvCategories;
  const showTrending = !activeFilter && !searchKey && !category;

  if (!hasApiKey()) {
    return (
      <div className="App">
        <div className="api-warning">
          <h2>Falta la clave de API</h2>
          <p>
            Crea un archivo <code>.env</code> en la raíz del proyecto con la línea:
          </p>
          <pre>REACT_APP_API_KEY=tu_clave_de_tmdb</pre>
          <p>Luego reinicia el servidor con <code>npm start</code>.</p>
        </div>
      </div>
    );
  }

  const renderCard = (m) => {
    const status = censorStatus(m);
    if (status === "hidden") return null;
    const censored = status === "pending" || status === "censor";
    return (
      <button
        type="button"
        key={`${inferMedia(m)}-${m.id}`}
        className="movie-card"
        onClick={() => {
          if (censored) {
            reveal(m);
            return;
          }
          onCardClick(m);
        }}
        onDoubleClick={() => {
          if (!censored) onCardDouble(m);
        }}
      >
        <div className="movie-card__poster">
          <img
            className={censored ? "censored" : ""}
            src={posterUrl(m.poster_path)}
            alt={censored ? "" : titleOf(m)}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = NO_IMAGE;
            }}
          />
          {status === "censor" && (
            <span className="censor-overlay">
              <EyeIcon />
              <span className="censor-overlay__text">{t("sensitive")}</span>
              <span className="censor-overlay__hint">{t("clickToView")}</span>
            </span>
          )}
          {isFavorite(m) && !censored && (
            <span className="movie-card__fav" aria-label="En favoritos">
              <BookmarkIcon filled />
            </span>
          )}
          {!censored && (
            <span className="movie-card__badge">
              <StarGlyph />
              {m.vote_average ? m.vote_average.toFixed(1) : "—"}
            </span>
          )}
        </div>
        <h4 className="movie-card__title">{titleOf(m)}</h4>
        <StarRating rating={m.vote_average} size={16} />
      </button>
    );
  };

  const renderSkeletons = (n) =>
    Array.from({ length: n }).map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton skeleton-card__poster" />
        <div className="skeleton skeleton-card__line" />
        <div className="skeleton skeleton-card__line short" />
      </div>
    ));

  // --- Datos derivados del detalle inline ---
  const d = detail;
  const dMedia = d?.__media || "movie";
  const dTitle = d ? titleOf(d) : "";
  const dYear = d ? yearOf(d) : null;
  const dRuntime = d
    ? dMedia === "tv"
      ? d.number_of_seasons
        ? `${d.number_of_seasons} temp.`
        : formatRuntime(d.episode_run_time?.[0])
      : formatRuntime(d.runtime)
    : null;
  const dCert = d ? getCertification(d, dMedia) : "";
  const dTrailer = d ? pickTrailer(d) : null;
  const dCreators =
    dMedia === "tv"
      ? d?.created_by || []
      : (d?.credits?.crew || []).filter((p) => p.job === "Director");
  const dRecs = filterSharks(d?.recommendations?.results || []).filter(
    (r) => r.poster_path
  );
  const dImdb = d?.imdb_id || d?.external_ids?.imdb_id || "";
  const dExternal = buildTitleUrl(settings.externalBase, dImdb);

  // Recomendadas: en modo integrado vienen del detalle inline; en modo ventana,
  // del último título abierto (modalRecs).
  const recsList = dRecs.length ? dRecs : modalRecs;
  const recsMedia = dRecs.length ? dMedia : modalRecsMedia;

  return (
    <div className="App">
      <header className="menu">
        <div className="menu__inner">
          <button
            type="button"
            className="menu__logo"
            onClick={goToHomePage}
            aria-label="Inicio — FilmFanatic"
          >
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="FilmFanatic"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.insertAdjacentHTML(
                  "afterend",
                  '<span class="menu__wordmark">FilmFanatic</span>'
                );
                e.target.onerror = null;
              }}
            />
          </button>

          <form className="search-container" onSubmit={searchMovies}>
            <span className="search-container__icon">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder={media === "movie" ? t("searchMovie") : t("searchTv")}
              className="search-input"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
            />
            {searchKey && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchKey("")}
                aria-label="Limpiar búsqueda"
              >
                <ClearIcon />
              </button>
            )}
          </form>

          <div className={`menu__actions ${filtersOpen ? "menu__actions--open" : ""}`}>
            <div className="media-switch" role="group" aria-label="Tipo">
              <button
                className={media === "movie" ? "active" : ""}
                onClick={() => handleMediaChange("movie")}
              >
                {t("movies")}
              </button>
              <button
                className={media === "tv" ? "active" : ""}
                onClick={() => handleMediaChange("tv")}
              >
                {t("series")}
              </button>
            </div>

            <select
              className="category-select"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">{t("allGenres")}</option>
              {Object.entries(categories).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="menu__right">
            <button
              type="button"
              className="filters-toggle"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
            >
              <FilterIcon />
              {t("filters")}
            </button>

            <SettingsMenu
              dark={dark}
              applyTheme={applyTheme}
              settings={settings}
              setSettings={setSettings}
              activeFilter={activeFilter}
              sortHandlers={{
                popular: fetchPopular,
                recent: fetchRecent,
                top: fetchTop,
                alltime: fetchAllTime,
              }}
              clickMode={clickMode}
              setClickMode={changeClickMode}
              contentMode={contentMode}
              setContentMode={changeContentMode}
              language={language}
              setLanguage={changeLanguage}
            />
          </div>
        </div>
      </header>

      {showTrending && featured.length > 0 && (
        <MovieCarousel
          movies={featured}
          onClickItem={onCardClick}
          onDoubleClickItem={onCardDouble}
          censorStatus={censorStatus}
          onReveal={reveal}
        />
      )}

      {d && (
        <section
          className="hero"
          ref={heroRef}
          style={{
            backgroundImage: d.backdrop_path
              ? `url(${IMG.backdrop}${d.backdrop_path})`
              : "none",
          }}
        >
          <div className="hero__overlay" />
          <div className="hero__inner">
            <div className="hero__top">
              <img
                className="hero__poster"
                src={posterUrl(d.poster_path)}
                alt={dTitle}
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = NO_IMAGE;
                }}
              />

              <div className="hero__info">
                <h1 className="hero__title">{dTitle}</h1>

                <div className="hero__rating">
                  <StarRating rating={d.vote_average} size={26} />
                  <span className="hero__score">
                    {d.vote_average ? d.vote_average.toFixed(1) : "—"} / 10
                  </span>
                  {d.vote_count ? (
                    <span className="hero__votes">
                      ({d.vote_count.toLocaleString()} {t("votes")})
                    </span>
                  ) : null}
                </div>

                <div className="hero__meta">
                  {dYear && <span className="hero__meta-item">{dYear}</span>}
                  {dRuntime && <span className="hero__meta-item">{dRuntime}</span>}
                  {dCert && <span className="hero__cert">{dCert}</span>}
                  {d.original_language && (
                    <span className="hero__meta-item">
                      {d.original_language.toUpperCase()}
                    </span>
                  )}
                  <span className="hero__meta-item">
                    {dMedia === "tv" ? t("serie") : t("movie")}
                  </span>
                </div>

                {d.genres?.length > 0 && (
                  <div className="hero__genres">
                    {d.genres.map((g) => (
                      <span key={g.id} className="genre-chip">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}

                {d.overview && <p className="hero__overview">{d.overview}</p>}

                <div className="hero__actions">
                  <button
                    className={`favorite-button ${isFavorite(d) ? "favorited" : ""}`}
                    onClick={() => toggleFavorite({ ...d, media_type: dMedia })}
                  >
                    <BookmarkIcon filled={isFavorite(d)} />
                    {isFavorite(d) ? t("removeFav") : t("addFav")}
                  </button>

                  {dExternal && (
                    <a
                      className="imdb-button"
                      href={dExternal}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="imdb-button__tag">{settings.externalLabel}</span>
                      <ExternalIcon />
                    </a>
                  )}

                  <button
                    type="button"
                    className="imdb-button"
                    onClick={() => openItem({ media: dMedia, id: d.id })}
                    title={t("seeMoreTitle")}
                  >
                    {t("seeMore")}
                  </button>

                  <ShareMenu
                    url={`${window.location.origin}/${dMedia}/${d.id}`}
                    title={dTitle}
                  />
                </div>

                {providers && providers.list.length > 0 && (
                  <div className="hero__providers">
                    <span className="hero__providers-label">{t("availableOn")}</span>
                    <div className="hero__providers-logos">
                      {providers.list.slice(0, 6).map((p) => (
                        <img
                          key={p.provider_id}
                          className="provider-logo"
                          src={`${IMG.provider}${p.logo_path}`}
                          alt={p.provider_name}
                          title={p.provider_name}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {dCreators.length > 0 && (
                  <p className="hero__director">
                    <strong>{dMedia === "tv" ? t("creation") : t("direction")}</strong>{" "}
                    {dCreators.map((c) => c.name).join(", ")}
                  </p>
                )}
              </div>
            </div>

            {dTrailer && (
              <div className="hero__trailer">
                <h3 className="hero__trailer-title">{t("trailer")}</h3>
                <div className="hero__trailer-frame">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${dTrailer.key}`}
                    title={`Tráiler de ${dTitle}`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <main>
        {loading && movies.length === 0 && (
          <section className="section">
            <div className="movie-grid">{renderSkeletons(12)}</div>
          </section>
        )}

        {!loading && movies.length === 0 && (
          <div className="state-msg">{t("noResults")}</div>
        )}

        {movies.length > 0 && (
          <section className="section">
            <h2 className="section__title">{t("results")}</h2>
            <div className="movie-grid">{movies.map(renderCard)}</div>
            {(page < totalPages ||
              (currentQuery.__home && !currentQuery.__fill && movies.length > 0)) && (
              <div className="load-more-wrap">
                <button
                  type="button"
                  className="load-more"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? t("loading") : t("loadMore")}
                </button>
              </div>
            )}
          </section>
        )}

        {recsList.length > 0 && (
          <section className="section">
            <h2 className="section__title">{t("recommended")}</h2>
            <MovieCarousel
              movies={recsList.map((r) => ({ ...r, media_type: recsMedia }))}
              onClickItem={onCardClick}
              onDoubleClickItem={onCardDouble}
              censorStatus={censorStatus}
              onReveal={reveal}
            />
          </section>
        )}

        {showTrending && trending.length > 0 && (
          <section className="section">
            <h2 className="section__title">{t("trending")}</h2>
            <MovieCarousel
              movies={trending}
              onClickItem={onCardClick}
              onDoubleClickItem={onCardDouble}
              censorStatus={censorStatus}
              onReveal={reveal}
            />
          </section>
        )}

        {favorites.length > 0 && (
          <section className="section">
            <h2 className="section__title">{t("favorites")}</h2>
            <div className="movie-grid">{favorites.map(renderCard)}</div>
          </section>
        )}
      </main>

      <Footer />

      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={closeModal}
          onOpenItem={openItem}
          onOpenPerson={openPerson}
          settings={settings}
          contentMode={contentMode}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
        />
      )}

      {personId && (
        <PersonModal
          personId={personId}
          onClose={closeModal}
          onOpenItem={openItem}
        />
      )}

      {error && (
        <div className="toast" role="alert">
          <span>{t("errorLoad")}</span>
          <button
            type="button"
            onClick={() => {
              applyQuery(currentQuery);
              fetchTrendingFor(media);
            }}
          >
            {t("retry")}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
