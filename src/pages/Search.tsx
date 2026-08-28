import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { records } from "../lib/data";
import { buildSearch, liveLookupRecords, searchWithMeta } from "../lib/search";
import { RecordCard } from "../components/RecordCard";
import { NeedChips } from "../components/NeedChips";
import { SearchBox } from "../components/SearchBox";
import { AskIcon } from "../components/Icons";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { matchNeed, needLabel, suggestNeeds } from "../lib/needs";
import { absoluteUrl, shareContent, whatsappShareUrl } from "../lib/share";
import { openState } from "../lib/hours";
import type { Resource } from "../lib/types";

buildSearch(records);

const PAGE = 30;
const RECENT_KEY = "raanana.recentSearches";
const RECENT_MAX = 8;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* per-device convenience only */
  }
}

export function SearchPage() {
  const { lang } = useStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [limit, setLimit] = useState(PAGE);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const [shareMsg, setShareMsg] = useState("");
  const latestQ = useRef(q);

  function remember(query: string) {
    const next = query.trim();
    if (!next) return;
    setRecent((prev) => {
      const merged = [next, ...prev.filter((p) => p.toLowerCase() !== next.toLowerCase())].slice(0, RECENT_MAX);
      saveRecent(merged);
      return merged;
    });
  }

  function updateQuery(next: string) {
    setQ(next);
    latestQ.current = next;
    // The URL always mirrors the query, so any results view is shareable.
    setParams(next.trim() ? { q: next.trim() } : {}, { replace: true });
  }

  useEffect(() => {
    const fromUrl = params.get("q") || "";
    if (fromUrl && fromUrl !== q) {
      setQ(fromUrl);
      latestQ.current = fromUrl;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only hydrate from the URL
  }, [params]);

  useEffect(() => {
    setLimit(PAGE);
  }, [q]);

  // Leaving the page (usually by tapping a result) keeps the query in Recent.
  useEffect(() => {
    return () => {
      const query = latestQ.current.trim();
      if (!query) return;
      const list = readRecent();
      saveRecent([query, ...list.filter((p) => p.toLowerCase() !== query.toLowerCase())].slice(0, RECENT_MAX));
    };
  }, []);

  const { records: results, loose } = useMemo(
    () => (q.trim() ? searchWithMeta(q) : { records: [] as Resource[], loose: false }),
    [q],
  );
  const live = useMemo(() => {
    if (!q.trim()) return [];
    // Close matches are not an answer, so the live directories stay on offer.
    return liveLookupRecords(q, loose ? 0 : results.length).filter(
      (r) => !results.some((x) => x.record_id === r.record_id || (x.name_en && x.name_en === r.name_en)),
    );
  }, [q, results, loose]);
  const { openNow, rest } = useMemo(() => {
    const open: Resource[] = [];
    const other: Resource[] = [];
    for (const r of results) {
      const state = openState(r);
      (state === "open" || state === "always" ? open : other).push(r);
    }
    return { openNow: open, rest: other };
  }, [results]);
  const need = q.trim() ? matchNeed(q, lang) : undefined;
  const shareUrl = absoluteUrl(`/search?q=${encodeURIComponent(q.trim())}`);
  const shareTitle = `"${q.trim()}" — ${t(lang, "appName")}`;
  const shareText = `${results.length} ${t(lang, "results")}`;

  return (
    <div>
      <SearchBox value={q} onChange={updateQuery} placeholder={t(lang, "searchHint")} onSubmit={() => remember(q)} sticky />

      {!q.trim() ? (
        <>
          <p className="muted">{t(lang, "searchEmpty")}</p>
          {recent.length ? (
            <div className="recent-block">
              <div className="section-head tight">
                <h2>{t(lang, "recentSearches")}</h2>
                <button
                  type="button"
                  className="recent-clear"
                  onClick={() => {
                    setRecent([]);
                    saveRecent([]);
                  }}
                >
                  {t(lang, "clearSearch")}
                </button>
              </div>
              <div className="filters">
                {recent.map((r) => (
                  <button key={r} type="button" onClick={() => updateQuery(r)}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
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
          <div className="result-bar">
            <span className="muted">
              {results.length} {t(lang, "results")}
            </span>
            {results.length ? (
              <span className="result-share">
                <button
                  type="button"
                  className="btn small"
                  onClick={async () => {
                    remember(q);
                    const res = await shareContent(shareTitle, shareText, shareUrl);
                    if (res === "copied") setShareMsg(t(lang, "copied"));
                  }}
                >
                  {t(lang, "share")}
                </button>
                <a className="wa-text" href={whatsappShareUrl(shareTitle, shareUrl, shareText)} target="_blank" rel="noreferrer">
                  {t(lang, "whatsapp")}
                </a>
                {shareMsg ? <span className="muted">{shareMsg}</span> : null}
              </span>
            ) : null}
          </div>

          {loose ? <div className="banner">{t(lang, "closeMatches")}</div> : null}

          {results.length === 0 ? (
            <div className="no-results">
              <div className="no-results-ico" aria-hidden="true">
                🔍
              </div>
              <h2>{t(lang, "noResultsFor").replace("{q}", q.trim())}</h2>
              <p className="muted">{t(lang, "noResults")}</p>
              <p className="try-label">{t(lang, "tryInstead")}</p>
              <div className="try-chips">
                {suggestNeeds(q, lang).map((n) => (
                  <Link className="need-chip" key={n.id} to={n.to}>
                    <span className="need-ico" aria-hidden="true">{n.icon}</span>
                    {needLabel(n, lang)}
                  </Link>
                ))}
                <Link className="need-chip ask" to={`/ask?q=${encodeURIComponent(q.trim())}`}>
                  <span className="need-ico" aria-hidden="true">
                    <AskIcon size={20} />
                  </span>
                  {t(lang, "askHelperCta")}
                </Link>
              </div>
            </div>
          ) : (
            <>
              {openNow.length ? (
                <>
                  <div className="section-head tight">
                    <h2>
                      <span className="open-dot" aria-hidden="true" /> {t(lang, "openNow")} ({openNow.length})
                    </h2>
                  </div>
                  {openNow.map((r) => (
                    <RecordCard key={r.record_id} r={r} />
                  ))}
                  <div className="section-head tight">
                    <h2>{t(lang, "allResults")}</h2>
                  </div>
                </>
              ) : null}
              {rest.slice(0, limit).map((r) => {
                const closed = openState(r) === "closed";
                return (
                  <div key={r.record_id} className={closed ? "closed-wrap" : undefined}>
                    <RecordCard r={r} />
                  </div>
                );
              })}
              {rest.length > limit ? (
                <div className="actions" style={{ justifyContent: "center" }}>
                  <button className="btn" onClick={() => setLimit((n) => n + PAGE)}>
                    {t(lang, "showMore")} ({rest.length - limit})
                  </button>
                </div>
              ) : null}
            </>
          )}

          {live.length ? (
            <>
              <div className="section-head tight">
                <h2>{t(lang, "tryLive")}</h2>
              </div>
              <p className="muted">{t(lang, "tryLiveHelp")}</p>
              {live.map((r) => (
                <RecordCard key={r.record_id} r={r} compact />
              ))}
            </>
          ) : null}

          {results.length ? (
            <p>
              <Link className="need-chip inline" to={`/ask?q=${encodeURIComponent(q.trim())}`}>
                <span className="need-ico" aria-hidden="true">
                  <AskIcon size={20} />
                </span>
                {t(lang, "askHelperCta")}
              </Link>
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
