import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { formatJerusalemDate, formatJerusalemTime, upcomingShabbat } from "../lib/shabbat";
import { parshaFor } from "../lib/parsha";

export function ShabbatPage() {
  const { lang, home } = useStore();
  const times = upcomingShabbat(new Date(), home);
  const parsha = parshaFor(times.saturday);

  return (
    <article className="detail shabbat-page">
      <h1 className="chrome-title">{t(lang, "shabbatTimes")}</h1>

      <div className="sheet parsha-card">
        <p className="card-label">{t(lang, "parshaLabel")}</p>
        {parsha.holiday ? (
          <p className="parsha-he">{parsha.holiday[lang]}</p>
        ) : (
          <>
            <p className="parsha-he" lang="he" dir="rtl">
              {parsha.he}
            </p>
            {lang !== "he" ? <p className="parsha-translit">{parsha.translit}</p> : null}
          </>
        )}
        <p className="muted" lang="he" dir="rtl">
          {parsha.hebrewDate}
        </p>
      </div>

      <div className="sheet">
        <div className="time-row">
          <span className="time-ico" aria-hidden="true">
            🕯️
          </span>
          <span className="time-copy">
            <strong>{t(lang, "candles")}</strong>
            <span className="muted">{formatJerusalemDate(times.friday, lang)}</span>
          </span>
          <span className="time-val">{times.candlesMs != null ? formatJerusalemTime(times.candlesMs, lang) : "—"}</span>
        </div>
        <div className="time-row">
          <span className="time-ico" aria-hidden="true">
            ✨
          </span>
          <span className="time-copy">
            <strong>{t(lang, "havdalah")}</strong>
            <span className="muted">{formatJerusalemDate(times.saturday, lang)}</span>
          </span>
          <span className="time-val">{times.havdalahMs != null ? formatJerusalemTime(times.havdalahMs, lang) : "—"}</span>
        </div>
      </div>

      <p className="muted">{t(lang, "shabbatTimesNote")}</p>
    </article>
  );
}
