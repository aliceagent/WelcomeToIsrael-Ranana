import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import type { Resource } from "../lib/types";
import { useStore } from "../lib/store";
import { meta } from "../lib/data";
import { mapCategory } from "../lib/mapview";
import { isLowConfidence } from "../lib/geo";

export const homeIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:22px;height:22px;border-radius:50%;background:#1a2b24;border:3px solid #f3ead9"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const youIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:#1d6fd1;border:3px solid #fff;box-shadow:0 0 0 6px rgba(29,111,209,0.25)"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function pinIcon(r: Resource, active: boolean) {
  const cat = mapCategory(r);
  const approx = isLowConfidence(r) ? " approx" : "";
  return L.divIcon({
    className: "",
    html: `<span class="map-pin${active ? " active" : ""}${approx}" style="background:${cat.color}">${cat.icon}</span>`,
    iconSize: active ? [40, 40] : [30, 30],
    iconAnchor: active ? [20, 20] : [15, 15],
  });
}

function ClusterLayer({
  places,
  selectedId,
  onSelect,
}: {
  places: Resource[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const map = useMap();
  const markersRef = useRef(new Map<string, L.Marker>());

  useEffect(() => {
    const group = L.markerClusterGroup({
      maxClusterRadius: 46,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          className: "",
          html: `<span class="map-cluster">${cluster.getChildCount()}</span>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        }),
    });
    const markers = markersRef.current;
    markers.clear();
    for (const p of places) {
      if (p.latitude_est == null || p.longitude_est == null) continue;
      const marker = L.marker([p.latitude_est, p.longitude_est], { icon: pinIcon(p, false) });
      if (onSelect) marker.on("click", () => onSelect(p.record_id));
      markers.set(p.record_id, marker);
      group.addLayer(marker);
    }
    map.addLayer(group);
    const bounds = group.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.12), { maxZoom: 16 });
    return () => {
      map.removeLayer(group);
    };
    // Selection styling is handled below without rebuilding the cluster layer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, map, onSelect]);

  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const r = places.find((p) => p.record_id === id);
      if (r) marker.setIcon(pinIcon(r, id === selectedId));
      if (id === selectedId) marker.setZIndexOffset(1000);
      else marker.setZIndexOffset(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return null;
}

export function PlacesMap({
  places,
  highlight,
  selectedId,
  onSelect,
  tall,
}: {
  places: Resource[];
  highlight?: string;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  tall?: boolean;
}) {
  const { home, origin, originIsGps } = useStore();
  const center = useMemo<[number, number]>(() => [origin.lat, origin.lng], [origin]);
  const shown = places.filter((p) => p.latitude_est != null && p.longitude_est != null).slice(0, 400);
  const active = selectedId ?? highlight ?? null;

  return (
    <div className={`map-wrap${tall ? " tall" : ""}`}>
      <MapContainer center={center} zoom={14} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[home.lat, home.lng]} icon={homeIcon} title={meta.home_default.label} />
        {originIsGps ? <Marker position={[origin.lat, origin.lng]} icon={youIcon} zIndexOffset={900} /> : null}
        <ClusterLayer places={shown} selectedId={active} onSelect={onSelect} />
      </MapContainer>
    </div>
  );
}
