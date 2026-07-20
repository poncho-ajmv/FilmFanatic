import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Registra el Service Worker (solo en producción) para que funcione como PWA.
// Además, se ACTUALIZA SOLO: cuando detecta una versión nueva publicada, la
// activa de inmediato y recarga la página una vez para mostrar lo más reciente.
if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .then((registration) => {
        // Busca actualizaciones al cargar y cada vez que se regresa a la pestaña
        const checkForUpdate = () => registration.update().catch(() => {});
        checkForUpdate();
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") checkForUpdate();
        });

        // Si aparece un Service Worker nuevo, actívalo en cuanto quede listo
        registration.addEventListener("updatefound", () => {
          const nw = registration.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              nw.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => {
        /* si falla el registro, la app sigue funcionando normal */
      });

    // Cuando el Service Worker nuevo toma control, recarga una sola vez
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
