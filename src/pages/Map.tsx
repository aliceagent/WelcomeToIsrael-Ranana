import { useMemo, useState } from "react";
import { physicalRecords, records, getById } from "../lib/data";
import { PlacesMapLazy } from "../components/PlacesMapLazy";
import { RecordCard } from "../components/RecordCard";
import { NearMeToggle } from "../components/NearMeToggle";
import { SearchBox } from "../components/SearchBox";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { effectiveKm } from "../lib/geo";
import { buildSearch, searchRecords } from "../lib/search";
import { getMapCategory, MAP_ROWS } from "../lib/mapview";
import { openState } from "../lib/hours";

buildSearch(records);

const PAGE = 20;

export function MapPage() {
  const { lang, online, origin, originIsDefault } = useStore();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [openOnly, setOpenOnly] = useState(false);

  const places = useMemo(() => {
    const base = q.trim()
      ? searchRecords(q).filter((r) => r.is_physical_location && r.latitude_est != null && r.longitude_est != null)
      : physicalRecords;
    const category = cat === "all" ? undefined : getMapCategory(cat);
    let list = category ? base.filter(category.match) : base;
    if (openOnly) {
      list = list.filter((r) => {
        const state = openState(r);
        return state === "open" || state === "always";
      });
    }
    return list;
  }, [cat, q, openOnly]);

  // How many mappable places each section holds; empty sections hide.
  const counts = useMemo(() => {
    const tally = new Map<string, number>();
    for (const row of MAP_ROWS) {
      for (const id of row) {
        const category = getMapCategory(id);
        if (category) tally.set(id, physicalRecords.filter(category.match).length);
      }
    }
    return tally;
  }, []);

  const nearest = useMemo(
    () =>
      [...places].sort(
        (a, b) =>
          (effectiveKm(a, origin, originIsDefault) ?? 99) - (effectiveKm(b, origin, originIsDefault) ?? 99),
      ),
    [places, origin, originIsDefault],
  );

  const selectedRecord = selected ? getById(selected) : undefined;

  function pick(id: string) {
    setSelected((prev) => (prev === id ? null : id));
  }

  return (
    <div>
      <h1 className="chrome-title">{t(lang, "map")}</h1>
      <SearchBox
        value={q}
        onChange={(next) => {
          setQ(next);
          setSelected(null);
          setLimit(PAGE);
        }}
        placeholder={t(lang, "searchHint")}
      />
      {MAP_ROWS.map((row, i) => (
        <div className="filters map-filters" key={i}>
          {i === 0 ? (
            <>
              <NearMeToggle />
              <button aria-pressed={openOnly} className={openOnly ? "on" : ""} onClick={() => setOpenOnly((v) => !v)}>
                {t(lang, "openNow")}
              </button>
              <button aria-pressed={cat === "all"} className={cat === "all" ? "on" : ""} onClick={() => { setCat("all"); setSelected(null); setLimit(PAGE); }}>
                {t(lang, "any")}
              </button>
            </>
          ) : null}
          {row.map((id) => {
            const c = getMapCategory(id);
            if (!c || !(counts.get(id) ?? 0)) return null;
            return (
              <button
                key={c.id}
                aria-pressed={cat === c.id}
                className={cat === c.id ? "on" : ""}
                onClick={() => {
                  setCat((prev) => (prev === c.id ? "all" : c.id));
                  setSelected(null);
                  setLimit(PAGE);
                }}
              >
                <span className="cat-dot" style={{ background: c.color }} aria-hidden="true">
                  {c.icon}
                </span>
                {c.label(lang)}
                <span className="cat-count">{counts.get(id)}</span>
              </button>
            );
          })}
        </div>
      ))}
      {cat === "shelters" ? <div className="banner warn">{t(lang, "shelterCaveat")}</div> : null}
      {online ? (
        <PlacesMapLazy places={places} selectedId={selected} onSelect={pick} tall />
      ) : (
        <div className="banner off">{t(lang, "mapsNeedNetwork")}</div>
      )}

      {selectedRecord ? (
        <div className="map-selected">
          <RecordCard r={selectedRecord} />
        </div>
      ) : null}

      <p className="muted">
        {places.length} {t(lang, "results")}
      </p>
      {nearest.slice(0, limit).map((r) => (
        <div className="map-row" key={r.record_id}>
          <RecordCard r={r} compact />
          <button
            type="button"
            className="locate-btn"
            aria-label={t(lang, "showOnMap")}
            onClick={() => {
              setSelected(r.record_id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <span aria-hidden="true">📍</span>
          </button>
        </div>
      ))}
      {nearest.length > limit ? (
        <div className="actions" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={() => setLimit((n) => n + PAGE)}>
            {t(lang, "showMore")} ({nearest.length - limit})
          </button>
        </div>
      ) : null}
    </div>
  );
}
