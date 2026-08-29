import { Link } from "react-router-dom";
import type { Resource } from "../lib/types";
import { descriptionDir, displayDescription, displayName, priorityLabel, TYPE_LABELS } from "../lib/format";
import { recordPath } from "../lib/share";
import { shortWeekday, t } from "../lib/i18n";
import { useStore } from "../lib/store";
import { estimateTravel, haversineKm, isLowConfidence } from "../lib/geo";
import { openStateDetail } from "../lib/hours";
import { Phone } from "./Phone";

/**
 * Open/closed is only half the answer: someone reading this at 16:40 needs to
 * know the shop shuts at 17:00, and someone reading it on Shabbat needs to
 * know when it comes back.
 */
export function OpenChip({ r }: { r: Resource }) {
  const { lang } = useStore();
  const detail = openStateDetail(r);
  if (!detail) return null;
  let label: string;
  if (detail.state === "always") {
    label = t(lang, "open247");
  } else if (detail.state === "open") {
    label = detail.closesAt ? t(lang, "openUntil").replace("{t}", detail.closesAt) : t(lang, "openNow");
  } else if (detail.opensAt) {
    label = detail.opensAt.today
      ? t(lang, "reopensToday").replace("{t}", detail.opensAt.time)
      : t(lang, "reopensOn")
          .replace("{d}", shortWeekday(lang, detail.opensAt.weekday))
          .replace("{t}", detail.opensAt.time);
  } else if (detail.closedFor) {
    label = t(lang, detail.closedFor === "shabbat" ? "closedShabbat" : "closedHoliday");
  } else {
    label = t(lang, "closedNow");
  }
  return <span className={`chip ${detail.state === "closed" ? "hot" : "ok"}`}>{label}</span>;
}

const WALKABLE_MIN = 18;

export function Distance({ r, full }: { r: Resource; full?: boolean }) {
  const { lang, origin, originIsDefault, originIsGps } = useStore();
  if (r.latitude_est == null || r.longitude_est == null) {
    if (r.distance_from_home_display) return <span className="chip">{r.distance_from_home_display}</span>;
    return null;
  }
  let km = r.distance_from_home_km_est;
  let walk = r.walking_time_from_home_min_est;
  let drive = r.driving_time_from_home_min_est_off_peak;
  if (!originIsDefault) {
    const straight = haversineKm(origin, r.latitude_est, r.longitude_est);
    const est = estimateTravel(straight);
    km = est.walkKm;
    walk = est.walkMin;
    drive = est.driveMin;
  }
  if (km == null) return null;
  const prefix = isLowConfidence(r) ? `${t(lang, "approx")} ` : "";
  const suffix = originIsGps ? t(lang, "fromYou") : t(lang, "fromHome");
  if (full) {
    return (
      <span className="chip">
        {prefix}
        {km.toFixed(1)} {t(lang, "km")} · {walk} {t(lang, "minWalk")} · {drive} {t(lang, "minDrive")} {suffix}
      </span>
    );
  }
  const walkable = walk != null && walk <= WALKABLE_MIN;
  return (
    <span className="chip">
      {prefix}
      {km.toFixed(1)} {t(lang, "km")} ·{" "}
      {walkable ? `${walk} ${t(lang, "minWalk")}` : `${drive} ${t(lang, "minDrive")}`} {suffix}
    </span>
  );
}

export function RecordCard({ r, compact }: { r: Resource; compact?: boolean }) {
  const { lang, favorites, toggleFav } = useStore();
  const name = displayName(r, lang);
  const desc = displayDescription(r, lang);
  const type = TYPE_LABELS[r.record_type]?.[lang];
  const saved = favorites.has(r.record_id);
  return (
    <div className="card">
      <Link to={recordPath(r)} className="card-link">
        <div className="card-row">
          <div className="card-body">
            {r.name_he && lang !== "he" ? <div className="he-name">{r.name_he}</div> : null}
            <h3>{name}</h3>
            {!compact && desc ? <p className="muted" dir={descriptionDir(r, lang)} style={{ margin: 0 }}>{desc}</p> : null}
            <div className="chips">
              {r.priority ? (
                <span className={`chip ${/Critical|Essential/i.test(r.priority) ? "hot" : ""}`}>{priorityLabel(r.priority, lang)}</span>
              ) : null}
              {type ? <span className="chip">{type}</span> : null}
              {r.phone_primary ? (
                <span className="chip ok">
                  <Phone n={r.phone_primary} />
                </span>
              ) : null}
              <OpenChip r={r} />
              <Distance r={r} />
            </div>
          </div>
        </div>
      </Link>
      <button
        type="button"
        className={`star ${saved ? "on" : ""}`}
        aria-pressed={saved}
        aria-label={t(lang, "save")}
        onClick={(e) => {
          e.preventDefault();
          toggleFav(r.record_id);
        }}
      >
        {saved ? "★" : "☆"}
      </button>
    </div>
  );
}
