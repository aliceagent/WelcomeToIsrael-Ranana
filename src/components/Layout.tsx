import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import type { Lang } from "../lib/types";
import { getFolder } from "../lib/directory";

const LANGS: Lang[] = ["en", "fr", "he"];

function scrollToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function Layout() {
  const { lang, setLang, online } = useStore();
  const loc = useLocation();
  const folder = loc.pathname.startsWith("/d/") ? getFolder(loc.pathname.slice(3)) : undefined;
  const foodOn = loc.pathname === "/food" || folder?.group === "food";

  useEffect(() => {
    if (loc.hash) {
      const el = document.getElementById(decodeURIComponent(loc.hash.slice(1)));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    scrollToTop();
    const frame = requestAnimationFrame(scrollToTop);
    return () => cancelAnimationFrame(frame);
  }, [loc.pathname, loc.hash]);

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
        <NavLink to="/" end className={({ isActive }) => (isActive ? "on" : "")}>
          <span className="ico">⌂</span>
          {t(lang, "home")}
        </NavLink>
        <NavLink to="/food" className={() => (foodOn ? "on" : "")}>
          <span className="ico">🍽</span>
          {t(lang, "food")}
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => (isActive ? "on" : "")}>
          <span className="ico">⌕</span>
          {t(lang, "search")}
        </NavLink>
        <NavLink to="/saved" className={({ isActive }) => (isActive ? "on" : "")}>
          <span className="ico">★</span>
          {t(lang, "saved")}
        </NavLink>
        <NavLink to="/emergency" className={({ isActive }) => (isActive ? "on" : "")}>
          <span className="ico">🚨</span>
          {t(lang, "sos")}
        </NavLink>
      </nav>
    </div>
  );
}
