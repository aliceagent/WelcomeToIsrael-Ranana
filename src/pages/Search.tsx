import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { records } from "../lib/data";
import { buildSearch, searchRecords } from "../lib/search";
import { RecordCard } from "../components/RecordCard";
import { NeedChips } from "../components/NeedChips";
import { AskIcon, SearchIcon } from "../components/Icons";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { matchNeed, needLabel } from "../lib/needs";

buildSearch(records);

const PAGE = 30;

export function SearchPage() {
  const { lang } = useStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    const fromUrl = params.get("q") || "";
    if (fromUrl && fromUrl !== q) setQ(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only hydrate from the URL
  }, [params]);

  useEffect(() => {
    setLimit(PAGE);
  }, [q]);

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
        <SearchIcon size={22} />
        <input
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
                <span className="need-ico" aria-hidden="true">{need.icon}</span> {t(lang, "seeFolder")} {needLabel(need, lang)}
              </Link>
            </p>
          ) : null}
          <p className="muted">
            {results.length} {t(lang, "results")}
          </p>
          {results.length === 0 ? <div className="empty">{t(lang, "noResults")}</div> : null}
          {results.slice(0, limit).map((r) => (
            <RecordCard key={r.record_id} r={r} />
          ))}
          {results.length > limit ? (
            <div className="actions" style={{ justifyContent: "center" }}>
              <button className="btn" onClick={() => setLimit((n) => n + PAGE)}>
                {t(lang, "showMore")} ({results.length - limit})
              </button>
            </div>
          ) : null}
          <p>
            <Link className="need-chip inline" to={`/ask?q=${encodeURIComponent(q.trim())}`}>
              <span className="need-ico" aria-hidden="true">
                <AskIcon size={20} />
              </span>
              {t(lang, "askHelperCta")}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
