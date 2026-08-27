import { useMemo, useState } from "react";
import { records } from "../lib/data";
import { buildSearch, searchRecords } from "../lib/search";
import { RecordCard } from "../components/RecordCard";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";

buildSearch(records);

export function SearchPage() {
  const { lang } = useStore();
  const [q, setQ] = useState("");
  const results = useMemo(() => (q.trim() ? searchRecords(q) : []), [q]);

  return (
    <div>
      <form className="search" onSubmit={(e) => e.preventDefault()}>
        <span>⌕</span>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(lang, "searchHint")}
          aria-label={t(lang, "search")}
        />
      </form>
      <p className="muted">
        {q.trim() ? `${results.length} ${t(lang, "results")}` : t(lang, "searchHint")}
      </p>
      {q.trim() && results.length === 0 ? <div className="empty">{t(lang, "noResults")}</div> : null}
      {results.slice(0, 60).map((r) => (
        <RecordCard key={r.record_id} r={r} />
      ))}
    </div>
  );
}
