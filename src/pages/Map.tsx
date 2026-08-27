import { useMemo, useState } from "react";
import { physicalRecords } from "../lib/data";
import { PlacesMap } from "../components/PlacesMap";
import { RecordCard } from "../components/RecordCard";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";

export function MapPage() {
  const { lang, online } = useStore();
  const [mode, setMode] = useState<"all" | "shelter" | "shul" | "shop">("all");
  const places = useMemo(() => {
    return physicalRecords.filter((r) => {
      if (mode === "shelter") return r.record_type === "public_shelter";
      if (mode === "shul") return r.record_type === "synagogue";
      if (mode === "shop") return r.record_type === "local_business" || r.category === "Ra'anana Businesses";
      return true;
    });
  }, [mode]);
  const nearest = [...places].sort(
    (a, b) => (a.distance_from_home_km_est ?? 99) - (b.distance_from_home_km_est ?? 99),
  );

  return (
    <div>
      <h1 style={{ fontFamily: "var(--display)" }}>{t(lang, "map")}</h1>
      <div className="filters">
        <button className={mode === "all" ? "on" : ""} onClick={() => setMode("all")}>
          {t(lang, "any")}
        </button>
        <button className={mode === "shelter" ? "on" : ""} onClick={() => setMode("shelter")}>
          {t(lang, "shelters")}
        </button>
        <button className={mode === "shul" ? "on" : ""} onClick={() => setMode("shul")}>
          {t(lang, "synagogues")}
        </button>
        <button className={mode === "shop" ? "on" : ""} onClick={() => setMode("shop")}>
          {t(lang, "aroundTown")}
        </button>
      </div>
      {mode === "shelter" ? <div className="banner warn">{t(lang, "shelterCaveat")}</div> : null}
      {online ? <PlacesMap places={places} /> : <div className="banner off">{t(lang, "mapsNeedNetwork")}</div>}
      {nearest.slice(0, 20).map((r) => (
        <RecordCard key={r.record_id} r={r} compact />
      ))}
    </div>
  );
}
