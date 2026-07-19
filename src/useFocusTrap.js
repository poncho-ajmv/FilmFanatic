import { useEffect } from "react";

// Atrapa el foco dentro de un contenedor (modal) para accesibilidad con teclado:
// el Tab cicla solo entre los elementos del modal, y al cerrar devuelve el foco.
export default function useFocusTrap(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const prevFocus = document.activeElement;

    const focusables = () =>
      Array.from(
        el.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((n) => n.offsetParent !== null);

    el.focus();

    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("keydown", onKey);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    };
  }, [ref]);
}
