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

function getAreaAlerts(
  feature: GeoJsonFeature,
  data: DashboardData,
): EwsAlertItem[] {
  const code = feature.properties?.puskesmasCode ?? "";

  if (data.isDinkesView) {
    return data.puskesmasAlerts?.[code] ?? [];
  } else {
    return code === data.pId ? (data.ewsAlerts ?? []) : [];
  }
}

function getStatusFromAlerts(alerts: EwsAlertItem[]): "SIAGA" | "WASPADA" | "NORMAL" {
  if (alerts.length === 0) return "NORMAL";
  if (alerts.some((a) => a.status === "SIAGA")) return "SIAGA";
  return "WASPADA";
}

function buildTooltip(feature: GeoJsonFeature, data: DashboardData): string {
  const code = feature.properties?.puskesmasCode ?? "";
  const name = feature.properties?.name ?? code;
  const alerts = getAreaAlerts(feature, data);
  const overallStatus = getStatusFromAlerts(alerts);

  let statusText: string;
  let statusColor: string;

  if (overallStatus === "SIAGA") {
    statusColor = "#dc2626";
    statusText = alerts
      .map((a) => `<strong>SIAGA</strong> — ${a.penyakit} (${a.kasus} kasus)`)
      .join("<br/>");
  } else if (overallStatus === "WASPADA") {
    statusColor = "#ca8a04";
    statusText = alerts
      .map((a) => `<strong>WASPADA</strong> — ${a.penyakit} (${a.kasus} kasus)`)
      .join("<br/>");
  } else {
    statusColor = "#16a34a";
    statusText = "<strong>NORMAL</strong> — Semua indikator aman";
  }

  if (!data.isDinkesView && code !== data.pId) {
    return "";
  }

  return `
    <div style="font-family:sans-serif;text-align:center;padding:4px 8px;min-width:160px">
      <strong style="font-size:12px">${name}</strong><br/>
      <span style="color:${statusColor};font-size:11px">${statusText}</span>
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
    const code = feature.properties?.puskesmasCode ?? "";
    const alerts = getAreaAlerts(feature, d);
    const status = getStatusFromAlerts(alerts);

    if (d.isDinkesView) {
      let fillColor = "#22c55e";
      let fillOpacity = 0.45;

      if (status === "SIAGA") {
        fillColor = "#ef4444";
        fillOpacity = 0.65;
      } else if (status === "WASPADA") {
        fillColor = "#eab308";
        fillOpacity = 0.60;
      }

      return {
        fillColor,
        weight: 2,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity,
      };
    } else {
      const isSelected = code === d.pId;

      if (!isSelected) {
        return {
          fillColor: "#94a3b8",
          weight: 1,
          opacity: 0,
          color: "transparent",
          dashArray: "",
          fillOpacity: 0,
        };
      }

      let fillColor = "#22c55e";
      let fillOpacity = 0.65;

      if (status === "SIAGA") {
        fillColor = "#ef4444";
        fillOpacity = 0.70;
      } else if (status === "WASPADA") {
        fillColor = "#eab308";
        fillOpacity = 0.65;
      }

      return {
        fillColor,
        weight: 2.5,
        opacity: 1,
        color: "white",
        dashArray: "",
        fillOpacity,
      };
    }
  }

  const tooltip = useRef<L.Tooltip | null>(null);

  const onEachFeature = (feature: GeoJsonFeature, layer: L.Path) => {
    layersRef.current.push({ feature, layer });

    layer.on({
      mouseover(e: L.LeafletMouseEvent) {
        const html = buildTooltip(feature, dataRef.current);
        if (!html) return;

        if (!tooltip.current) {
          tooltip.current = L.tooltip({
            permanent: false,
            direction: "top",
            opacity: 0.95,
          });
        }
        tooltip.current.setContent(html);
        layer.bindTooltip(tooltip.current).openTooltip(e.latlng);

        const code = feature.properties?.puskesmasCode ?? "";
        const d = dataRef.current;
        const isVisible = d.isDinkesView || code === d.pId;
        if (isVisible) {
          layer.setStyle({ weight: 3, opacity: 1 });
        }
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
