import { useParams } from "react-router-dom";
import { getBySlug } from "../lib/data";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { descriptionDir, displayDescription, displayName, TYPE_LABELS } from "../lib/format";
import { ShareBar } from "../components/ShareBar";
import { Distance } from "../components/RecordCard";
import { appleMapsUrl, directionsUrl, mapsSearchUrl, phoneNumbers, telHref, wazeUrl, whatsappHref } from "../lib/geo";
import { PlacesMap } from "../components/PlacesMap";
import { sameUrl } from "../lib/urls";

export function RecordPage() {
  const { slug } = useParams();
  const { lang, favorites, toggleFav, checks, toggleCheck, home } = useStore();
  const r = slug ? getBySlug(slug) : undefined;
  if (!r) return <div className="empty">{t(lang, "noResults")}</div>;

  const name = displayName(r, lang);
  const desc = displayDescription(r, lang);
  const type = TYPE_LABELS[r.record_type]?.[lang];
  const highStakes =
    r.record_type === "public_shelter" ||
    r.record_type === "important_phone_or_emergency_service" ||
    r.category === "Government, Aliyah & Rights" ||
    r.category === "Health & Family";

  return (
    <article className="detail">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <p className="muted" style={{ margin: 0 }}>
          {type} · {r.category}
        </p>
        <button
          type="button"
          className={`star ${favorites.has(r.record_id) ? "on" : ""}`}
          aria-pressed={favorites.has(r.record_id)}
          aria-label={t(lang, "save")}
          onClick={() => toggleFav(r.record_id)}
        >
          {favorites.has(r.record_id) ? `★ ${t(lang, "savedOn")}` : `☆ ${t(lang, "save")}`}
        </button>
      </div>
      {r.record_type === "glossary_term" && r.name_he ? <p className="glossary-he">{r.name_he}</p> : null}
      {r.name_he && r.record_type !== "glossary_term" ? <p className="he-name">{r.name_he}</p> : null}
      <h1>{name}</h1>
      {r.name_fr && lang === "en" ? <p className="muted">{r.name_fr}</p> : null}
      <div className="chips">
        {r.priority ? <span className="chip hot">{r.priority}</span> : null}
        {r.subcategory ? <span className="chip">{r.subcategory}</span> : null}
        {r.denomination_nusach ? <span className="chip">{r.denomination_nusach}</span> : null}
        <Distance r={r} />
      </div>
      {desc ? <p dir={descriptionDir(r, lang)}>{desc}</p> : null}

      {r.record_type === "important_phone_or_emergency_service" && r.phone_primary ? (
        <div className="call-hero">
          <div>{name}</div>
          <div className="phone">{r.phone_primary}</div>
          {r.availability_hours_note ? <div>{r.availability_hours_note}</div> : null}
          {phoneNumbers(r.phone_primary).map((num) => (
            <a key={num} className="btn danger" href={telHref(num)}>
              {t(lang, "call")} {num}
            </a>
          ))}
        </div>
      ) : null}

      {r.record_type === "public_shelter" ? <div className="banner warn">{t(lang, "shelterCaveat")}</div> : null}
      {r.kosher_status ? (
        <div className="banner">
          {r.kosher_status}
          <div>{t(lang, "kosherCaveat")}</div>
        </div>
      ) : null}
      {r.record_type === "directory" ? <div className="banner">{t(lang, "directoryCaveat")}</div> : null}
      {r.availability_hours_note && r.record_type !== "important_phone_or_emergency_service" ? (
        <p>
          <strong>{t(lang, "hours")}: </strong>
          {r.availability_hours_note}
          <span className="muted"> — {t(lang, "hoursCaveat")}</span>
        </p>
      ) : null}

      {r.record_type === "checklist" ? (
        <button className={`check-item ${checks.has(r.record_id) ? "done" : ""}`} onClick={() => toggleCheck(r.record_id)}>
          <span className="box">{checks.has(r.record_id) ? "✓" : ""}</span>
          <span>{t(lang, "tapToCheck")}</span>
        </button>
      ) : null}

      {(r.address_en || r.address_he) && (
        <p>
          <strong>{t(lang, "address")}: </strong>
          {lang === "he" && r.address_he ? r.address_he : r.address_en}
        </p>
      )}
      {r.eligibility_requirements ? (
        <p>
          <strong>{t(lang, "eligibility")}: </strong>
          {r.eligibility_requirements}
        </p>
      ) : null}
      {r.delivery_coverage ? (
        <p>
          <strong>{t(lang, "coverage")}: </strong>
          {r.delivery_coverage}
        </p>
      ) : null}
      {r.languages ? (
        <p>
          <strong>{t(lang, "languagesSpoken")}: </strong>
          {r.languages}
        </p>
      ) : null}
      {r.cost_fee_notes ? <p className="muted">{r.cost_fee_notes}</p> : null}
      {r.notes ? (
        <p>
          <strong>{t(lang, "notes")}: </strong>
          {r.notes}
        </p>
      ) : null}

      {r.latitude_est != null && r.longitude_est != null ? <PlacesMap places={[r]} highlight={r.record_id} /> : null}

      <div className="actions">
        {r.record_type !== "important_phone_or_emergency_service"
          ? phoneNumbers(r.phone_primary).map((num) => (
              <a key={num} className="btn primary" href={telHref(num)}>
                {t(lang, "call")} {num}
              </a>
            ))
          : null}
        {phoneNumbers(r.phone_secondary).map((num) => (
          <a key={num} className="btn" href={telHref(num)}>
            {num}
          </a>
        ))}
        {r.whatsapp_sms ? (
          <a className="wa-text" href={whatsappHref(r.whatsapp_sms)}>
            {t(lang, "whatsapp")}
          </a>
        ) : null}
        {r.email ? (
          <a className="btn" href={`mailto:${r.email}`}>
            {t(lang, "email")}
          </a>
        ) : null}
        {r.website_url ? (
          <a className="btn" href={r.website_url} target="_blank" rel="noreferrer">
            {t(lang, "website")}
          </a>
        ) : null}
        {r.action_url && !sameUrl(r.action_url, r.website_url) ? (
          <a className="btn" href={r.action_url} target="_blank" rel="noreferrer">
            {t(lang, "continue")}
          </a>
        ) : null}
        {r.menu_order_url && !sameUrl(r.menu_order_url, r.website_url) && !sameUrl(r.menu_order_url, r.action_url) ? (
          <a className="btn" href={r.menu_order_url} target="_blank" rel="noreferrer">
            {t(lang, "order")}
          </a>
        ) : null}
        {r.is_physical_location || r.address_en ? (
          <>
            <a className="btn" href={mapsSearchUrl(r)} target="_blank" rel="noreferrer">
              {t(lang, "openInMaps")}
            </a>
            <a className="btn" href={directionsUrl(r, home, "walking")} target="_blank" rel="noreferrer">
              {t(lang, "walk")}
            </a>
            <a className="btn" href={directionsUrl(r, home, "driving")} target="_blank" rel="noreferrer">
              {t(lang, "drive")}
            </a>
            {wazeUrl(r) ? (
              <a className="btn" href={wazeUrl(r)!} target="_blank" rel="noreferrer">
                {t(lang, "waze")}
              </a>
            ) : null}
            <a className="btn" href={appleMapsUrl(r, home)} target="_blank" rel="noreferrer">
              Apple Maps
            </a>
          </>
        ) : null}
      </div>

      <ShareBar r={r} />

      {highStakes ? <div className="banner">{t(lang, "safetyNav")}</div> : null}

      <p className="muted">
        {t(lang, "lastVerified")}: {r.last_verified || t(lang, "unknown")}
        {r.source_url_primary ? (
          <>
            {" · "}
            <a className="source-link" href={r.source_url_primary} target="_blank" rel="noreferrer">
              {t(lang, "source")}
            </a>
          </>
        ) : null}
      </p>
      {r.verification_status ? <p className="muted">{r.verification_status}</p> : null}
    </article>
  );
}
