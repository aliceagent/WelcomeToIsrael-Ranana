import { records } from "../lib/data";
import { RecordCard } from "../components/RecordCard";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { folderForRecord, folderLabel } from "../lib/directory";
import type { Resource } from "../lib/types";

export function FavoritesPage() {
  const { lang, favorites, notes, setNote } = useStore();
  const items = records.filter((r) => favorites.has(r.record_id));

  // Group saved cards by their best folder so a long list stays scannable.
  const groups = new Map<string, { label: string; icon: string; items: Resource[] }>();
  for (const r of items) {
    const folder = folderForRecord(r);
    const key = folder?.id ?? "other";
    const entry = groups.get(key) ?? {
      label: folder ? folderLabel(folder, lang) : t(lang, "moreComing"),
      icon: folder?.icon ?? "⭐",
      items: [],
    };
    entry.items.push(r);
    groups.set(key, entry);
  }

  return (
    <div>
      <h1 className="chrome-title">{t(lang, "saved")}</h1>
      {items.length === 0 ? <div className="empty">{t(lang, "noFavorites")}</div> : null}
      {[...groups.values()].map((group) => (
        <section key={group.label}>
          {groups.size > 1 ? (
            <div className="section-head">
              <h2>
                <span aria-hidden="true">{group.icon} </span>
                {group.label}
              </h2>
            </div>
          ) : null}
          {group.items.map((r) => (
            <div key={r.record_id} className="fav-entry">
              <RecordCard r={r} />
              <input
                className="fav-note"
                value={notes[r.record_id] || ""}
                onChange={(e) => setNote(r.record_id, e.target.value)}
                placeholder={t(lang, "addNote")}
                aria-label={t(lang, "notes")}
              />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
