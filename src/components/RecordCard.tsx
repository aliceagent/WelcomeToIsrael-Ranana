import { Link } from "react-router-dom";
import type { Resource } from "../lib/types";
import { descriptionDir, displayDescription, displayName, TYPE_LABELS } from "../lib/format";
import { recordPath } from "../lib/share";
import { t } from "../lib/i18n";
import { useStore } from "../lib/store";
import { estimateTravel, haversineKm, isLowConfidence } from "../lib/geo";
import { meta } from "../lib/data";
import { openState } from "../lib/hours";

export function OpenChip({ r }: { r: Resource }) {
  const { lang } = useStore();
  const state = openState(r);
  if (!state) return null;
  const key = state === "always" ? "open247" : state === "open" ? "openNow" : "closedNow";
  return <span className={`chip ${state === "closed" ? "hot" : "ok"}`}>{t(lang, key)}</span>;
}

export function Distance({ r }: { r: Resource }) {
  const { lang, home } = useStore();
  if (r.latitude_est == null || r.longitude_est == null) {
    if (r.distance_from_home_display) return <span className="chip">{r.distance_from_home_display}</span>;
    return null;
  }
  const usingDefault =
    Math.abs(home.lat - meta.home_default.lat) < 0.0002 && Math.abs(home.lng - meta.home_default.lng) < 0.0002;
  let km = r.distance_from_home_km_est;
  let walk = r.walking_time_from_home_min_est;
  let drive = r.driving_time_from_home_min_est_off_peak;
  if (!usingDefault) {
    const straight = haversineKm(home, r.latitude_est, r.longitude_est);
    const est = estimateTravel(straight);
    km = est.walkKm;
    walk = est.walkMin;
    drive = est.driveMin;
  }
  if (km == null) return null;
  const prefix = isLowConfidence(r) ? `${t(lang, "approx")} ` : "";
  return (
    <span className="chip">
      {prefix}
      {km.toFixed(1)} {t(lang, "km")} · {walk} {t(lang, "minWalk")} · {drive} {t(lang, "minDrive")} {t(lang, "fromHome")}
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
              {r.priority ? <span className={`chip ${/Critical|Essential/i.test(r.priority) ? "hot" : ""}`}>{r.priority}</span> : null}
              {type ? <span className="chip">{type}</span> : null}
              {r.phone_primary ? <span className="chip ok">{r.phone_primary}</span> : null}
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
