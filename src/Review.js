import React, { useState } from "react";
import { StarGlyph } from "./Icons";
import { t } from "./i18n";

export default function Review({ review }) {
  const [expanded, setExpanded] = useState(false);
  const rating = review.author_details?.rating;
  const long = (review.content || "").length > 480;
  return (
    <div className="review">
      <div className="review__head">
        <span className="review__author">{review.author}</span>
        {rating ? (
          <span className="review__rating">
            <StarGlyph /> {rating}/10
          </span>
        ) : null}
      </div>
      <div
        className={`review__content ${long && !expanded ? "review__content--clamp" : ""}`}
      >
        {review.content}
      </div>
      {long && (
        <button className="review__more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? t("seeLess") : t("readMore")}
        </button>
      )}
    </div>
  );
}
