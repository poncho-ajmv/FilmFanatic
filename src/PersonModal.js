import React, { useEffect, useRef, useState, useCallback } from "react";
import { getPerson, profileUrl, posterUrl, titleOf, yearOf, NO_IMAGE, NO_PROFILE } from "./api";
import { CloseIcon, StarGlyph } from "./Icons";
import { t } from "./i18n";
import useFocusTrap from "./useFocusTrap";

const KNOWN_FOR = {
  Acting: "Actuación",
  Directing: "Dirección",
  Writing: "Guion",
  Production: "Producción",
  Sound: "Sonido",
  Camera: "Cámara",
};

// Edad a partir de la fecha de nacimiento (hasta hoy, o hasta la muerte si falleció)
const computeAge = (birth, death) => {
  if (!birth) return null;
  const b = new Date(birth);
  if (isNaN(b)) return null;
  const end = death ? new Date(death) : new Date();
  let age = end.getFullYear() - b.getFullYear();
  const m = end.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < b.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
};

function PersonModal({ personId, onClose, onOpenItem }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bioOpen, setBioOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setData(null);
    setBioOpen(false);
    (async () => {
      try {
        const d = await getPerson(personId);
        if (alive) setData(d);
      } catch (e) {
        console.error("Error al cargar actor:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [personId]);

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

  useEffect(() => {
    if (data?.name) document.title = `${data.name} — FilmFanatic`;
    return () => {
      document.title = "FilmFanatic";
    };
  }, [data]);

  const bio = data?.biography || "";
  const longBio = bio.length > 520;
  const age = data ? computeAge(data.birthday, data.deathday) : null;
  // Otros nombres (quita el nombre principal y duplicados; muestra unos pocos)
  const aka = (data?.also_known_as || [])
    .filter((n) => n && n.trim() && n.trim() !== (data?.name || "").trim())
    .slice(0, 3)
    .join(", ");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--person"
        onClick={stop}
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={data?.name || "FilmFanatic"}
      >
        <button className="modal__close" onClick={onClose} aria-label={t("close")}>
          <CloseIcon />
        </button>

        {loading || !data ? (
          <div className="person__head">
            <div className="skeleton person__photo" />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="skeleton modal-skeleton__line" style={{ width: "55%", height: "24px" }} />
              <div className="skeleton modal-skeleton__line" style={{ width: "75%" }} />
              <div className="skeleton modal-skeleton__line" style={{ width: "90%" }} />
              <div className="skeleton modal-skeleton__line" style={{ width: "85%" }} />
            </div>
          </div>
        ) : (
          <>
            <div className="person__head">
              <img
                className="person__photo"
                src={profileUrl(data.profile_path)}
                alt={data.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = NO_PROFILE;
                }}
              />
              <div>
                <h1 className="person__name">{data.name}</h1>
                <div className="person__facts">
                  {data.known_for_department && (
                    <div>
                      <strong>{t("knownFor")}</strong>{" "}
                      {KNOWN_FOR[data.known_for_department] || data.known_for_department}
                    </div>
                  )}
                  {data.birthday && (
                    <div>
                      <strong>{t("birth")}</strong> {data.birthday}
                      {data.place_of_birth ? ` — ${data.place_of_birth}` : ""}
                    </div>
                  )}
                  {data.deathday && (
                    <div>
                      <strong>{t("death")}</strong> {data.deathday}
                      {age != null ? ` (${age} ${t("yearsOld")})` : ""}
                    </div>
                  )}
                  {age != null && !data.deathday && (
                    <div>
                      <strong>{t("age")}</strong> {age} {t("yearsOld")}
                    </div>
                  )}
                  {aka && (
                    <div>
                      <strong>{t("alsoKnownAs")}</strong> {aka}
                    </div>
                  )}
                  {data.homepage && (
                    <div>
                      <strong>{t("website")}</strong>{" "}
                      <a
                        href={data.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="person__link"
                      >
                        {data.homepage.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    </div>
                  )}
                </div>
                {bio ? (
                  <>
                    <p className={`person__bio ${longBio && !bioOpen ? "person__bio--clamp" : ""}`}>
                      {bio}
                    </p>
                    {longBio && (
                      <button className="review__more" onClick={() => setBioOpen((v) => !v)}>
                        {bioOpen ? t("seeLess") : t("readMore")}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="detail__empty">{t("noBio")}</p>
                )}
              </div>
            </div>

            <div className="person__filmo">
              <h3 className="detail__section-title">{t("filmography")}</h3>
              {data.filmography?.length > 0 ? (
                <div className="movie-grid">
                  {data.filmography.slice(0, 30).map((m) => (
                    <button
                      type="button"
                      key={`${m.media_type}-${m.id}-${m.credit_id}`}
                      className="movie-card"
                      onClick={() => onOpenItem({ media: m.media_type, id: m.id })}
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
                      <div className="cast-card__char">
                        {m.character ? m.character : ""}
                        {yearOf(m) ? ` · ${yearOf(m)}` : ""}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="detail__empty">{t("noFilmo")}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PersonModal;
