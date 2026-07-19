// api/preview.js — Vista previa al compartir (Open Graph).
// Cuando un bot de redes (WhatsApp, Facebook, X, etc.) abre /movie/:id o /tv/:id,
// esta función devuelve HTML con las meta-etiquetas (título, descripción, póster)
// para que la tarjeta de vista previa se vea bien. A los usuarios normales les
// sirve la app (index.html) sin cambios.

const escapeHtml = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const BOT =
  /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|Discordbot|TelegramBot|Pinterest|redditbot|Googlebot|bingbot|Applebot|SkypeUriPreview/i;

export default async function handler(req, res) {
  const host = `https://${req.headers.host}`;
  const media = req.query.media === "tv" ? "tv" : "movie";
  const id = String(req.query.id || "").replace(/[^0-9]/g, "");
  const ua = req.headers["user-agent"] || "";

  // Usuario normal: servir la app tal cual
  if (!BOT.test(ua)) {
    try {
      const html = await fetch(`${host}/index.html`).then((r) => r.text());
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(html);
    } catch {
      res.status(302).setHeader("Location", "/").end();
    }
    return;
  }

  // Bot: devolver HTML con Open Graph
  try {
    const key = process.env.TMDB_API_KEY;
    const r = await fetch(
      `https://api.themoviedb.org/3/${media}/${id}?api_key=${key}&language=es-MX`
    );
    const d = await r.json();
    const title = escapeHtml(d.title || d.name || "FilmFanatic");
    const desc = escapeHtml((d.overview || "").slice(0, 200));
    const img = d.poster_path
      ? `https://image.tmdb.org/t/p/w500${d.poster_path}`
      : `${host}/logo512.png`;
    const url = `${host}/${media}/${id}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.status(200).send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${title} — FilmFanatic</title>
<meta name="description" content="${desc}" />
<meta property="og:site_name" content="FilmFanatic" />
<meta property="og:type" content="video.${media === "tv" ? "tv_show" : "movie"}" />
<meta property="og:title" content="${title} — FilmFanatic" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${img}" />
<meta property="og:url" content="${url}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title} — FilmFanatic" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${img}" />
</head>
<body></body>
</html>`);
  } catch {
    res.status(302).setHeader("Location", "/").end();
  }
}
