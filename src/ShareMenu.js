import React, { useEffect, useRef, useState } from "react";
import { t } from "./i18n";
import { ShareIcon } from "./Icons";

// Botón "Compartir" con menú de opciones (copiar, WhatsApp, X, Facebook y
// el compartir nativo del sistema si está disponible).
export default function ShareMenu({ url, title }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const shareText = `${title} — FilmFanatic`;
  const enc = encodeURIComponent;
  const wa = `https://wa.me/?text=${enc(`${shareText} ${url}`)}`;
  const tw = `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(url)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignorar */
    }
  };

  const native = async () => {
    try {
      await navigator.share({ title: shareText, url });
      setOpen(false);
    } catch {
      /* el usuario canceló */
    }
  };

  const canNative = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="share-wrap" ref={ref}>
      <button
        type="button"
        className="imdb-button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <ShareIcon />
        {t("share")}
      </button>

      {open && (
        <div className="share-menu" role="menu">
          {canNative && (
            <button type="button" onClick={native}>
              {t("shareNative")}
            </button>
          )}
          <button type="button" onClick={copy}>
            {copied ? t("copied") : t("copyLink")}
          </button>
          <a href={wa} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          <a href={tw} target="_blank" rel="noopener noreferrer">
            X (Twitter)
          </a>
          <a href={fb} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
        </div>
      )}
    </div>
  );
}
