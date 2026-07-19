// Footer.js
import React from "react";
import { t } from "./i18n";

function Footer() {
  return (
    <footer>
      <p className="footer__tmdb">{t("tmdb")}</p>
      <p className="footer__credit">
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          themoviedb.org
        </a>
        {" · "}© 2026 FilmFanatic · poncho-ajmv &amp; Reginarivas
      </p>
    </footer>
  );
}

export default Footer;
