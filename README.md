# 🎬 FilmFanatic

FilmFanatic es una aplicación web hecha con **React** para buscar, explorar y descubrir **películas y series**, con enlaces a IMDb, dónde verlas, tráilers, reparto, reseñas y favoritos. Usa la API de **The Movie Database (TMDb)**.

---

## ✨ Características

- Búsqueda en tiempo real de películas y series (con debounce)
- Selector **Películas / Series**
- Filtros: Populares, Recientes, Mejor valoradas, Todo el tiempo, y por género
- Ficha completa: año, duración, clasificación por edad, géneros, votos, sinopsis
- Tráiler de YouTube integrado
- **Reparto con fotos** → ficha del actor con biografía y filmografía
- **Reseñas** de usuarios y **títulos similares**
- **Dónde verla**: plataformas de streaming (datos de JustWatch vía TMDb)
- Enlace externo configurable (IMDb por defecto; el usuario puede cambiar el dominio)
- Sistema de **favoritos** persistente
- **Modo claro / oscuro** con animación de transición
- **Idioma Español / Inglés** (contenido e interfaz)
- **Censura de contenido adulto** (Libre / Censurar / Ocultar) por clasificación de edad
- Dos modos de interacción: detalle integrado o ventana emergente
- **Enlaces compartibles** por película/serie/actor (react-router)
- **Botón de compartir** (copiar enlace, WhatsApp, X, Facebook, nativo) con **vista previa Open Graph** para bots de redes
- **Cargar más** (paginación) y skeletons de carga
- Atribución a TMDb, manejo de errores, accesibilidad (foco atrapado en modales)
- PWA instalable
- Exclusión de resultados relacionados con tiburones (según requerimiento)

---

## 🧰 Tecnologías

- React, React Router
- Axios
- TMDb API (proxy serverless para ocultar la clave en producción)
- React Slick (carrusel)
- CSS con variables (temas claro/oscuro)

---

## 📁 Estructura

```
api/
├── tmdb.js            # Proxy serverless (Vercel) que oculta la API key
└── preview.js         # Vista previa Open Graph al compartir enlaces
src/
├── App.js             # Orquestador principal
├── api.js             # Todas las llamadas a TMDb + helpers
├── i18n.js            # Textos ES / EN
├── Icons.js           # Iconos SVG
├── sharkFilter.js     # Filtro de películas de tiburones
├── MovieCarousel.js   # Carrusel
├── DetailModal.js     # Ficha ampliada (reparto, reseñas, similares)
├── PersonModal.js     # Ficha del actor + filmografía
├── SettingsMenu.js    # Configuración (idioma, orden, tema, contenido, enlace)
├── StarRating.js      # Estrellas 1–5 con medias
├── Review.js          # Reseña individual
└── ... (estilos .css)
```

---

## 🛠️ Instalación local

```bash
npm install
npm start
```

Crea un archivo **`.env`** en la raíz con tu clave de TMDb (solo para desarrollo):

```
REACT_APP_API_KEY=tu_clave_de_tmdb
```

> Consigue una clave gratis en https://www.themoviedb.org/settings/api

---

## 🚀 Despliegue (Vercel) con la API key oculta

En producción la app **no** usa `REACT_APP_API_KEY` (que quedaría expuesta en el navegador). En su lugar llama al proxy serverless `api/tmdb.js`, que guarda la clave del lado del servidor.

Pasos:

1. Sube el proyecto a Vercel.
2. En **Settings → Environment Variables** agrega:
   - `TMDB_API_KEY` = tu clave de TMDb
   - (No definas `REACT_APP_API_KEY` en producción, para que la clave no viaje al navegador.)
3. Deploy. Las rutas compartibles (`/movie/123`, etc.) funcionan gracias a `vercel.json`.

---

## 🧪 Tests

```bash
npm test
```

Incluye pruebas de las funciones clave: filtro de tiburones, armado de URL del enlace, clasificación adulta e idioma.

---

## 📄 Licencia

MIT. Créditos de datos: The Movie Database (TMDb). Este producto usa la API de TMDb pero no está avalado ni certificado por TMDb.
