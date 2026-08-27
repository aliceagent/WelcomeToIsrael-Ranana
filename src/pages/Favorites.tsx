import { records } from "../lib/data";
import { RecordCard } from "../components/RecordCard";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";

export function FavoritesPage() {
  const { lang, favorites } = useStore();
  const items = records.filter((r) => favorites.has(r.record_id));
  return (
    <div>
      <h1 style={{ fontFamily: "var(--display)" }}>{t(lang, "favorites")}</h1>
      {items.length === 0 ? <div className="empty">{t(lang, "noFavorites")}</div> : items.map((r) => <RecordCard key={r.record_id} r={r} />)}
    </div>
  );
}
