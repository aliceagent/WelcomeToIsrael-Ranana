import { byType, getById } from "../lib/data";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { descriptionDir, displayDescription, displayName } from "../lib/format";
import { Link } from "react-router-dom";
import { recordPath } from "../lib/share";
import { JOURNEYS, RELATED_FOLDERS, RELATED_RECORDS } from "../lib/journeys";
import { FOLDERS, folderLabel } from "../lib/directory";
import type { Resource } from "../lib/types";

export function ChecklistsPage() {
  const { lang, checks, toggleCheck } = useStore();
  const all = byType("checklist");
  const done = all.filter((i) => checks.has(i.record_id)).length;
  const grouped = new Set(JOURNEYS.flatMap((j) => j.ids));
  const leftovers = all.filter((r) => !grouped.has(r.record_id));

  function renderItem(r: Resource) {
    const related = (RELATED_RECORDS[r.record_id] || [])
      .map(getById)
      .filter((rec): rec is Resource => !!rec);
    const folders = (RELATED_FOLDERS[r.record_id] || [])
      .map((id) => FOLDERS.find((f) => f.id === id))
      .filter((f): f is (typeof FOLDERS)[number] => !!f);
    return (
      <div key={r.record_id}>
        <button className={`check-item ${checks.has(r.record_id) ? "done" : ""}`} onClick={() => toggleCheck(r.record_id)}>
          <span className="box">{checks.has(r.record_id) ? "✓" : ""}</span>
          <span>
            <strong>{displayName(r, lang)}</strong>
            <div className="muted" dir={descriptionDir(r, lang)}>{displayDescription(r, lang)}</div>
          </span>
        </button>
        <div className="check-links">
          {related.map((rec) => (
            <Link className="check-link" key={rec.record_id} to={recordPath(rec)}>
              {displayName(rec, lang)}
            </Link>
          ))}
          {folders.map((f) => (
            <Link className="check-link" key={f.id} to={`/d/${f.id}`}>
              <span aria-hidden="true">{f.icon} </span>
              {folderLabel(f, lang)}
            </Link>
          ))}
          <Link className="check-link details" to={recordPath(r)}>
            {t(lang, "details")} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="chrome-title">{t(lang, "checklists")}</h1>
      <p className="muted">
        {done}/{all.length} {t(lang, "progress")}
      </p>
      {JOURNEYS.map((j) => {
        const items = j.ids.map(getById).filter((r): r is Resource => !!r);
        if (!items.length) return null;
        const jDone = items.filter((r) => checks.has(r.record_id)).length;
        return (
          <section key={j.id}>
            <div className="section-head">
              <h2>
                <span aria-hidden="true">{j.icon} </span>
                {j.title[lang]}
              </h2>
              <span className="muted">
                {jDone}/{items.length}
              </span>
            </div>
            {items.map(renderItem)}
          </section>
        );
      })}
      {leftovers.length ? (
        <section>
          <div className="section-head">
            <h2>{t(lang, "moreComing")}</h2>
          </div>
          {leftovers.map(renderItem)}
        </section>
      ) : null}
    </div>
  );
}
