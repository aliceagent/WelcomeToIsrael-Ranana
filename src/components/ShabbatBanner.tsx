import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { formatJerusalemTime, shabbatNotice, upcomingShabbat } from "../lib/shabbat";
import { parshaFor } from "../lib/parsha";

/**
 * One-line Shabbat status, tappable — opens /shabbat with the parsha and
 * exact times. `always` also shows it on plain weekdays (used on Home).
 */
export function ShabbatBanner({ always = false }: { always?: boolean }) {
  const { lang, home } = useStore();
  const now = new Date();
  const notice = shabbatNotice(now, home);
  if (!notice && !always) return null;

  const times = upcomingShabbat(now, home);
  const parsha = parshaFor(times.saturday);
  const parshaName = parsha.holiday ? parsha.holiday[lang] : lang === "he" ? parsha.he : parsha.translit;

  let text: string;
  if (notice) {
    const time = notice.timeMs != null ? formatJerusalemTime(notice.timeMs, lang) : "";
    const key =
      notice.kind === "eve" ? (notice.name ? "chagStartsAt" : "shabbatStartsAt") : notice.name ? "chagUntil" : "shabbatUntil";
    text = t(lang, key)
      .replace("{name}", notice.name ? notice.name[lang] : "")
      .replace("{t}", time);
    if (!notice.name && !parsha.holiday) text = `${parshaName} · ${text}`;
  } else {
    const candles = times.candlesMs != null ? formatJerusalemTime(times.candlesMs, lang) : "";
    text = t(lang, "shabbatComing").replace("{p}", parshaName).replace("{t}", candles);
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
