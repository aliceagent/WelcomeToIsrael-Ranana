import { Link } from "react-router-dom";
import { getById, meta, records } from "../lib/data";
import { useStore } from "../lib/store";
import { t, categoryLabel } from "../lib/i18n";
import { slugifyCategory } from "../lib/format";
import { absoluteUrl, shareContent, whatsappShareUrl } from "../lib/share";
import { RecordCard } from "../components/RecordCard";

export function ShareKitPage() {
  const { lang } = useStore();
  const week1 = ["CHK-001", "CHK-002", ...meta.install_first].map(getById).filter(Boolean);
  const emergency = meta.emergency_strip.map(getById).filter(Boolean);
  const origin = absoluteUrl("/");

  return (
    <div>
      <h1 className="chrome-title">{t(lang, "shareKit")}</h1>
      <p>{t(lang, "tagline")}</p>
      <div className="actions">
        <button className="btn primary" onClick={() => shareContent(t(lang, "appName"), t(lang, "tagline"), origin)}>
          {t(lang, "shareThis")}
        </button>
        <a className="wa-text" href={whatsappShareUrl(t(lang, "appName"), origin)}>
          {t(lang, "whatsapp")}
        </a>
      </div>
      <div className="sheet">
        <p className="muted">QR</p>
        <img
          alt=""
          width={180}
          height={180}
          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(origin)}`}
        />
      </div>
      <div className="section-head">
        <h2>{t(lang, "week1")}</h2>
      </div>
      {week1.map((r) => (r ? <RecordCard key={r.record_id} r={r} compact /> : null))}
      <div className="section-head">
        <h2>{t(lang, "emergencyPack")}</h2>
      </div>
      {emergency.map((r) => (r ? <RecordCard key={r.record_id} r={r} compact /> : null))}
      <div className="section-head">
        <h2>{t(lang, "categories")}</h2>
      </div>
      <div className="cat-grid">
        {meta.categories.map((c) => (
          <Link className="cat-tile" key={c} to={`/c/${slugifyCategory(c)}`}>
            <span>
              {categoryLabel(lang, c)}
              <div className="muted">{records.filter((r) => r.category === c).length}</div>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
