// api/tmdb.js — Proxy serverless (Vercel) para TMDb.
// La clave vive SOLO en el servidor (variable de entorno TMDB_API_KEY),
// así nunca queda expuesta en el navegador.
//
// El cliente llama /api/tmdb?path=/movie/popular&language=es-MX&...
// y esta función le agrega la api_key y reenvía a TMDb.

// Solo se permiten estas rutas de TMDb (evita usar el proxy para cualquier cosa)
const ALLOWED = [
  "/movie",
  "/tv",
  "/search",
  "/discover",
  "/trending",
  "/person",
  "/genre",
  "/configuration",
];

export default async function handler(req, res) {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    res.status(500).json({ error: "Falta TMDB_API_KEY en el servidor" });
    return;
  }

  if (req.method && req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const { path = "", ...rest } = req.query || {};
    const safePath = String(path).startsWith("/") ? String(path) : `/${path}`;

    if (!ALLOWED.some((p) => safePath === p || safePath.startsWith(`${p}/`))) {
      res.status(400).json({ error: "path_not_allowed" });
      return;
    }

    const url = new URL(`https://api.themoviedb.org/3${safePath}`);
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
    url.searchParams.set("api_key", key);

    const r = await fetch(url.toString());
    const data = await r.json();

    // Cache en el edge de Vercel para ir más rápido y usar menos cuota
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: "proxy_error" });
  }
}
