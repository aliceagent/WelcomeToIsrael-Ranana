import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import {
  eveCandlesForRd,
  formatJerusalemDate,
  formatJerusalemTime,
  HOLIDAY_NAMES,
  shabbatTimesForRd,
  upcomingChagim,
  upcomingShabbat,
} from "../lib/shabbat";
import { gregorianFromRd } from "../lib/hebcal.mjs";
import { parshaFor } from "../lib/parsha";

export function ShabbatPage() {
  const { lang, home } = useStore();
  const now = new Date();
  const times = upcomingShabbat(now, home);
  const parsha = parshaFor(times.saturday);
  const nextWeeks = [1, 2, 3, 4].map((i) => {
    const week = shabbatTimesForRd(times.saturday.rd + 7 * i, home);
    return { week, parsha: parshaFor(week.saturday) };
  });
  const chagim = upcomingChagim(now, 6);

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

      <div className="section-head">
        <h2>{t(lang, "comingWeeks")}</h2>
      </div>
      <div className="sheet">
        {nextWeeks.map(({ week, parsha: p }) => (
          <div className="time-row" key={week.saturday.rd}>
            <span className="time-copy">
              <strong>{p.holiday ? p.holiday[lang] : lang === "he" ? p.he : p.translit}</strong>
              <span className="muted">{formatJerusalemDate(week.saturday, lang)}</span>
            </span>
            <span className="time-val small">
              {week.candlesMs != null ? formatJerusalemTime(week.candlesMs, lang) : "—"}
            </span>
          </div>
        ))}
      </div>

      {chagim.length ? (
        <>
          <div className="section-head">
            <h2>{t(lang, "upcomingChagim")}</h2>
          </div>
          <div className="sheet">
            {chagim.map(({ code, rd }) => {
              const candles = eveCandlesForRd(rd, home);
              return (
                <div className="time-row" key={rd}>
                  <span className="time-copy">
                    <strong>{HOLIDAY_NAMES[code][lang]}</strong>
                    <span className="muted">{formatJerusalemDate(gregorianFromRd(rd), lang)}</span>
                  </span>
                  <span className="time-val small">{candles != null ? formatJerusalemTime(candles, lang) : "—"}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      <p className="muted">{t(lang, "shabbatTimesNote")}</p>
    </article>
  );
}
