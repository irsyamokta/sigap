import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { DashboardData } from "@/data/dashboard";
import { Loader2 } from "lucide-react";

interface EwsMapProps {
  data: DashboardData;
}

export function EwsMap({ data }: EwsMapProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/banyumas.geojson")
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load geojson:", err);
        setLoading(false);
      });
  }, []);

  const getStyle = (feature: any) => {
    let fillColor = "#22c55e"; // Default normal (Green)
    let fillOpacity = 0.4;

    const code = feature.properties.puskesmasCode;
    const alerts = (data as any).puskesmasAlerts?.[code] || [];
    const hasSiaga = alerts.some((a: any) => a.status === "SIAGA");
    const hasWaspada = alerts.some((a: any) => a.status === "WASPADA");

    if (data.nama === "Semua Puskesmas") {
      if (hasSiaga) {
        fillColor = "#ef4444"; // Red
        fillOpacity = 0.6;
      } else if (hasWaspada) {
        fillColor = "#eab308"; // Yellow
        fillOpacity = 0.6;
      }
    } else {
      // If a specific puskesmas is selected, color its region based on its actual data
      const selectedId = (data as any).pId;
      if (code === selectedId) {
        const globalHasSiaga = data.ewsAlerts.some((a) => a.status === "SIAGA");
        const globalHasWaspada = data.ewsAlerts.some((a) => a.status === "WASPADA");
        if (globalHasSiaga) fillColor = "#ef4444";
        else if (globalHasWaspada) fillColor = "#eab308";
        fillOpacity = 0.6;
      } else {
        fillOpacity = 0.15; // Dim others
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
  };

  const onEachFeature = (feature: any, layer: any) => {
    if (feature.properties && feature.properties.name) {
      const code = feature.properties.puskesmasCode;
      const alerts = (data as any).puskesmasAlerts?.[code] || [];
      
      let statusText = "Normal";
      let statusColorClass = "text-green-600 font-semibold";
      
      if (alerts.length > 0) {
        statusText = alerts.map((a: any) => `${a.status} (${a.penyakit})`).join(", ");
        if (alerts.some((a: any) => a.status === "SIAGA")) {
          statusColorClass = "text-red-600 font-bold";
        } else {
          statusColorClass = "text-yellow-600 font-bold";
        }
      }

      // Create a tooltip popup
      const tooltipContent = `
        <div class="text-center font-sans p-1">
          <strong>${feature.properties.name}</strong><br/>
          <span class="${statusColorClass}">${statusText}</span>
        </div>
      `;
      layer.bindTooltip(tooltipContent, { permanent: false, direction: "center" });
    }
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
          style={getStyle}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}
