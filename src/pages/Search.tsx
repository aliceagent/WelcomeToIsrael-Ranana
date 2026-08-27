import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { records } from "../lib/data";
import { buildSearch, searchRecords } from "../lib/search";
import { RecordCard } from "../components/RecordCard";
import { NeedChips } from "../components/NeedChips";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { matchNeed, needLabel } from "../lib/needs";

buildSearch(records);

export function SearchPage() {
  const { lang } = useStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");

  useEffect(() => {
    const fromUrl = params.get("q") || "";
    if (fromUrl && fromUrl !== q) setQ(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only hydrate from the URL
  }, [params]);

  const results = useMemo(() => (q.trim() ? searchRecords(q) : []), [q]);
  const need = q.trim() ? matchNeed(q, lang) : undefined;

  return (
    <div>
      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(q.trim() ? { q: q.trim() } : {});
        }}
      >
        <span>⌕</span>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(lang, "searchHint")}
          aria-label={t(lang, "search")}
        />
      </form>

      {!q.trim() ? (
        <>
          <p className="muted">{t(lang, "searchEmpty")}</p>
          <NeedChips />
        </>
      ) : (
        <>
          {need ? (
            <p>
              <Link className="need-chip inline" to={need.to}>
                {need.icon} {t(lang, "seeFolder")} {needLabel(need, lang)}
              </Link>
            </p>
          ) : null}
          <p className="muted">
            {results.length} {t(lang, "results")}
          </p>
          {results.length === 0 ? <div className="empty">{t(lang, "noResults")}</div> : null}
          {results.slice(0, 60).map((r) => (
            <RecordCard key={r.record_id} r={r} />
          ))}
        </>
      )}
    </div>
  );
}
