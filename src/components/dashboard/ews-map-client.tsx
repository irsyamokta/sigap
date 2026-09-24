import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DashboardData } from "@/data/dashboard";
import { Loader2 } from "lucide-react";

interface EwsMapProps {
  data: DashboardData;
}

interface GeoJsonFeature {
  properties?: {
    name?: string;
    puskesmasCode?: string;
  };
}

interface EwsAlertItem {
  penyakit: string;
  kasus: number;
  threshold: number;
  status: "SIAGA" | "WASPADA";
}

function buildTooltip(feature: GeoJsonFeature, data: DashboardData): string {
  const code = feature.properties?.puskesmasCode ?? "";
  const name = feature.properties?.name ?? code;
  const alerts: EwsAlertItem[] = data.puskesmasAlerts?.[code] ?? [];

  let statusText = "Normal";
  let color = "#16a34a";

  if (alerts.length > 0) {
    const hasSiaga = alerts.some((a) => a.status === "SIAGA");
    statusText = alerts
      .map((a) => `${a.status} — ${a.penyakit} (${a.kasus} kasus)`)
      .join("<br/>");
    color = hasSiaga ? "#dc2626" : "#ca8a04";
  }

  return `
    <div style="font-family:sans-serif;text-align:center;padding:4px 6px;min-width:140px">
      <strong style="font-size:12px">${name}</strong><br/>
      <span style="color:${color};font-size:11px;font-weight:600">${statusText}</span>
    </div>
  `;
}

export function EwsMap({ data }: EwsMapProps) {
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const dataRef = useRef<DashboardData>(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const layersRef = useRef<{ feature: GeoJsonFeature; layer: L.Path }[]>([]);

  useEffect(() => {
    fetch("/data/banyumas.geojson")
      .then((res) => res.json())
      .then((geo) => {
        setGeoData(geo);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load geojson:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    for (const { feature, layer } of layersRef.current) {
      layer.setStyle(computeStyle(feature, dataRef.current));
    }
  }, [data]);

  function computeStyle(feature: GeoJsonFeature, d: DashboardData) {
    let fillColor = "#22c55e";
    let fillOpacity = 0.4;

    const code = feature.properties?.puskesmasCode ?? "";
    const alerts: EwsAlertItem[] = d.puskesmasAlerts?.[code] ?? [];
    const hasSiaga = alerts.some((a) => a.status === "SIAGA");
    const hasWaspada = alerts.some((a) => a.status === "WASPADA");

    if (d.nama === "Semua Puskesmas") {
      if (hasSiaga) {
        fillColor = "#ef4444";
        fillOpacity = 0.65;
      } else if (hasWaspada) {
        fillColor = "#eab308";
        fillOpacity = 0.6;
      }
    } else {
      const selectedId = d.pId;
      if (code === selectedId) {
        const globalSiaga = d.ewsAlerts.some((a) => a.status === "SIAGA");
        const globalWaspada = d.ewsAlerts.some((a) => a.status === "WASPADA");
        fillColor = globalSiaga
          ? "#ef4444"
          : globalWaspada
            ? "#eab308"
            : "#22c55e";
        fillOpacity = 0.65;
      } else {
        fillOpacity = 0.12;
      }
    }

    return {
      fillColor,
      weight: 2,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity,
    };
  }

  const tooltip = useRef<L.Tooltip | null>(null);

  const onEachFeature = (feature: GeoJsonFeature, layer: L.Path) => {
    layersRef.current.push({ feature, layer });

    layer.on({
      mouseover(e: L.LeafletMouseEvent) {
        const html = buildTooltip(feature, dataRef.current);
        if (!tooltip.current) {
          tooltip.current = L.tooltip({
            permanent: false,
            direction: "top",
            opacity: 0.95,
          });
        }
        tooltip.current.setContent(html);
        layer.bindTooltip(tooltip.current).openTooltip(e.latlng);
        layer.setStyle({ weight: 3, opacity: 1 });
      },
      mousemove(e: L.LeafletMouseEvent) {
        tooltip.current?.setLatLng(e.latlng);
      },
      mouseout() {
        layer.closeTooltip();
        layer.unbindTooltip();
        layer.setStyle(computeStyle(feature, dataRef.current));
      },
    });
  };

  if (loading) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center rounded-xl border bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!geoData) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center rounded-xl border bg-muted/20">
        <p className="text-sm text-muted-foreground">Gagal memuat data peta</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border shadow-sm">
      <MapContainer
        center={[-7.445, 109.25]}
        zoom={12}
        scrollWheelZoom={false}
        className="h-[350px] w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        <GeoJSON
          data={geoData}
          style={(feature) =>
            computeStyle(feature as GeoJsonFeature, dataRef.current)
          }
          onEachFeature={(feature, layer) =>
            onEachFeature(feature as GeoJsonFeature, layer as L.Path)
          }
        />
      </MapContainer>
    </div>
  );
}
