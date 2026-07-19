import React from "react";

// Muestra una calificación de 0 a 5 estrellas (con medias estrellas).
// Recibe `rating` en escala TMDb de 0 a 10 y lo convierte a 5.
const StarRating = ({ rating = 0, size = 22 }) => {
  const maxStars = 5;
  const scaled = (Number(rating) || 0) / 2; // 0–10  ->  0–5
  const rounded = Math.round(scaled * 2) / 2; // redondeo a la media más cercana
  const fullStars = Math.floor(rounded);
  const hasHalf = rounded - fullStars === 0.5;
  const emptyStars = maxStars - fullStars - (hasHalf ? 1 : 0);

  const base = { fontSize: `${size}px`, lineHeight: 1, display: "inline-block" };
  const stars = [];

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={`full-${i}`} style={{ ...base, color: "var(--star)" }}>
        ★
      </span>
    );
  }

  if (hasHalf) {
    stars.push(
      <span
        key="half"
        style={{ ...base, color: "var(--star-empty)", position: "relative" }}
      >
        ★
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "50%",
            overflow: "hidden",
            color: "var(--star)",
          }}
        >
          ★
        </span>
      </span>
    );
  }

  for (let i = 0; i < Math.max(emptyStars, 0); i++) {
    stars.push(
      <span key={`empty-${i}`} style={{ ...base, color: "var(--star-empty)" }}>
        ★
      </span>
    );
  }

  return (
    <div
      style={{ display: "inline-flex", gap: "3px", verticalAlign: "middle" }}
      aria-label={`${rounded} de ${maxStars} estrellas`}
    >
      {stars}
    </div>
  );
};

export default StarRating;
