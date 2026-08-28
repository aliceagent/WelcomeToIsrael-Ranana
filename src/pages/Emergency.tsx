import { getById, records } from "../lib/data";
import { RecordCard } from "../components/RecordCard";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { effectiveKm, telHref } from "../lib/geo";
import { displayName, priorityScore } from "../lib/format";
import { meta } from "../lib/data";

export function EmergencyPage() {
  const { lang, origin, originIsDefault } = useStore();
  const strip = meta.emergency_strip.map(getById).filter(Boolean);
  const numbers = records
    .filter((r) => r.category === "Emergency & Important Numbers")
    .sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority));
  const shelters = records
    .filter((r) => r.record_type === "public_shelter")
    .sort(
      (a, b) =>
        (effectiveKm(a, origin, originIsDefault) ?? 99) - (effectiveKm(b, origin, originIsDefault) ?? 99),
    )
    .slice(0, 8);

  return (
    <div>
      <h1 className="chrome-title">{t(lang, "needHelpNow")}</h1>
      <div className="banner warn">{t(lang, "safetyNav")}</div>
      {strip.map((r) =>
        r?.phone_primary ? (
          <a key={r.record_id} className="call-hero" href={telHref(r.phone_primary)} style={{ marginBottom: 10, textDecoration: "none" }}>
            <div>{displayName(r, lang)}</div>
            <div className="phone">{r.phone_primary}</div>
            {lang !== "he" ? <div>{r.name_he}</div> : null}
          </a>
        ) : null,
      )}
      <div className="section-head">
        <h2>{t(lang, "emergency")}</h2>
      </div>
      {numbers.map((r) => (
        <RecordCard key={r.record_id} r={r} compact />
      ))}
      <div className="section-head">
        <h2>{t(lang, "shelters")}</h2>
      </div>
      <div className="banner warn">{t(lang, "shelterCaveat")}</div>
      {shelters.map((r) => (
        <RecordCard key={r.record_id} r={r} compact />
      ))}
    </div>
  );
}
