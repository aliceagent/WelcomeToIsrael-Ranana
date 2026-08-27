import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";

export function MorePage() {
  const { lang } = useStore();
  const links = [
    ["/emergency", t(lang, "emergency"), "🚨"],
    ["/checklists", t(lang, "checklists"), "✅"],
    ["/glossary", t(lang, "glossary"), "א"],
    ["/share", t(lang, "shareKit"), "↗️"],
    ["/settings", t(lang, "settings"), "⚙️"],
    ["/map", t(lang, "map"), "🗺️"],
  ];
  return (
    <div>
      <h1 style={{ fontFamily: "var(--display)" }}>{t(lang, "more")}</h1>
      {links.map(([to, label, ico]) => (
        <Link className="card" key={to} to={to}>
          <h3>
            {ico} {label}
          </h3>
        </Link>
      ))}
    </div>
  );
}
