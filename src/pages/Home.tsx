import { Link } from "react-router-dom";
import { meta, records, getById, physicalRecords } from "../lib/data";
import { RecordCard } from "../components/RecordCard";
import { useStore } from "../lib/store";
import { t, categoryLabel } from "../lib/i18n";
import { CATEGORY_ICONS, matchesProfile, slugifyCategory } from "../lib/format";
import { Onboarding } from "../components/Onboarding";
import type { Resource } from "../lib/types";

export function HomePage() {
  const { lang, profile } = useStore();
  const install = meta.install_first
    .map(getById)
    .filter((r): r is Resource => !!r && matchesProfile(r, profile));
  const nearby = [...physicalRecords]
    .sort((a, b) => (a.distance_from_home_km_est ?? 99) - (b.distance_from_home_km_est ?? 99))
    .slice(0, 6);
  const cats = [...meta.categories].sort(
    (a, b) => records.filter((r) => r.category === b).length - records.filter((r) => r.category === a).length,
  );

  return (
    <div>
      <Onboarding />
      <Link className="search" to="/search" style={{ marginBottom: 8 }}>
        <span>⌕</span>
        <span className="muted">{t(lang, "searchHint")}</span>
      </Link>

      <div className="hub-grid">
        <Link className="hub wide" to="/emergency">
          <span className="emoji">🚨</span>
          <strong>{t(lang, "needHelpNow")}</strong>
        </Link>
        <Link className="hub" to="/hub/arrived">
          <span className="emoji">✈️</span>
          <strong>{t(lang, "justArrived")}</strong>
        </Link>
        <Link className="hub" to="/map">
          <span className="emoji">🗺️</span>
          <strong>{t(lang, "aroundTown")}</strong>
        </Link>
        <Link className="hub" to="/hub/shopping">
          <span className="emoji">🛒</span>
          <strong>{t(lang, "shopping")}</strong>
        </Link>
        <Link className="hub" to="/hub/family">
          <span className="emoji">👨‍👩‍👧</span>
          <strong>{t(lang, "family")}</strong>
        </Link>
        <Link className="hub" to="/hub/israel" style={{ gridColumn: "1 / -1" }}>
          <span className="emoji">📖</span>
          <strong>{t(lang, "howIsrael")}</strong>
        </Link>
      </div>

      <div className="section-head">
        <h2>{t(lang, "installFirst")}</h2>
        <Link to="/c/essential-apps">{t(lang, "seeAll")}</Link>
      </div>
      {install.map((r) => (
        <RecordCard key={r.record_id} r={r} compact />
      ))}

      <div className="section-head">
        <h2>{t(lang, "nearby")}</h2>
        <Link to="/map">{t(lang, "map")}</Link>
      </div>
      {nearby.map((r) => (
        <RecordCard key={r.record_id} r={r} compact />
      ))}

      <div className="section-head">
        <h2>{t(lang, "categories")}</h2>
      </div>
      <div className="cat-grid">
        {cats.map((c) => (
          <Link className="cat-tile" key={c} to={`/c/${slugifyCategory(c)}`}>
            <span className="emoji">{CATEGORY_ICONS[c] || "•"}</span>
            <span>{categoryLabel(lang, c)}</span>
            <span>{records.filter((r) => r.category === c).length}</span>
          </Link>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 18 }}>
        {records.length} · {t(lang, "safetyNav")}
      </p>
    </div>
  );
}
