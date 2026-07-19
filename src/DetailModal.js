import React, { useEffect, useRef, useState, useCallback } from "react";
import useFocusTrap from "./useFocusTrap";
import {
  getDetail,
  getProviders,
  pickTrailer,
  getCertification,
  isAdultRating,
  titleOf,
  yearOf,
  formatRuntime,
  posterUrl,
  profileUrl,
  buildTitleUrl,
  IMG,
  NO_IMAGE,
  NO_PROFILE,
} from "./api";
import StarRating from "./StarRating";
import Review from "./Review";
import ShareMenu from "./ShareMenu";
import { t } from "./i18n";
import { BookmarkIcon, CloseIcon, ExternalIcon, StarGlyph, EyeIcon } from "./Icons";

function DetailModal({
  item,
  onClose,
  onOpenItem,
  onOpenPerson,
  settings,
  contentMode,
  isFavorite,
  toggleFavorite,
}) {
  const { media, id } = item;
  const [data, setData] = useState(null);
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("reparto");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setData(null);
    setProviders(null);
    setTab("reparto");
    setRevealed(false);
    (async () => {
      try {
        const d = await getDetail(media, id);
        if (!alive) return;
        setData(d);
        const p = await getProviders(media, id);
        if (alive) setProviders(p);
      } catch (e) {
        console.error("Error al cargar detalle:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [media, id]);

  // Bloquea el scroll del fondo y cierra con Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const stop = useCallback((e) => e.stopPropagation(), []);
  const modalRef = useRef(null);
  useFocusTrap(modalRef);

  const title = data ? titleOf(data) : "";

  // Título dinámico de la pestaña
  useEffect(() => {
    if (data) document.title = `${titleOf(data)} — FilmFanatic`;
    return () => {
      document.title = "FilmFanatic";
    };
  }, [data]);
  const year = data ? yearOf(data) : null;
  const runtime = data
    ? media === "tv"
      ? data.number_of_seasons
        ? `${data.number_of_seasons} temp.`
        : formatRuntime(data.episode_run_time?.[0])
      : formatRuntime(data.runtime)
    : null;
  const cert = data ? getCertification(data, media) : "";
  const trailer = data ? pickTrailer(data) : null;
  const cast = data?.credits?.cast || [];
  const recommendations = (data?.recommendations?.results || []).filter(
    (r) => r.poster_path
  );
  const reviews = data?.reviews?.results || [];
  const imdbId = data?.imdb_id || data?.external_ids?.imdb_id || "";
  const externalHref = buildTitleUrl(settings.externalBase, imdbId);
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${media}/${id}`
      : "";

  // Censura del póster/fondo del detalle (según clasificación US)
  const usCert = data
    ? media === "tv"
      ? (data.content_ratings?.results || []).find((x) => x.iso_3166_1 === "US")
          ?.rating || ""
      : (
          (data.release_dates?.results || []).find(
            (x) => x.iso_3166_1 === "US"
          )?.release_dates || []
        )
          .map((r) => r.certification)
          .find((c) => c) || ""
    : "";
  const censored = contentMode !== "libre" && isAdultRating(usCert, media) && !revealed;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={stop}
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title || "FilmFanatic"}
      >
        <button className="modal__close" onClick={onClose} aria-label={t("close")}>
          <CloseIcon />
        </button>

        {loading || !data ? (
          <div className="modal-skeleton">
            <div className="skeleton modal-skeleton__hero" />
            <div className="modal-skeleton__body">
              <div className="skeleton modal-skeleton__line" style={{ width: "55%", height: "26px" }} />
              <div className="skeleton modal-skeleton__line" style={{ width: "35%" }} />
              <div className="skeleton modal-skeleton__line" style={{ width: "90%" }} />
              <div className="skeleton modal-skeleton__line" style={{ width: "80%" }} />
            </div>
          </div>
        ) : (
          <>
            <div
              className={`detail__hero ${censored ? "detail__hero--censored" : ""}`}
              style={{
                backgroundImage: data.backdrop_path
                  ? `url(${IMG.backdrop}${data.backdrop_path})`
                  : "none",
              }}
            >
              <div className="detail__hero-overlay" />
              {censored && (
                <button
                  type="button"
                  className="detail__reveal"
                  onClick={() => setRevealed(true)}
                >
                  <EyeIcon />
                  <span>{t("sensitive")}</span>
                  <span className="detail__reveal-hint">{t("clickToView")}</span>
                </button>
              )}
              <div className="detail__hero-inner">
                <img
                  className={`detail__poster ${censored ? "censored" : ""}`}
                  src={posterUrl(data.poster_path)}
                  alt={censored ? "" : title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = NO_IMAGE;
                  }}
                />
                <div className="detail__info">
                  <h1 className="detail__title">{title}</h1>
                  {data.tagline && <p className="detail__tagline">{data.tagline}</p>}

                  <div className="detail__rating">
                    <StarRating rating={data.vote_average} size={24} />
                    <span className="detail__score">
                      {data.vote_average ? data.vote_average.toFixed(1) : "—"} / 10
                    </span>
                    {data.vote_count ? (
                      <span className="detail__votes">
                        ({data.vote_count.toLocaleString()} {t("votes")})
                      </span>
                    ) : null}
                  </div>

                  <div className="detail__meta">
                    {year && <span>{year}</span>}
                    {runtime && <span>{runtime}</span>}
                    {cert && <span className="detail__cert">{cert}</span>}
                    {data.original_language && (
                      <span>{data.original_language.toUpperCase()}</span>
                    )}
                    <span>{media === "tv" ? t("serie") : t("movie")}</span>
                  </div>

                  {data.genres?.length > 0 && (
                    <div className="detail__genres">
                      {data.genres.map((g) => (
                        <span key={g.id} className="genre-chip">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="detail__actions">
                    <button
                      className={`favorite-button ${isFavorite(data) ? "favorited" : ""}`}
                      onClick={() => toggleFavorite({ ...data, media_type: media })}
                    >
                      <BookmarkIcon filled={isFavorite(data)} />
                      {isFavorite(data) ? t("removeFav") : t("addFav")}
                    </button>
                    {externalHref && (
                      <a
                        className="imdb-button"
                        href={externalHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="imdb-button__tag">{settings.externalLabel}</span>
                        <ExternalIcon />
                      </a>
                    )}
                    <ShareMenu url={shareUrl} title={title} />
                  </div>

                  {providers && providers.list.length > 0 && (
                    <div className="detail__providers">
                      <span className="detail__providers-label">{t("availableOn")}</span>
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
                  )}
                </div>
              </div>
            </div>

            <div className="detail__body">
              {data.overview && <p className="detail__overview">{data.overview}</p>}

              {trailer && (
                <>
                  <h3 className="detail__section-title">{t("trailer")}</h3>
                  <div className="detail__trailer">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${trailer.key}`}
                      title={`${t("trailer")} — ${title}`}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </>
              )}

              <div className="tabs">
                <button
                  className={`tab ${tab === "reparto" ? "tab--active" : ""}`}
                  onClick={() => setTab("reparto")}
                >
                  {t("cast")}
                </button>
                <button
                  className={`tab ${tab === "resenas" ? "tab--active" : ""}`}
                  onClick={() => setTab("resenas")}
                >
                  {t("reviews")}{reviews.length ? ` (${reviews.length})` : ""}
                </button>
                <button
                  className={`tab ${tab === "similares" ? "tab--active" : ""}`}
                  onClick={() => setTab("similares")}
                >
                  {t("similar")}
                </button>
              </div>

              {tab === "reparto" &&
                (cast.length > 0 ? (
                  <div className="cast-row">
                    {cast
                      .filter((a) => a.order <= 20)
                      .map((a) => (
                        <button
                          type="button"
                          className="cast-card"
                          key={a.cast_id || a.credit_id}
                          onClick={() => onOpenPerson(a.id)}
                        >
                          <img
                            className="cast-card__photo"
                            src={profileUrl(a.profile_path)}
                            alt={a.name}
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = NO_PROFILE;
                            }}
                          />
                          <div className="cast-card__name">{a.name}</div>
                          {a.character && (
                            <div className="cast-card__char">{a.character}</div>
                          )}
                        </button>
                      ))}
                  </div>
                ) : (
                  <p className="detail__empty">{t("noCast")}</p>
                ))}

              {tab === "resenas" &&
                (reviews.length > 0 ? (
                  reviews.map((r) => <Review key={r.id} review={r} />)
                ) : (
                  <p className="detail__empty">
                    {t("noReviews")}
                  </p>
                ))}

              {tab === "similares" &&
                (recommendations.length > 0 ? (
                  <div className="movie-grid">
                    {recommendations.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        className="movie-card"
                        onClick={() => onOpenItem({ media, id: m.id })}
                      >
                        <div className="movie-card__poster">
                          <img
                            src={posterUrl(m.poster_path)}
                            alt={titleOf(m)}
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = NO_IMAGE;
                            }}
                          />
                          <span className="movie-card__badge">
                            <StarGlyph />
                            {m.vote_average ? m.vote_average.toFixed(1) : "—"}
                          </span>
                        </div>
                        <h4 className="movie-card__title">{titleOf(m)}</h4>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="detail__empty">{t("noSimilar")}</p>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DetailModal;
