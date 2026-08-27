import { useParams } from "react-router-dom";
import { records } from "../lib/data";
import { HUBS, priorityScore } from "../lib/format";
import { RecordCard } from "../components/RecordCard";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";

const TITLES: Record<string, "justArrived" | "shopping" | "family" | "howIsrael"> = {
  arrived: "justArrived",
  shopping: "shopping",
  family: "family",
  israel: "howIsrael",
};

export function HubPage() {
  const { id } = useParams();
  const { lang } = useStore();
  const hub = id && id in HUBS ? HUBS[id as keyof typeof HUBS] : null;
  const titleKey = id ? TITLES[id] : undefined;
  if (!hub || !titleKey) return <div className="empty">{t(lang, "noResults")}</div>;
  const items = records
    .filter((r) => (hub.categories as readonly string[]).includes(r.category))
    .sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority))
    .slice(0, 40);
  return (
    <div>
      <h1 className="chrome-title">{t(lang, titleKey)}</h1>
      {items.map((r) => (
        <RecordCard key={r.record_id} r={r} compact />
      ))}
    </div>
  );
}
