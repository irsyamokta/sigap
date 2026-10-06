import { describe, it, expect } from "vitest";
import { computeEwsMetrics } from "@/lib/dashboard/ews-calculator";

describe("EWS Calculator Unit Tests (TC-EWS-001)", () => {
  it("should compute global EWS metrics and alerts correctly", () => {
    const ewsMap = new Map();
    ewsMap.set("2026-W39", {
      dbd: 10,
      diare: 20,
      ispa: 50,
      label: "Minggu 39",
    });
    ewsMap.set("2026-W40", {
      dbd: 35, // threshold for 'all' is 28 -> SIAGA
      diare: 50, // threshold 55 -> WASPADA (> 0.85 * 55 = 46.75)
      ispa: 60, // threshold 120 -> Normal
      label: "Minggu 40",
    });

    const perPuskesmasEwsMap = new Map();

    const result = computeEwsMetrics(ewsMap, perPuskesmasEwsMap, "all");

    expect(result.ewsTren).toHaveLength(2);
    expect(result.ewsTren[1].dbd).toBe(35);
    expect(result.ewsTren[1].thresholdDbd).toBe(28);

    // Should generate alerts for DBD (SIAGA) and Diare (WASPADA)
    expect(result.ewsAlerts).toEqual([
      { penyakit: "DBD", kasus: 35, threshold: 28, status: "SIAGA" },
      { penyakit: "Diare", kasus: 50, threshold: 55, status: "WASPADA" },
    ]);
  });

  it("should compute per-Puskesmas EWS alerts correctly", () => {
    const ewsMap = new Map();
    const perPuskesmasEwsMap = new Map();

    const pWestData = new Map();
    pWestData.set("2026-W40", { dbd: 15, diare: 10, ispa: 30 }); // threshold purwokerto_barat: dbd 13 -> SIAGA
    perPuskesmasEwsMap.set("purwokerto_barat", pWestData);

    const result = computeEwsMetrics(
      ewsMap,
      perPuskesmasEwsMap,
      "purwokerto_barat",
    );

    expect(result.puskesmasAlerts.purwokerto_barat).toBeDefined();
    expect(result.puskesmasAlerts.purwokerto_barat).toEqual([
      { penyakit: "DBD", kasus: 15, threshold: 13, status: "SIAGA" },
    ]);
  });
});
