import { Link } from "react-router-dom";
import { getById, records } from "../lib/data";
import { RecordCard } from "../components/RecordCard";
import { NearMeToggle } from "../components/NearMeToggle";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { directionsUrl, effectiveKm, telHref } from "../lib/geo";
import { displayName, priorityScore } from "../lib/format";
import { meta } from "../lib/data";

/** Enough Hebrew to get through the first 20 seconds of an emergency call. */
const PHRASES: { he: string; translit: string; en: string; fr: string }[] = [
  { he: "אני צריך אמבולנס", translit: "Ani tzarich ambulans", en: "I need an ambulance", fr: "J'ai besoin d'une ambulance" },
  { he: "יש שריפה", translit: "Yesh sreifa", en: "There is a fire", fr: "Il y a un incendie" },
  { he: "אני גר ברעננה", translit: "Ani gar beRa'anana", en: "I live in Ra'anana", fr: "J'habite à Ra'anana" },
  { he: "הכתובת שלי היא…", translit: "Haktovet sheli hi…", en: "My address is…", fr: "Mon adresse est…" },
  { he: "אנגלית בבקשה", translit: "Anglit bevakasha", en: "English, please", fr: "Anglais, s'il vous plaît" },
];

export function EmergencyPage() {
  const { lang, address, origin, originIsDefault } = useStore();
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
  const nearest = shelters[0];

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

      {address ? (
        <div className="sheet address-card">
          <h2>{t(lang, "myAddress")}</h2>
          <p className="address-big" dir="auto">
            {address}
          </p>
        </div>
      ) : (
        <p className="muted">
          <Link to="/settings">{t(lang, "setAddressHint")}</Link>
        </p>
      )}

      <div className="section-head">
        <h2>{t(lang, "sayThis")}</h2>
      </div>
      <p className="muted">{t(lang, "sayThisHelp")}</p>
      {PHRASES.map((p) => (
        <div className="card phrase" key={p.he}>
          <div className="phrase-he" lang="he" dir="rtl">
            {p.he}
          </div>
          {lang !== "he" ? (
            <>
              <div className="phrase-translit">{p.translit}</div>
              <div className="muted">{lang === "fr" ? p.fr : p.en}</div>
            </>
          ) : null}
        </div>
      ))}

      {nearest ? (
        <>
          <div className="section-head">
            <h2>{t(lang, "nearestShelter")}</h2>
          </div>
          <div className="filters">
            <NearMeToggle />
          </div>
          <RecordCard r={nearest} compact />
          <div className="actions" style={{ marginBottom: 12 }}>
            <a className="btn primary" href={directionsUrl(nearest, origin, "walking")} target="_blank" rel="noreferrer">
              {t(lang, "walk")}
            </a>
          </div>
        </>
      ) : null}

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
