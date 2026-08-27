import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { needLabel, needsInRow } from "../lib/needs";

export function NeedChips() {
  const { lang } = useStore();
  return (
    <section className="need-block" aria-label={t(lang, "iNeed")}>
      <div className="section-head tight">
        <h2>{t(lang, "iNeed")}</h2>
      </div>
      {([1, 2, 3] as const).map((row) => (
        <div className="need-row" key={row}>
          {needsInRow(row).map((need) => (
            <Link className="need-chip" key={need.id} to={need.to}>
              <span>{need.icon}</span>
              {needLabel(need, lang)}
            </Link>
          ))}
        </div>
      ))}
    </section>
  );
}
