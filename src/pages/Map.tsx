import { useMemo, useState } from "react";
import { physicalRecords, records, getById } from "../lib/data";
import { PlacesMap } from "../components/PlacesMap";
import { RecordCard } from "../components/RecordCard";
import { NearMeToggle } from "../components/NearMeToggle";
import { SearchIcon } from "../components/Icons";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { effectiveKm } from "../lib/geo";
import { buildSearch, searchRecords } from "../lib/search";
import { MAP_CATEGORIES, mapCategory } from "../lib/mapview";

buildSearch(records);

const PAGE = 20;

export function MapPage() {
  const { lang, online, origin, originIsDefault } = useStore();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const places = useMemo(() => {
    const base = q.trim()
      ? searchRecords(q).filter((r) => r.is_physical_location && r.latitude_est != null && r.longitude_est != null)
      : physicalRecords;
    if (cat === "all") return base;
    return base.filter((r) => mapCategory(r).id === cat);
  }, [cat, q]);

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
      <form className="search" onSubmit={(e) => e.preventDefault()}>
        <SearchIcon size={22} />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSelected(null);
            setLimit(PAGE);
          }}
          placeholder={t(lang, "searchHint")}
          aria-label={t(lang, "search")}
        />
      </form>
      <div className="filters map-filters">
        <NearMeToggle />
        <button aria-pressed={cat === "all"} className={cat === "all" ? "on" : ""} onClick={() => { setCat("all"); setSelected(null); setLimit(PAGE); }}>
          {t(lang, "any")}
        </button>
        {MAP_CATEGORIES.map((c) => (
          <button
            key={c.id}
            aria-pressed={cat === c.id}
            className={cat === c.id ? "on" : ""}
            onClick={() => {
              setCat(c.id);
              setSelected(null);
              setLimit(PAGE);
            }}
          >
            <span className="cat-dot" style={{ background: c.color }} aria-hidden="true">
              {c.icon}
            </span>
            {c.label(lang)}
          </button>
        ))}
      </div>
      {cat === "shelters" ? <div className="banner warn">{t(lang, "shelterCaveat")}</div> : null}
      {online ? (
        <PlacesMap places={places} selectedId={selected} onSelect={pick} tall />
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
        <RecordCard key={r.record_id} r={r} compact />
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
