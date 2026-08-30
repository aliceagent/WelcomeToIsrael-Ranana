import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import type { Lang } from "../lib/types";
import { getFolder } from "../lib/directory";
import { fallbackParent, isTabPath, useChromeTitle } from "../lib/nav";
import { FoodIcon, HomeIcon, SavedIcon, SearchIcon, SosIcon } from "./Icons";
import { Onboarding } from "./Onboarding";
import { InstallNudge } from "./InstallNudge";
import { initStats } from "../lib/appstats";

const LANGS: Lang[] = ["en", "fr", "he"];

function scrollToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/**
 * Scroll position per history entry (react-router's location.key), so a
 * folder list scrolled down and reopened via back lands where it was. This
 * app uses a plain <BrowserRouter> (no data router), so there's no built-in
 * <ScrollRestoration> to lean on — and the browser's own automatic
 * per-entry scroll memory is unreliable here (it snapshots on its own
 * schedule, which a same-tick pushState navigation right after scrolling
 * can outrun), so it's tracked explicitly instead. Module-level: Layout
 * mounts once for the app's lifetime, so this is effectively a singleton.
 */
const scrollPositions = new Map<string, number>();

export function Layout() {
  const { lang, setLang, online } = useStore();
  const loc = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const title = useChromeTitle();
  const folder = loc.pathname.startsWith("/d/") ? getFolder(loc.pathname.slice(3)) : undefined;
  const foodOn = loc.pathname === "/food" || folder?.group === "food";
  const tab = isTabPath(loc.pathname);

  useEffect(() => {
    initStats();
  }, []);

  useEffect(() => {
    if (loc.hash) {
      const el = document.getElementById(decodeURIComponent(loc.hash.slice(1)));
      if (el) {
        el.scrollIntoView();
        document.getElementById("main")?.focus({ preventScroll: true });
        return;
      }
    }
    // Land screen-reader/keyboard focus on the new page's content.
    document.getElementById("main")?.focus({ preventScroll: true });
    // POP (back/forward) restores the scroll position this same history
    // entry had before we left it — a folder scrolled down, then opened
    // into a record, is back where it was on return. Only forward
    // (PUSH/REPLACE) navigation forces the new page to the top.
    if (navType === "POP") {
      const saved = scrollPositions.get(loc.key);
      if (saved == null) return;
      // The new route's content (and its real scrollable height) isn't
      // painted yet on this same tick — wait a frame before restoring.
      const frame = requestAnimationFrame(() => window.scrollTo(0, saved));
      return () => cancelAnimationFrame(frame);
    }
    scrollToTop();
    const frame = requestAnimationFrame(scrollToTop);
    return () => cancelAnimationFrame(frame);
    // Deps are the PAGE identity only — never loc.key: typing in the search
    // box replace-navigates on every keystroke (same pathname, new key), and
    // re-running this effect then would steal focus from the input (closing
    // the phone keyboard after one character) and force-scroll to top.
    // navType/loc.key are read but only ever change alongside a pathname
    // change we care about.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, loc.hash]);

  // Keep the current history entry's remembered scroll position fresh as
  // the user scrolls, so it's ready if they later come back via POP.
  // Deliberately *not* also recorded once more on cleanup: React commits
  // the new route's DOM before running this cleanup, so by then
  // window.scrollY already reflects the *next* (often shorter) page —
  // often already auto-clamped down by the browser — not the position
  // being left. The live listener alone is sufficient: every scroll fires
  // it, so the map is never behind by more than the scroll that's
  // currently in flight.
  useEffect(() => {
    const key = loc.key;
    const record = () => scrollPositions.set(key, window.scrollY);
    window.addEventListener("scroll", record, { passive: true });
    return () => window.removeEventListener("scroll", record);
  }, [loc.key]);

  function goBack() {
    if (loc.key !== "default") navigate(-1);
    else navigate(fallbackParent(loc.pathname));
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        {t(lang, "skipToContent")}
      </a>
      <Onboarding />
      <InstallNudge />
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
            <button key={l} lang={l} aria-pressed={l === lang} className={l === lang ? "on" : ""} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      {!online && <div className="banner off">{t(lang, "offline")}</div>}
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
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
