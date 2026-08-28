import { useMemo, useState } from "react";
import { physicalRecords } from "../lib/data";
import { PlacesMap } from "../components/PlacesMap";
import { RecordCard } from "../components/RecordCard";
import { NearMeToggle } from "../components/NearMeToggle";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { effectiveKm } from "../lib/geo";

export function MapPage() {
  const { lang, online, origin, originIsDefault } = useStore();
  const [mode, setMode] = useState<"all" | "shelter" | "shul" | "shop">("all");
  const [limit, setLimit] = useState(20);
  const places = useMemo(() => {
    return physicalRecords.filter((r) => {
      if (mode === "shelter") return r.record_type === "public_shelter";
      if (mode === "shul") return r.record_type === "synagogue";
      if (mode === "shop") return r.record_type === "local_business" || r.category === "Ra'anana Businesses";
      return true;
    });
  }, [mode]);
  const nearest = [...places].sort(
    (a, b) =>
      (effectiveKm(a, origin, originIsDefault) ?? 99) - (effectiveKm(b, origin, originIsDefault) ?? 99),
  );

  return (
    <div>
      <h1 className="chrome-title">{t(lang, "map")}</h1>
      <div className="filters">
        <NearMeToggle />
        <button aria-pressed={mode === "all"} className={mode === "all" ? "on" : ""} onClick={() => setMode("all")}>
          {t(lang, "any")}
        </button>
        <button aria-pressed={mode === "shelter"} className={mode === "shelter" ? "on" : ""} onClick={() => setMode("shelter")}>
          {t(lang, "shelters")}
        </button>
        <button aria-pressed={mode === "shul"} className={mode === "shul" ? "on" : ""} onClick={() => setMode("shul")}>
          {t(lang, "synagogues")}
        </button>
        <button aria-pressed={mode === "shop"} className={mode === "shop" ? "on" : ""} onClick={() => setMode("shop")}>
          {t(lang, "aroundTown")}
        </button>
      </div>
      {mode === "shelter" ? <div className="banner warn">{t(lang, "shelterCaveat")}</div> : null}
      {online ? <PlacesMap places={places} /> : <div className="banner off">{t(lang, "mapsNeedNetwork")}</div>}
      {nearest.slice(0, limit).map((r) => (
        <RecordCard key={r.record_id} r={r} compact />
      ))}
      {nearest.length > limit ? (
        <div className="actions" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={() => setLimit((n) => n + 20)}>
            {t(lang, "showMore")} ({nearest.length - limit})
          </button>
        </div>
      ) : null}
    </div>
  );
}
