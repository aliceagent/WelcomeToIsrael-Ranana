import { byType } from "../lib/data";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { displayDescription, displayName, priorityScore } from "../lib/format";
import { Link } from "react-router-dom";
import { recordPath } from "../lib/share";

export function ChecklistsPage() {
  const { lang, checks, toggleCheck } = useStore();
  const items = [...byType("checklist")].sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority));
  const done = items.filter((i) => checks.has(i.record_id)).length;
  return (
    <div>
      <h1 style={{ fontFamily: "var(--display)" }}>{t(lang, "checklists")}</h1>
      <p className="muted">
        {done}/{items.length} {t(lang, "progress")}
      </p>
      {items.map((r) => (
        <div key={r.record_id}>
          <button className={`check-item ${checks.has(r.record_id) ? "done" : ""}`} onClick={() => toggleCheck(r.record_id)}>
            <span className="box">{checks.has(r.record_id) ? "✓" : ""}</span>
            <span>
              <strong>{displayName(r, lang)}</strong>
              <div className="muted">{displayDescription(r, lang)}</div>
            </span>
          </button>
          <div style={{ margin: "-4px 0 12px 36px" }}>
            <Link to={recordPath(r)}>{t(lang, "moreComing")} →</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
