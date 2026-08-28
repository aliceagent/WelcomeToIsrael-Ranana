import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RecordCard } from "../components/RecordCard";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { foodAllFolders, folderCount, folderLabel, isFoodRecord, directorySorter } from "../lib/directory";
import { effectiveKm } from "../lib/geo";
import type { Resource } from "../lib/types";
import { records } from "../lib/data";
import { SearchIcon } from "../components/Icons";
import { ShabbatBanner } from "../components/ShabbatBanner";
import { buildSearch, searchRecords } from "../lib/search";

buildSearch(records);

export function FoodPage() {
  const { lang, origin, originIsDefault } = useStore();
  const [q, setQ] = useState("");
  const folders = foodAllFolders();

  const [limit, setLimit] = useState(12);
  const results = useMemo(() => {
    const query = q.trim();
    if (query) return searchRecords(query).filter(isFoodRecord);
    const kmOf = (r: Resource) => effectiveKm(r, origin, originIsDefault);
    return records.filter(isFoodRecord).sort(directorySorter(kmOf));
  }, [q, origin, originIsDefault]);

  useEffect(() => {
    setLimit(12);
  }, [q]);

  return (
    <div>
      <h1 className="chrome-title">{t(lang, "food")}</h1>
      <ShabbatBanner />
      <form className="search" onSubmit={(e) => e.preventDefault()}>
        <SearchIcon size={22} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(lang, "foodSearchHint")}
          aria-label={t(lang, "search")}
        />
      </form>

      <div className="food-grid" style={{ marginTop: 14 }}>
        {folders.map((f) => (
          <Link className="food-tile" key={f.id} to={`/d/${f.id}`}>
            <span className="emoji">{f.icon}</span>
            <strong>{folderLabel(f, lang)}</strong>
            <span className="count">{folderCount(f)}</span>
          </Link>
        ))}
      </div>

      <div className="section-head">
        <h2>{q.trim() ? t(lang, "results") : t(lang, "nearbyFood")}</h2>
        {!q.trim() ? <Link to="/d/food">{t(lang, "seeAll")}</Link> : null}
      </div>
      {results.length === 0 ? <div className="empty">{t(lang, "noResults")}</div> : null}
      {results.slice(0, limit).map((r) => (
        <RecordCard key={r.record_id} r={r} compact />
      ))}
      {results.length > limit ? (
        <div className="actions" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={() => setLimit((n) => n + 12)}>
            {t(lang, "showMore")} ({results.length - limit})
          </button>
        </div>
      ) : null}
    </div>
  );
}
