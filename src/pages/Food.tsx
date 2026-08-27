import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RecordCard } from "../components/RecordCard";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { foodAllFolders, folderCount, folderLabel, isFoodRecord, sortDirectory } from "../lib/directory";
import { records } from "../lib/data";
import { SearchIcon } from "../components/Icons";
import { buildSearch, searchRecords } from "../lib/search";

buildSearch(records);

export function FoodPage() {
  const { lang } = useStore();
  const [q, setQ] = useState("");
  const folders = foodAllFolders();

  const results = useMemo(() => {
    const query = q.trim();
    if (query) return searchRecords(query).filter(isFoodRecord).slice(0, 40);
    return records.filter(isFoodRecord).sort(sortDirectory).slice(0, 12);
  }, [q]);

  return (
    <div>
      <h1 className="chrome-title">{t(lang, "food")}</h1>
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
      {results.map((r) => (
        <RecordCard key={r.record_id} r={r} compact />
      ))}
    </div>
  );
}
