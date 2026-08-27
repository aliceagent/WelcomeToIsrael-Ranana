import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import type { Lang } from "../lib/types";

const LANGS: Lang[] = ["en", "fr", "he"];

export function Layout() {
  const { lang, setLang, online } = useStore();
  const loc = useLocation();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <div className="mark">ר</div>
          <div>
            <h1>{t(lang, "appName")}</h1>
            <p>{t(lang, "tagline")}</p>
          </div>
        </Link>
        <div className="lang-switch" role="group" aria-label={t(lang, "language")}>
          {LANGS.map((l) => (
            <button key={l} className={l === lang ? "on" : ""} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      {!online && <div className="banner off">{t(lang, "offline")}</div>}
      <Outlet />
      <nav className="bottom-nav">
        <NavLink to="/" className={loc.pathname === "/" ? "on" : ""}>
          <span className="ico">⌂</span>
          {t(lang, "home")}
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => (isActive ? "on" : "")}>
          <span className="ico">⌕</span>
          {t(lang, "search")}
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => (isActive ? "on" : "")}>
          <span className="ico">◉</span>
          {t(lang, "map")}
        </NavLink>
        <NavLink to="/saved" className={({ isActive }) => (isActive ? "on" : "")}>
          <span className="ico">★</span>
          {t(lang, "saved")}
        </NavLink>
        <NavLink to="/more" className={({ isActive }) => (isActive ? "on" : "")}>
          <span className="ico">☰</span>
          {t(lang, "more")}
        </NavLink>
      </nav>
    </div>
  );
}
