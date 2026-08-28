import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { formatJerusalemTime, shabbatNotice, upcomingShabbat } from "../lib/shabbat";

/**
 * One-line Shabbat status, tappable — opens /shabbat with the parsha and
 * exact times. `always` also shows it on plain weekdays (used on Home).
 * The parsha name loads lazily so the Hebrew-calendar chunk stays out of
 * the entry bundle; the banner renders times-only until it arrives.
 */
export function ShabbatBanner({ always = false }: { always?: boolean }) {
  const { lang, home } = useStore();
  const now = new Date();
  const notice = shabbatNotice(now, home);
  const times = upcomingShabbat(now, home);
  const [parshaName, setParshaName] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    import("../lib/parsha")
      .then((m) => {
        if (!live) return;
        const p = m.parshaFor(times.saturday);
        setParshaName(p.holiday ? p.holiday[lang] : lang === "he" ? p.he : p.translit);
      })
      .catch(() => {
        /* banner stays times-only */
      });
    return () => {
      live = false;
    };
  }, [times.saturday.rd, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!notice && !always) return null;

  let text: string;
  if (notice) {
    const time = notice.timeMs != null ? formatJerusalemTime(notice.timeMs, lang) : "";
    const key =
      notice.kind === "eve" ? (notice.name ? "chagStartsAt" : "shabbatStartsAt") : notice.name ? "chagUntil" : "shabbatUntil";
    text = t(lang, key)
      .replace("{name}", notice.name ? notice.name[lang] : "")
      .replace("{t}", time);
    if (!notice.name && parshaName) text = `${parshaName} · ${text}`;
  } else {
    const candles = times.candlesMs != null ? formatJerusalemTime(times.candlesMs, lang) : "";
    const label = parshaName ? `${t(lang, "shabbatTimes")} · ${parshaName}` : t(lang, "shabbatTimes");
    text = t(lang, "shabbatComing").replace("{p}", label).replace("{t}", candles);
  }

  return (
    <Link to="/shabbat" className="banner shabbat banner-tap">
      <span aria-hidden="true">🕯️ </span>
      {text}
      <span className="banner-chev" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}
