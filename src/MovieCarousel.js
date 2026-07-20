import React, { useEffect } from "react";
import Slider from "react-slick";
import StarRating from "./StarRating";
import { titleOf } from "./api";
import { t } from "./i18n";
import { EyeIcon } from "./Icons";
import "./MovieCarousel.css";

const NO_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300'>
      <rect width='100%' height='100%' fill='#1c212b'/>
      <text x='50%' y='50%' fill='#97a1b0' font-family='sans-serif' font-size='16'
        text-anchor='middle' dominant-baseline='middle'>Sin imagen</text>
    </svg>`
  );

function Arrow({ dir, className, style, onClick }) {
  return (
    <button
      type="button"
      className={className}
      style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClick}
      aria-label={dir === "prev" ? "Anterior" : "Siguiente"}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {dir === "prev" ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  );
}

function MovieCarousel({
  movies = [],
  onClickItem,
  onDoubleClickItem,
  censorStatus = () => "show",
  onReveal = () => {},
}) {
  const visible = movies.filter((m) => censorStatus(m) !== "hidden");

  // react-slick a veces mide mal el ancho al montar (sobre todo el PRIMER
  // carrusel de la página, que aparecía gigante). Forzamos un recálculo tras
  // el montaje y poco después, para que use el ancho real del teléfono.
  useEffect(() => {
    if (!visible.length) return undefined;
    const fire = () => window.dispatchEvent(new Event("resize"));
    const raf = requestAnimationFrame(fire);
    const t1 = setTimeout(fire, 200);
    const t2 = setTimeout(fire, 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible.length]);

  if (!visible.length) return null;

  const settings = {
    dots: false,
    infinite: visible.length > 5,
    speed: 400,
    slidesToShow: 5,
    slidesToScroll: 3,
    swipeToSlide: true,
    prevArrow: <Arrow dir="prev" />,
    nextArrow: <Arrow dir="next" />,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 4, slidesToScroll: 2 } },
      { breakpoint: 900, settings: { slidesToShow: 3, slidesToScroll: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 2, slidesToScroll: 2 } },
      { breakpoint: 460, settings: { slidesToShow: 2, slidesToScroll: 1 } },
    ],
  };

  return (
    <div className="carousel">
      <Slider {...settings}>
        {visible.map((movie) => {
          const status = censorStatus(movie);
          const censored = status === "pending" || status === "censor";
          return (
            <div key={movie.id} className="carousel__slide">
              <button
                type="button"
                className="carousel__item"
                onClick={() => {
                  if (censored) {
                    onReveal(movie);
                    return;
                  }
                  onClickItem && onClickItem(movie);
                }}
                onDoubleClick={() => {
                  if (!censored) onDoubleClickItem && onDoubleClickItem(movie);
                }}
              >
                <div className="carousel__poster">
                  <img
                    loading="lazy"
                    className={censored ? "censored" : ""}
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                        : NO_IMAGE
                    }
                    alt={censored ? "" : titleOf(movie)}
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
                </div>
                <h4 className="carousel__title">{titleOf(movie)}</h4>
                <div className="carousel__stars">
                  <StarRating rating={movie.vote_average} size={16} />
                </div>
                <p className="carousel__score">
                  {movie.vote_average ? movie.vote_average.toFixed(1) : "—"} / 10
                </p>
              </button>
            </div>
          );
        })}
      </Slider>
    </div>
  );
}

export default MovieCarousel;
