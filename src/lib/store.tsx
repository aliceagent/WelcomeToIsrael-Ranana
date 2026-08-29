import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { HomePin, Lang } from "./types";
import meta from "../data/meta.json";

const LANG_KEY = "raanana.lang";
const FAV_KEY = "raanana.favs";
const CHECK_KEY = "raanana.checks";
const HOME_KEY = "raanana.home";
const ADDRESS_KEY = "raanana.address";
const NOTES_KEY = "raanana.notes";

type Store = {
  lang: Lang;
  setLang: (l: Lang) => void;
  favorites: Set<string>;
  toggleFav: (id: string) => void;
  /** Personal notes on saved cards ("our pediatrician"), by record id. */
  notes: Record<string, string>;
  setNote: (id: string, note: string) => void;
  checks: Set<string>;
  toggleCheck: (id: string) => void;
  home: HomePin;
  setHome: (p: HomePin) => void;
  resetHome: () => void;
  /** Street address for the SOS "read this out" card; stays on this phone. */
  address: string;
  setAddress: (a: string) => void;
  /** Merge a family-export payload from another phone; local values win. */
  mergeImport: (data: FamilyExport) => void;
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

export type FamilyExport = {
  v?: number;
  favs?: unknown;
  notes?: unknown;
  checks?: unknown;
  address?: unknown;
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

/**
 * The address is always plain text, but was read with readJson()'s
 * JSON.parse — so a value seeded directly (e.g. localStorage.setItem, not
 * through this store's own JSON.stringify write path) isn't valid JSON,
 * JSON.parse throws, and the initializer silently fell back to "". The
 * write-back effect below then persisted that "" over the pre-existing
 * value on the very next render, permanently wiping it. Fall back to the
 * raw string instead of discarding it when it isn't JSON.
 */
function readStoredAddress(): string {
  try {
    const raw = localStorage.getItem(ADDRESS_KEY);
    if (raw == null) return "";
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "string") return parsed;
    } catch {
      // Not JSON-encoded — use the raw value verbatim rather than wiping it.
    }
    return raw;
  } catch {
    return "";
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readJson(LANG_KEY, "en"));
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(readJson<string[]>(FAV_KEY, [])));
  const [checks, setChecks] = useState<Set<string>>(() => new Set(readJson<string[]>(CHECK_KEY, [])));
  const [home, setHomeState] = useState<HomePin>(() =>
    readJson(HOME_KEY, { lat: meta.home_default.lat, lng: meta.home_default.lng }),
  );
  const [address, setAddress] = useState<string>(readStoredAddress);
  const [notes, setNotes] = useState<Record<string, string>>(() => readJson(NOTES_KEY, {}));
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
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
  }, [address]);
  useEffect(() => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

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
      notes,
      setNote: (id, note) =>
        setNotes((prev) => {
          const next = { ...prev };
          if (note.trim()) next[id] = note;
          else delete next[id];
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
      address,
      setAddress,
      mergeImport: (data) => {
        if (Array.isArray(data.favs)) {
          const incoming = data.favs.filter((x): x is string => typeof x === "string");
          setFavorites((prev) => new Set([...prev, ...incoming]));
        }
        if (Array.isArray(data.checks)) {
          const incoming = data.checks.filter((x): x is string => typeof x === "string");
          setChecks((prev) => new Set([...prev, ...incoming]));
        }
        if (data.notes && typeof data.notes === "object") {
          const incoming: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.notes as Record<string, unknown>)) {
            if (typeof v === "string") incoming[k] = v;
          }
          setNotes((prev) => ({ ...incoming, ...prev }));
        }
        if (typeof data.address === "string" && data.address) {
          setAddress((prev) => prev || (data.address as string));
        }
      },
      gps,
      setGps,
      useGps,
      setUseGps,
      origin,
      originIsGps,
      originIsDefault,
      online,
    }),
    [lang, favorites, notes, checks, home, address, gps, useGps, origin, originIsGps, originIsDefault, online],
  );

  return createElement(Ctx.Provider, { value }, children);
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}
