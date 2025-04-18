# 🎥 FilmFanatic (React)

FilmFanatic es una aplicación web construida con React que permite buscar, explorar y visualizar información detallada sobre películas utilizando la API de The Movie Database (TMDb).

---

## 🚀 Características

- Búsqueda en tiempo real de películas por título
- Filtros por popularidad, calificación y fecha de estreno
- Visualización de tráilers mediante YouTube
- Información de reparto y directores
- Sistema de favoritos
- Interfaz rápida, responsive y con transiciones suaves
- Exclusión de resultados relacionados con tiburones (según requerimiento)

---

## 🧰 Tecnologías utilizadas

- React
- Axios
- TMDb API
- React Slick (carrusel)
- CSS personalizado y modular

---

## 🛠️ Instalación local

```bash
git clone https://github.com/usuario/filmfanatic-app.git
cd filmfanatic-app
npm install
npm start
```

> Requiere una clave de API de [TMDb](https://www.themoviedb.org/documentation/api) para funcionar.

---

## 📁 Estructura del proyecto

```
src/
├── App.js
├── components/
│   ├── MovieCarousel.js
│   ├── StarRating.js
│   ├── Footer.js
│   └── useDebounce.js
├── styles/
│   ├── App.css
│   ├── MovieList.css
│   └── ...
```

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT.

