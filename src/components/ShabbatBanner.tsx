import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { formatJerusalemTime, shabbatNotice } from "../lib/shabbat";

export function ShabbatBanner() {
  const { lang, home } = useStore();
  const notice = shabbatNotice(new Date(), home);
  if (!notice) return null;
  const time = notice.timeMs != null ? formatJerusalemTime(notice.timeMs, lang) : "";
  const key = notice.kind === "eve" ? (notice.name ? "chagStartsAt" : "shabbatStartsAt") : notice.name ? "chagUntil" : "shabbatUntil";
  const text = t(lang, key)
    .replace("{name}", notice.name ? notice.name[lang] : "")
    .replace("{t}", time);
  return (
    <div className="banner shabbat">
      <span aria-hidden="true">🕯️ </span>
      {text}
    </div>
  );
}
