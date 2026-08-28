import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { HomePin, Lang } from "./types";
import meta from "../data/meta.json";

const LANG_KEY = "raanana.lang";
const FAV_KEY = "raanana.favs";
const CHECK_KEY = "raanana.checks";
const HOME_KEY = "raanana.home";

type Store = {
  lang: Lang;
  setLang: (l: Lang) => void;
  favorites: Set<string>;
  toggleFav: (id: string) => void;
  checks: Set<string>;
  toggleCheck: (id: string) => void;
  home: HomePin;
  setHome: (p: HomePin) => void;
  resetHome: () => void;
  /** Device location, session-only — never persisted. */
  gps: HomePin | null;
  setGps: (p: HomePin | null) => void;
  useGps: boolean;
  setUseGps: (v: boolean) => void;
  /** Active measuring point: device location when enabled, else the home pin. */
  origin: HomePin;
  originIsGps: boolean;
  /** True when distances can use the dataset's precomputed home estimates. */
  originIsDefault: boolean;
  online: boolean;
};

const Ctx = createContext<Store | null>(null);

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readJson(LANG_KEY, "en"));
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(readJson<string[]>(FAV_KEY, [])));
  const [checks, setChecks] = useState<Set<string>>(() => new Set(readJson<string[]>(CHECK_KEY, [])));
  const [home, setHomeState] = useState<HomePin>(() =>
    readJson(HOME_KEY, { lat: meta.home_default.lat, lng: meta.home_default.lng }),
  );
  const [gps, setGps] = useState<HomePin | null>(null);
  const [useGps, setUseGps] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    document.documentElement.lang = lang === "he" ? "he" : lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    localStorage.setItem(LANG_KEY, JSON.stringify(lang));
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
  }, [favorites]);
  useEffect(() => {
    localStorage.setItem(CHECK_KEY, JSON.stringify([...checks]));
  }, [checks]);
  useEffect(() => {
    localStorage.setItem(HOME_KEY, JSON.stringify(home));
  }, [home]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const originIsGps = useGps && gps != null;
  const origin = originIsGps && gps ? gps : home;
  const originIsDefault =
    !originIsGps &&
    Math.abs(home.lat - meta.home_default.lat) < 0.0002 &&
    Math.abs(home.lng - meta.home_default.lng) < 0.0002;

  const value = useMemo<Store>(
    () => ({
      lang,
      setLang: setLangState,
      favorites,
      toggleFav: (id) =>
        setFavorites((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      checks,
      toggleCheck: (id) =>
        setChecks((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      home,
      setHome: setHomeState,
      resetHome: () => setHomeState({ lat: meta.home_default.lat, lng: meta.home_default.lng }),
      gps,
      setGps,
      useGps,
      setUseGps,
      origin,
      originIsGps,
      originIsDefault,
      online,
    }),
    [lang, favorites, checks, home, gps, useGps, origin, originIsGps, originIsDefault, online],
  );

  return createElement(Ctx.Provider, { value }, children);
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}
