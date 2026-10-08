import { describe, it, expect } from "vitest";
import { parseKmlToGeoJson } from "@/lib/kml-parser";

describe("parseKmlToGeoJson", () => {
  it("should parse Polygon placemark with kecamatan and desa properties", () => {
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <Placemark>
    <name>Pageraji</name>
    <description><![CDATA[
      <table>
        <tr><td>KECAMATAN</td><td>Cilongok</td></tr>
        <tr><td>DESA</td><td>Pageraji</td></tr>
      </table>
    ]]></description>
    <Polygon>
      <outerBoundaryIs>
        <LinearRing>
          <coordinates>
            109.15,-7.39,0 109.16,-7.39,0 109.16,-7.40,0 109.15,-7.40,0 109.15,-7.39,0
          </coordinates>
        </LinearRing>
      </outerBoundaryIs>
    </Polygon>
  </Placemark>
</Document>
</kml>`;

    const result = parseKmlToGeoJson(kmlContent);

    expect(result.type).toBe("FeatureCollection");
    expect(result.features).toHaveLength(1);
    const feature = result.features[0];
    expect(feature.properties?.name).toBe("Pageraji (Cilongok)");
    expect(feature.properties?.kecamatan).toBe("Cilongok");
    expect(feature.properties?.desa).toBe("Pageraji");
    expect(feature.properties?.puskesmasCode).toBe("cilongok");
    expect(feature.geometry.type).toBe("Polygon");
    if (feature.geometry.type === "Polygon") {
      expect(feature.geometry.coordinates).toHaveLength(1);
      expect(feature.geometry.coordinates[0]).toHaveLength(5);
    }
  });

  it("should correctly map Purwokerto Barat to purwokerto_barat puskesmasCode", () => {
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <Placemark>
    <name>Kedungwuluh</name>
    <description><![CDATA[
      <table>
        <tr><td>KECAMATAN</td><td>Purwokerto Barat</td></tr>
        <tr><td>DESA</td><td>Kedungwuluh</td></tr>
      </table>
    ]]></description>
    <Polygon>
      <outerBoundaryIs>
        <LinearRing>
          <coordinates>
            109.23,-7.42,0 109.24,-7.42,0 109.24,-7.43,0 109.23,-7.43,0 109.23,-7.42,0
          </coordinates>
        </LinearRing>
      </outerBoundaryIs>
    </Polygon>
  </Placemark>
</Document>
</kml>`;

    const result = parseKmlToGeoJson(kmlContent);
    expect(result.features[0].properties?.puskesmasCode).toBe("purwokerto_barat");
  });
});
