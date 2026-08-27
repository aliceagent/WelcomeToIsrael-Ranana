import { Link } from "react-router-dom";
import { getById, meta } from "../lib/data";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { telHref } from "../lib/geo";
import { displayName } from "../lib/format";
import { recordPath } from "../lib/share";
import { NeedChips } from "../components/NeedChips";
import {
  QUICK_APPS,
  foodHomeFolders,
  folderCount,
  folderLabel,
  groupLabel,
  homeLaunchers,
} from "../lib/directory";
import type { Resource } from "../lib/types";

const SOS_SHORT: Record<string, { num: string; label: { en: string; fr: string; he: string } }> = {
  "EMG-001": { num: "100", label: { en: "Police", fr: "Police", he: "משטרה" } },
  "EMG-002": { num: "101", label: { en: "MDA", fr: "MDA", he: "מד״א" } },
  "EMG-003": { num: "102", label: { en: "Fire", fr: "Pompiers", he: "כבאות" } },
  "EMG-005": { num: "104", label: { en: "Home Front", fr: "Front int.", he: "פיקוד" } },
  "EMG-006": { num: "107", label: { en: "City", fr: "Mairie", he: "עירייה" } },
};

export function HomePage() {
  const { lang } = useStore();
  const food = foodHomeFolders();
  const quick = QUICK_APPS.map(getById).filter((r): r is Resource => !!r);
  const sos = meta.emergency_strip.map(getById).filter((r): r is Resource => !!r);

  return (
    <div className="home-dir">
      <Link className="search" to="/search">
        <span>⌕</span>
        <span className="muted">{t(lang, "searchHint")}</span>
      </Link>

      <NeedChips />

      <div className="sos-strip" aria-label={t(lang, "emergency")}>
        {sos.map((r) => {
          const short = SOS_SHORT[r.record_id];
          const href = r.phone_primary ? telHref(r.phone_primary.split("/")[0].trim()) : "/emergency";
          return (
            <a className="sos-chip" key={r.record_id} href={href}>
              <span className="num">{short?.num || r.phone_primary}</span>
              <span className="lbl">{short?.label[lang] || displayName(r, lang)}</span>
            </a>
          );
        })}
      </div>

      <div className="quick-row" aria-label={t(lang, "quickApps")}>
        {quick.map((r) => (
          <Link className="quick-app" key={r.record_id} to={recordPath(r)}>
            <span className="dot">{quickIcon(r.name_en || "")}</span>
            <span>{shortAppName(r.name_en || "")}</span>
          </Link>
        ))}
      </div>

      <section className="food-panel">
        <div className="section-head tight">
          <h2>{t(lang, "food")}</h2>
          <Link to="/food">{t(lang, "seeAll")}</Link>
        </div>
        <div className="food-grid">
          {food.map((f) => (
            <Link className="food-tile" key={f.id} to={`/d/${f.id}`}>
              <span className="emoji">{f.icon}</span>
              <strong>{folderLabel(f, lang)}</strong>
              <span className="count">{folderCount(f)}</span>
            </Link>
          ))}
        </div>
      </section>

      {(["daily", "family", "city", "help"] as const).map((group) => (
        <section key={group}>
          <div className="section-head tight">
            <h2>{groupLabel(group, lang)}</h2>
          </div>
          <div className="app-grid">
            {homeLaunchers(group).map((item) => (
              <Link className="app-icon" key={item.id} to={item.to}>
                <span className="well">{item.icon}</span>
                <span className="lbl">{item.title[lang]}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function shortAppName(name: string): string {
  if (/whatsapp/i.test(name)) return "WhatsApp";
  if (/waze/i.test(name)) return "Waze";
  if (/wolt/i.test(name)) return "Wolt";
  if (/moovit/i.test(name)) return "Moovit";
  if (/^bit\b/i.test(name)) return "bit";
  if (/pango/i.test(name)) return "Pango";
  return name.split(" ")[0];
}

function quickIcon(name: string): string {
  if (/whatsapp/i.test(name)) return "💬";
  if (/waze/i.test(name)) return "🗺️";
  if (/wolt/i.test(name)) return "🛵";
  if (/moovit/i.test(name)) return "🚌";
  if (/^bit\b/i.test(name)) return "💸";
  if (/pango/i.test(name)) return "🅿️";
  return "📱";
}
