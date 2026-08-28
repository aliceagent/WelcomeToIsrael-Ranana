import { Link, useParams } from "react-router-dom";
import { getById, getBySlug } from "../lib/data";
import { recordPath } from "../lib/share";
import { BOOKING_HINTS } from "../lib/booking";
import { SpeakButton } from "../components/SpeakButton";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { descriptionDir, displayDescription, displayName, priorityLabel, TYPE_LABELS } from "../lib/format";
import { ShareBar } from "../components/ShareBar";
import { Distance, OpenChip } from "../components/RecordCard";
import { appleMapsUrl, directionsUrl, mapsSearchUrl, phoneNumbers, telHref, wazeUrl, whatsappHref } from "../lib/geo";
import { PlacesMapLazy } from "../components/PlacesMapLazy";
import { sameUrl } from "../lib/urls";
import { Phone } from "../components/Phone";

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
  // In Hebrew, the glossary term's own Hebrew-term block already carries the
  // heading; showing displayName's name_he again in an <h1> below would repeat it.
  const showGlossaryHeHeading = r.record_type === "glossary_term" && lang === "he" && !!r.name_he;

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
      {r.record_type === "glossary_term" && r.name_he ? (
        showGlossaryHeHeading ? (
          <h1 className="glossary-he">
            {r.name_he} <SpeakButton text={r.name_he} />
          </h1>
        ) : (
          <p className="glossary-he">
            {r.name_he} <SpeakButton text={r.name_he} />
          </p>
        )
      ) : null}
      {r.name_he && r.record_type !== "glossary_term" ? <p className="he-name">{r.name_he}</p> : null}
      {!showGlossaryHeHeading ? <h1>{name}</h1> : null}
      {r.name_fr && lang === "en" ? <p className="muted">{r.name_fr}</p> : null}
      {showGlossaryHeHeading && r.name_en ? <p className="muted">{r.name_en}</p> : null}
      <div className="chips">
        {r.priority ? <span className="chip hot">{priorityLabel(r.priority, lang)}</span> : null}
        {r.subcategory ? <span className="chip">{r.subcategory}</span> : null}
        {r.denomination_nusach ? <span className="chip">{r.denomination_nusach}</span> : null}
        <OpenChip r={r} />
        <Distance r={r} full />
      </div>
      {desc ? <p dir={descriptionDir(r, lang)}>{desc}</p> : null}

      {r.record_type === "important_phone_or_emergency_service" && r.phone_primary ? (
        <div className="call-hero">
          <div>{name}</div>
          <div className="phone">
            <Phone n={r.phone_primary} />
          </div>
          {r.availability_hours_note ? <div>{r.availability_hours_note}</div> : null}
          {phoneNumbers(r.phone_primary).map((num) => (
            <a key={num} className="btn danger" href={telHref(num)}>
              {t(lang, "call")} <Phone n={num} />
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
          {/* "Call ahead" only makes sense when there is a number to call. */}
          {r.phone_primary || r.phone_secondary ? <span className="muted"> — {t(lang, "hoursCaveat")}</span> : null}
        </p>
      ) : null}

      {BOOKING_HINTS[r.record_id] ? (
        <div className="banner">
          <strong>{t(lang, "howToBook")}: </strong>
          {BOOKING_HINTS[r.record_id].copy[lang]}
          {(() => {
            const viaId = BOOKING_HINTS[r.record_id].via;
            const via = viaId ? getById(viaId) : undefined;
            return via ? (
              <>
                {" "}
                <Link to={recordPath(via)}>{displayName(via, lang)} →</Link>
              </>
            ) : null;
          })()}
        </div>
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

      {r.latitude_est != null && r.longitude_est != null ? <PlacesMapLazy places={[r]} highlight={r.record_id} /> : null}

      <div className="actions">
        {r.record_type !== "important_phone_or_emergency_service"
          ? phoneNumbers(r.phone_primary).map((num) => (
              <a key={num} className="btn primary" href={telHref(num)}>
                {t(lang, "call")} <Phone n={num} />
              </a>
            ))
          : null}
        {phoneNumbers(r.phone_secondary).map((num) => (
          <a key={num} className="btn" href={telHref(num)}>
            <Phone n={num} />
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
      </div>

      {r.is_physical_location || r.address_en ? (
        <div className="directions-group">
          <div className="directions-label">{t(lang, "gettingThere")}</div>
          <div className="actions compact">
            <a className="btn small" href={mapsSearchUrl(r)} target="_blank" rel="noreferrer">
              {t(lang, "openInMaps")}
            </a>
            <a className="btn small" href={directionsUrl(r, home, "walking")} target="_blank" rel="noreferrer">
              {t(lang, "walk")}
            </a>
            <a className="btn small" href={directionsUrl(r, home, "driving")} target="_blank" rel="noreferrer">
              {t(lang, "drive")}
            </a>
            {wazeUrl(r) ? (
              <a className="btn small" href={wazeUrl(r)!} target="_blank" rel="noreferrer">
                {t(lang, "waze")}
              </a>
            ) : null}
            <a className="btn small" href={appleMapsUrl(r, home)} target="_blank" rel="noreferrer">
              {t(lang, "appleMaps")}
            </a>
          </div>
        </div>
      ) : null}

      <ShareBar r={r} />

      {highStakes ? <div className="banner">{t(lang, "safetyNav")}</div> : null}

      <p className="muted">
        {t(lang, "lastVerified")}: {r.last_verified || t(lang, "unknown")}
        {r.last_verified &&
        r.recommended_review_days != null &&
        (Date.now() - Date.parse(r.last_verified)) / 86400000 > r.recommended_review_days ? (
          <> — {t(lang, "mayBeOutdated")}</>
        ) : null}
        {r.source_url_primary ? (
          <>
            {" · "}
            <a className="source-link" href={r.source_url_primary} target="_blank" rel="noreferrer">
              {t(lang, "source")}
            </a>
          </>
        ) : null}
        {" · "}
        <a
          className="source-link"
          href={`https://wa.me/?text=${encodeURIComponent(
            t(lang, "correctionText").replace("{name}", name).replace("{id}", r.record_id),
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          {t(lang, "reportProblem")}
        </a>
      </p>
      {r.verification_status ? <p className="muted">{r.verification_status}</p> : null}
    </article>
  );
}
