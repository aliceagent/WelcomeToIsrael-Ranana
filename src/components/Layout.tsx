import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import type { Lang } from "../lib/types";
import { getFolder } from "../lib/directory";
import { fallbackParent, isTabPath, useChromeTitle } from "../lib/nav";
import { FoodIcon, HomeIcon, SavedIcon, SearchIcon, SosIcon } from "./Icons";

const LANGS: Lang[] = ["en", "fr", "he"];

function scrollToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function Layout() {
  const { lang, setLang, online } = useStore();
  const loc = useLocation();
  const navigate = useNavigate();
  const title = useChromeTitle();
  const folder = loc.pathname.startsWith("/d/") ? getFolder(loc.pathname.slice(3)) : undefined;
  const foodOn = loc.pathname === "/food" || folder?.group === "food";
  const tab = isTabPath(loc.pathname);

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

  function goBack() {
    if (loc.key !== "default") navigate(-1);
    else navigate(fallbackParent(loc.pathname));
  }

  return (
    <div className="app-shell">
      <header className={`topbar ${tab ? "tab" : "stack"}`}>
        {tab ? (
          <Link className="brand" to="/">
            <div className="mark">ר</div>
            <div>
              <h1>{title}</h1>
              {loc.pathname === "/" ? <p>{t(lang, "tagline")}</p> : null}
            </div>
          </Link>
        ) : (
          <>
            <button type="button" className="back-btn" onClick={goBack} aria-label={t(lang, "back")}>
              <span className="chev" aria-hidden>
                ‹
              </span>
            </button>
            <h1 className="nav-title">{title}</h1>
          </>
        )}
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
          {({ isActive }) => (
            <>
              <span className="ico">
                <HomeIcon filled={isActive} />
              </span>
              {t(lang, "home")}
            </>
          )}
        </NavLink>
        <NavLink to="/food" className={() => (foodOn ? "on" : "")}>
          <span className="ico">
            <FoodIcon filled={foodOn} />
          </span>
          {t(lang, "food")}
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => (isActive ? "on" : "")}>
          {({ isActive }) => (
            <>
              <span className="ico">
                <SearchIcon filled={isActive} />
              </span>
              {t(lang, "search")}
            </>
          )}
        </NavLink>
        <NavLink to="/saved" className={({ isActive }) => (isActive ? "on" : "")}>
          {({ isActive }) => (
            <>
              <span className="ico">
                <SavedIcon filled={isActive} />
              </span>
              {t(lang, "saved")}
            </>
          )}
        </NavLink>
        <NavLink to="/emergency" className={({ isActive }) => (isActive ? "on" : "")}>
          {({ isActive }) => (
            <>
              <span className="ico">
                <SosIcon filled={isActive} />
              </span>
              {t(lang, "sos")}
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
}
