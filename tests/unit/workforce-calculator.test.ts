import { describe, it, expect } from "vitest";
import { computeWorkforceMetrics } from "@/lib/dashboard/workforce-calculator";
import type { PuskesmasId } from "@/types/dashboard";

describe("Workforce Calculator Unit Tests (TC-NAKES-001)", () => {
  const mockPuskesmasList = [
    { id: "all" as PuskesmasId, nama: "Semua Puskesmas" },
    { id: "purwokerto_barat" as PuskesmasId, nama: "Puskesmas Purwokerto Barat" },
    { id: "patikraja" as PuskesmasId, nama: "Puskesmas Patikraja" },
  ];

  it("should calculate total workforce and ratios accurately", () => {
    const activeSubmissions: any[] = [];
    const apiNakesBaselines = {
      purwokerto_barat: [
        { profesi: "Dokter", jumlah: 2 },
        { profesi: "Perawat", jumlah: 5 },
      ],
      patikraja: [
        { profesi: "Dokter", jumlah: 1 },
        { profesi: "Perawat", jumlah: 3 },
      ],
    };

    const result = computeWorkforceMetrics(
      "all",
      activeSubmissions,
      apiNakesBaselines,
      mockPuskesmasList,
    );

    expect(result.totalTenaga).toBeGreaterThan(0);
    expect(result.totalKebutuhan).toBeGreaterThan(0);
    expect(result.rasio).toBeGreaterThan(0);
    expect(result.prioritasNakes.label).toBe("Prioritas Kebutuhan");
  });

  it("should calculate priority profession when specific puskesmas is selected", () => {
    const activeSubmissions: any[] = [];
    const apiNakesBaselines = {
      purwokerto_barat: [
        { profesi: "Dokter", jumlah: 1 },
        { profesi: "Perawat", jumlah: 2 },
      ],
    };

    const result = computeWorkforceMetrics(
      "purwokerto_barat",
      activeSubmissions,
      apiNakesBaselines,
      mockPuskesmasList,
    );

    expect(result.prioritasNakes.label).toBe("Profesi Prioritas");
    expect(result.prioritasNakes.nama).toBeDefined();
  });
});
