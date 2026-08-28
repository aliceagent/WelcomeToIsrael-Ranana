import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import type { Resource } from "../lib/types";
import { displayName } from "../lib/format";
import { recordPath } from "../lib/share";
import { useStore } from "../lib/store";
import { Distance } from "./RecordCard";
import { meta } from "../lib/data";

const colors: Record<string, string> = {
  synagogue: "#1c4a3c",
  public_shelter: "#c45c3e",
  local_business: "#3d6ea8",
  physical_service: "#2f6b56",
};

function iconFor(type: string) {
  const fill = colors[type] || "#c9a227";
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:22px;height:22px;border-radius:50%;background:${fill};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export const homeIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:22px;height:22px;border-radius:50%;background:#1a2b24;border:3px solid #f3ead9"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export function PlacesMap({ places, highlight }: { places: Resource[]; highlight?: string }) {
  const { lang, home, origin } = useStore();
  const center = useMemo<[number, number]>(() => [origin.lat, origin.lng], [origin]);
  const shown = places.filter((p) => p.latitude_est != null && p.longitude_est != null).slice(0, 250);

  return (
    <div className="map-wrap">
      <MapContainer center={center} zoom={14} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[home.lat, home.lng]} icon={homeIcon}>
          <Popup>{meta.home_default.label}</Popup>
        </Marker>
        {shown.map((p) => (
          <Marker
            key={p.record_id}
            position={[p.latitude_est as number, p.longitude_est as number]}
            icon={iconFor(p.record_type)}
            opacity={highlight && highlight !== p.record_id ? 0.55 : 1}
          >
            <Popup>
              <Link to={recordPath(p)}>{displayName(p, lang)}</Link>
              <div>
                <Distance r={p} />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
