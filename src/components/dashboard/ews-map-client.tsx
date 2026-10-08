import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DashboardData } from "@/data/dashboard";
import { Loader2, Layers } from "lucide-react";
import { parseKmlToGeoJson } from "@/lib/kml-parser";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import batasDesaKml from "@/data/kml/batas_desa_kelurahan.kml?raw";
import batasKabKml from "@/data/kml/batas_kabupaten (2).kml?raw";
import kecBanyumasKml from "@/data/kml/kecbanyumas.kml?raw";

interface EwsMapProps {
  data: DashboardData;
}

interface GeoJsonFeature {
  properties?: {
    name?: string;
    puskesmasCode?: string;
    kecamatan?: string;
    desa?: string;
  };
}

interface EwsAlertItem {
  penyakit: string;
  kasus: number;
  threshold: number;
  status: "SIAGA" | "WASPADA";
}

type KmlSourceKey = "desa" | "kabupaten" | "kecamatan";

const TARGET_PUSKESMAS_CODES = [
  "purwokerto_barat",
  "patikraja",
  "sokaraja_1",
  "kembaran_1",
];

const KML_DATASETS: Record<KmlSourceKey, { label: string; raw: string }> = {
  desa: {
    label: "Batas Desa / Kelurahan",
    raw: batasDesaKml,
  },
  kabupaten: {
    label: "Batas Kabupaten",
    raw: batasKabKml,
  },
  kecamatan: {
    label: "Garis Kecamatan",
    raw: kecBanyumasKml,
  },
};

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

function buildTooltip(
  feature: GeoJsonFeature,
  data: DashboardData,
  dataset: KmlSourceKey,
): string {
  if (dataset === "kabupaten") {
    return `
      <div style="font-family:sans-serif;text-align:center;padding:4px 8px;min-width:140px">
        <strong style="font-size:12px">Kabupaten Banyumas</strong><br/>
        <span style="color:#2563eb;font-size:11px">Batas Administrasi Kabupaten</span>
      </div>
    `;
  }

  if (dataset === "kecamatan") {
    const name = feature.properties?.name || "Batas Kecamatan";
    return `
      <div style="font-family:sans-serif;text-align:center;padding:4px 8px;min-width:140px">
        <strong style="font-size:12px">${name}</strong><br/>
        <span style="color:#0284c7;font-size:11px">Garis Batas Kecamatan</span>
      </div>
    `;
  }

  const code = feature.properties?.puskesmasCode ?? "";

  if (data.isDinkesView && !TARGET_PUSKESMAS_CODES.includes(code)) {
    return "";
  }

  if (!data.isDinkesView && code !== data.pId) {
    return "";
  }

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

  return `
    <div style="font-family:sans-serif;text-align:center;padding:4px 8px;min-width:160px">
      <strong style="font-size:12px">${name}</strong><br/>
      <span style="color:${statusColor};font-size:11px">${statusText}</span>
    </div>
  `;
}

export function EwsMap({ data }: EwsMapProps) {
  const [selectedDataset, setSelectedDataset] = useState<KmlSourceKey>("desa");
  const [loading, setLoading] = useState(true);

  const dataRef = useRef<DashboardData>(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const layersRef = useRef<{ feature: GeoJsonFeature; layer: L.Path }[]>([]);

  const geoDataMap = useMemo(() => {
    const result: Partial<Record<KmlSourceKey, GeoJSON.FeatureCollection>> = {};
    try {
      result.desa = parseKmlToGeoJson(batasDesaKml);
      result.kabupaten = parseKmlToGeoJson(batasKabKml);
      result.kecamatan = parseKmlToGeoJson(kecBanyumasKml);
    } catch (err) {
      console.error("Error parsing KML dataset:", err);
    }
    return result;
  }, []);

  useEffect(() => {
    if (geoDataMap[selectedDataset]) {
      setLoading(false);
    }
  }, [geoDataMap, selectedDataset]);

  const currentGeoData = geoDataMap[selectedDataset] ?? null;

  useEffect(() => {
    for (const { feature, layer } of layersRef.current) {
      layer.setStyle(computeStyle(feature, dataRef.current));
    }
  }, [data, selectedDataset]);

  function computeStyle(feature: GeoJsonFeature, d: DashboardData) {
    if (selectedDataset === "kabupaten") {
      return {
        fillColor: "#3b82f6",
        weight: 2.5,
        opacity: 0.95,
        color: "#2563eb",
        dashArray: "",
        fillOpacity: 0.2,
      };
    }

    if (selectedDataset === "kecamatan") {
      return {
        fillColor: "#0284c7",
        weight: 2,
        opacity: 0.9,
        color: "#0284c7",
        dashArray: "4 3",
        fillOpacity: 0,
      };
    }

    const code = feature.properties?.puskesmasCode ?? "";
    const isTargetPuskesmas = TARGET_PUSKESMAS_CODES.includes(code);

    if (d.isDinkesView) {
      if (!isTargetPuskesmas) {
        return {
          fillColor: "#94a3b8",
          weight: 0,
          opacity: 0,
          color: "transparent",
          dashArray: "",
          fillOpacity: 0,
        };
      }

      const alerts = getAreaAlerts(feature, d);
      const status = getStatusFromAlerts(alerts);

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
        weight: 1.5,
        opacity: 0.9,
        color: "#ffffff",
        dashArray: "3",
        fillOpacity,
      };
    } else {
      const isSelected = code === d.pId;

      if (!isSelected) {
        return {
          fillColor: "#94a3b8",
          weight: 0,
          opacity: 0,
          color: "transparent",
          dashArray: "",
          fillOpacity: 0,
        };
      }

      const alerts = getAreaAlerts(feature, d);
      const status = getStatusFromAlerts(alerts);

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
        color: "#ffffff",
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
        const html = buildTooltip(feature, dataRef.current, selectedDataset);
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
        const isVisible =
          selectedDataset !== "desa" || d.isDinkesView || code === d.pId;
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

  if (!currentGeoData) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center rounded-xl border bg-muted/20">
        <p className="text-sm text-muted-foreground">Gagal memuat data peta KML</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border shadow-sm relative">
      <div className="absolute top-3 right-3 z-[1000]">
        <Select
          value={selectedDataset}
          onValueChange={(val) => {
            layersRef.current = [];
            setSelectedDataset(val as KmlSourceKey);
          }}
        >
          <SelectTrigger className="h-9 w-auto min-w-[185px] gap-2 rounded-xl border border-input/80 bg-background/90 backdrop-blur-md px-3 text-xs font-semibold shadow-md transition-all hover:bg-background/100 focus:ring-2 focus:ring-primary/30">
            <div className="flex items-center gap-2 truncate">
              <Layers className="size-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Pilih Layer Peta" />
            </div>
          </SelectTrigger>
          <SelectContent className="z-[2000] border-input/80 bg-background/95 backdrop-blur-md shadow-xl">
            {Object.entries(KML_DATASETS).map(([key, item]) => (
              <SelectItem key={key} value={key} className="text-xs font-medium cursor-pointer">
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <MapContainer
        center={[-7.445, 109.25]}
        zoom={11}
        scrollWheelZoom={false}
        className="h-[350px] w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        <GeoJSON
          key={selectedDataset}
          data={currentGeoData}
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


