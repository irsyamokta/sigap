import type { FeatureCollection, Feature, Geometry, Position } from "geojson";

export interface KmlGeoJsonProperties {
  name: string;
  desa?: string;
  kecamatan?: string;
  puskesmasCode?: string;
}

export function parseKmlToGeoJson(
  kmlString: string,
): FeatureCollection<Geometry, KmlGeoJsonProperties> {
  const features: Feature<Geometry, KmlGeoJsonProperties>[] = [];
  const placemarks = kmlString.split("</Placemark>");

  for (let i = 0; i < placemarks.length - 1; i++) {
    const pm = placemarks[i];

    const nameMatch = pm.match(/<name>(.*?)<\/name>/s);
    const rawName = nameMatch ? nameMatch[1].trim() : "";

    const kecMatch = pm.match(/<td>KECAMATAN<\/td>\s*<td>(.*?)<\/td>/i);
    const desaMatch = pm.match(/<td>DESA<\/td>\s*<td>(.*?)<\/td>/i);
    const kecamatan = kecMatch ? kecMatch[1].trim() : "";
    const desa = desaMatch ? desaMatch[1].trim() : "";

    let puskesmasCode = "";
    const kecLower = (kecamatan || rawName).toLowerCase();
    if (kecLower.includes("purwokerto barat")) puskesmasCode = "purwokerto_barat";
    else if (kecLower.includes("patikraja")) puskesmasCode = "patikraja";
    else if (kecLower.includes("sokaraja")) puskesmasCode = "sokaraja_1";
    else if (kecLower.includes("kembaran")) puskesmasCode = "kembaran_1";
    else {
      puskesmasCode = kecLower
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    }

    const featureName = desa
      ? `${desa} (${kecamatan})`
      : kecamatan || rawName || "Wilayah Banyumas";

    const coordBlocks = Array.from(
      pm.matchAll(/<coordinates>(.*?)<\/coordinates>/gs),
    );
    if (coordBlocks.length === 0) continue;

    if (pm.includes("<Polygon")) {
      const polygonRings: Position[][] = [];
      for (const block of coordBlocks) {
        const rawCoords = block[1].trim();
        const ring: Position[] = rawCoords
          .split(/\s+/)
          .filter(Boolean)
          .map((pt) => {
            const [lng, lat] = pt.split(",").map(Number);
            return [lng, lat];
          })
          .filter(([lng, lat]) => !isNaN(lng) && !isNaN(lat));
        if (ring.length > 2) {
          polygonRings.push(ring);
        }
      }

      if (polygonRings.length === 1) {
        features.push({
          type: "Feature",
          properties: {
            name: featureName,
            desa,
            kecamatan,
            puskesmasCode,
          },
          geometry: {
            type: "Polygon",
            coordinates: [polygonRings[0]],
          },
        });
      } else if (polygonRings.length > 1) {
        features.push({
          type: "Feature",
          properties: {
            name: featureName,
            desa,
            kecamatan,
            puskesmasCode,
          },
          geometry: {
            type: "MultiPolygon",
            coordinates: polygonRings.map((ring) => [ring]),
          },
        });
      }
    } else if (pm.includes("<LineString")) {
      for (const block of coordBlocks) {
        const rawCoords = block[1].trim();
        const line: Position[] = rawCoords
          .split(/\s+/)
          .filter(Boolean)
          .map((pt) => {
            const [lng, lat] = pt.split(",").map(Number);
            return [lng, lat];
          })
          .filter(([lng, lat]) => !isNaN(lng) && !isNaN(lat));
        if (line.length > 1) {
          features.push({
            type: "Feature",
            properties: {
              name: featureName || "Garis Batas",
              kecamatan,
              puskesmasCode,
            },
            geometry: {
              type: "LineString",
              coordinates: line,
            },
          });
        }
      }
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
