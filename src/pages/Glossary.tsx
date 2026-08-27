import { useMemo, useState } from "react";
import { byType } from "../lib/data";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { displayDescription, displayName } from "../lib/format";
import { Link } from "react-router-dom";
import { recordPath } from "../lib/share";

export function GlossaryPage() {
  const { lang } = useStore();
  const [q, setQ] = useState("");
  const items = useMemo(() => {
    const all = byType("glossary_term");
    const n = q.trim().toLowerCase();
    if (!n) return all;
    return all.filter((r) =>
      [r.name_en, r.name_he, r.name_fr, r.search_text].join(" ").toLowerCase().includes(n),
    );
  }, [q]);
  return (
    <div>
      <h1 className="chrome-title">{t(lang, "glossary")}</h1>
      <form className="search" onSubmit={(e) => e.preventDefault()}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, "searchHint")} />
      </form>
      {items.map((r) => (
        <Link className="card" key={r.record_id} to={recordPath(r)}>
          <div className="glossary-he" style={{ fontSize: "1.6rem" }}>
            {r.name_he}
          </div>
          <h3>{displayName(r, lang)}</h3>
          <p className="muted" style={{ margin: 0 }}>
            {displayDescription(r, lang)}
          </p>
        </Link>
      ))}
    </div>
  );
}
