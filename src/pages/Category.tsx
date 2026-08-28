import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { byCategory, categoryFromSlug } from "../lib/data";
import { RecordCard } from "../components/RecordCard";
import { useStore } from "../lib/store";
import { t, categoryLabel } from "../lib/i18n";
import { CATEGORY_ICONS, priorityScore, slugifyCategory } from "../lib/format";
import { shareContent, whatsappShareUrl, categoryPath, absoluteUrl } from "../lib/share";
import { openState } from "../lib/hours";

export function CategoryPage() {
  const { slug } = useParams();
  const { lang } = useStore();
  const category = slug ? categoryFromSlug(slug) : undefined;
  const [raanana, setRaanana] = useState(false);
  const [physical, setPhysical] = useState(false);
  const [near, setNear] = useState(true);
  const [type, setType] = useState("all");
  const [msg, setMsg] = useState("");

  const items = useMemo(() => {
    if (!category) return [];
    let list = byCategory(category);
    if (raanana) list = list.filter((r) => r.is_raanana);
    if (physical) list = list.filter((r) => r.is_physical_location);
    if (type !== "all") list = list.filter((r) => r.record_type === type);
    list = [...list].sort((a, b) => {
      if (near) {
        const da = a.distance_from_home_km_est ?? 999;
        const db = b.distance_from_home_km_est ?? 999;
        if (da !== db) return da - db;
      }
      return priorityScore(b.priority) - priorityScore(a.priority);
    });
    return list;
  }, [category, raanana, physical, near, type]);

  if (!slug) return <Navigate to="/" replace />;
  if (!category) return <div className="empty">{t(lang, "noResults")}</div>;

  const types = [...new Set(byCategory(category).map((r) => r.record_type))];
  const url = absoluteUrl(categoryPath(category));

  return (
    <div>
      <h1 className="chrome-title">
        {CATEGORY_ICONS[category]} {categoryLabel(lang, category)}
      </h1>
      <p className="muted">
        {items.length} {t(lang, "results")}
      </p>
      <div className="filters">
        <button aria-pressed={raanana} className={raanana ? "on" : ""} onClick={() => setRaanana((v) => !v)}>
          {t(lang, "raananaOnly")}
        </button>
        <button aria-pressed={physical} className={physical ? "on" : ""} onClick={() => setPhysical((v) => !v)}>
          {t(lang, "physicalOnly")}
        </button>
        <button aria-pressed={near} className={near ? "on" : ""} onClick={() => setNear((v) => !v)}>
          {t(lang, "sortNear")}
        </button>
        {types.length > 1 ? (
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label={t(lang, "browseType")}>
            <option value="all">{t(lang, "any")}</option>
            {types.map((tp) => (
              <option key={tp} value={tp}>
                {tp}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <div className="actions" style={{ marginBottom: 12 }}>
        <button
          className="btn"
          onClick={async () => {
            const shareText = t(lang, "browseCategoryShare").replace("{name}", categoryLabel(lang, category));
            const res = await shareContent(categoryLabel(lang, category), shareText, url, `/og/c/${slugifyCategory(category)}.png`);
            if (res === "copied") setMsg(t(lang, "copied"));
          }}
        >
          {t(lang, "shareCategory")}
        </button>
        <a
          className="wa-text"
          href={whatsappShareUrl(categoryLabel(lang, category), url, t(lang, "browseCategoryShare").replace("{name}", categoryLabel(lang, category)))}
        >
          {t(lang, "whatsapp")}
        </a>
        {msg ? <span className="muted">{msg}</span> : null}
      </div>
      {category === "Safety & Public Shelters" ? <div className="banner warn">{t(lang, "shelterCaveat")}</div> : null}
      {items.map((r) => {
        const closed = openState(r) === "closed";
        return (
          <div key={r.record_id} className={closed ? "closed-wrap" : undefined}>
            <RecordCard r={r} />
          </div>
        );
      })}
    </div>
  );
}
