import React, { useEffect, useRef, useState } from "react";
import {
  GearIcon,
  SunIcon,
  MoonIcon,
  FlameIcon,
  ClockIcon,
  StarLineIcon,
  TrophyIcon,
} from "./Icons";
import { t } from "./i18n";

const DEFAULT_BASE = "https://www.imdb.com/";
const DEFAULT_LABEL = "IMDb";

function SettingsMenu({
  dark,
  applyTheme,
  settings,
  setSettings,
  activeFilter,
  sortHandlers,
  clickMode,
  setClickMode,
  contentMode,
  setContentMode,
  language,
  setLanguage,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const SORTS = [
    { key: "popular", label: t("popular"), Icon: FlameIcon },
    { key: "recent", label: t("recent"), Icon: ClockIcon },
    { key: "top", label: t("topRated"), Icon: StarLineIcon },
    { key: "alltime", label: t("allTime"), Icon: TrophyIcon },
  ];

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const reset = () =>
    setSettings((s) => ({ ...s, externalBase: DEFAULT_BASE, externalLabel: DEFAULT_LABEL }));

  return (
    <div className="settings-wrap" ref={wrapRef}>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("close")}
        aria-expanded={open}
      >
        <GearIcon />
      </button>

      {open && (
        <div className="settings-panel" role="dialog">
          <p className="settings-panel__title">{t("language")}</p>
          <div className="theme-switch">
            <button
              className={language === "es" ? "active" : ""}
              onClick={() => setLanguage("es")}
            >
              Español
            </button>
            <button
              className={language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
            >
              English
            </button>
          </div>

          <p className="settings-panel__title">{t("sort")}</p>
          <div className="settings-sort">
            {SORTS.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={activeFilter === key ? "active" : ""}
                onClick={() => {
                  sortHandlers[key]();
                  setOpen(false);
                }}
              >
                <Icon /> {label}
              </button>
            ))}
          </div>

          <p className="settings-panel__title">{t("onClickTitle")}</p>
          <div className="theme-switch">
            <button
              className={clickMode === "inline" ? "active" : ""}
              onClick={() => setClickMode("inline")}
            >
              {t("inline")}
            </button>
            <button
              className={clickMode === "modal" ? "active" : ""}
              onClick={() => setClickMode("modal")}
            >
              {t("windowMode")}
            </button>
          </div>

          <p className="settings-panel__title">{t("content")}</p>
          <div className="theme-switch">
            <button
              className={contentMode === "libre" ? "active" : ""}
              onClick={() => setContentMode("libre")}
            >
              {t("free")}
            </button>
            <button
              className={contentMode === "censurar" ? "active" : ""}
              onClick={() => setContentMode("censurar")}
            >
              {t("censor")}
            </button>
            <button
              className={contentMode === "ocultar" ? "active" : ""}
              onClick={() => setContentMode("ocultar")}
            >
              {t("hide")}
            </button>
          </div>

          <p className="settings-panel__title">{t("theme")}</p>
          <div className="theme-switch">
            <button
              className={!dark ? "active" : ""}
              onClick={() => applyTheme("light")}
            >
              <SunIcon /> {t("light")}
            </button>
            <button
              className={dark ? "active" : ""}
              onClick={() => applyTheme("dark")}
            >
              <MoonIcon /> {t("dark")}
            </button>
          </div>

          <p className="settings-panel__title">{t("linkTitle")}</p>
          <div className="settings-field">
            <label>{t("urlBase")}</label>
            <input
              type="text"
              value={settings.externalBase}
              placeholder={DEFAULT_BASE}
              onChange={(e) => update({ externalBase: e.target.value })}
            />
          </div>
          <div className="settings-field">
            <label>{t("buttonText")}</label>
            <input
              type="text"
              value={settings.externalLabel}
              placeholder={DEFAULT_LABEL}
              onChange={(e) => update({ externalLabel: e.target.value })}
            />
          </div>
          <button className="settings-reset" onClick={reset}>
            {t("resetImdb")}
          </button>
        </div>
      )}
    </div>
  );
}

export { DEFAULT_BASE, DEFAULT_LABEL };
export default SettingsMenu;
