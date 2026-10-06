import { describe, it, expect, vi } from "vitest";
import { createAiDashboardSummary } from "@/lib/summary-formatter";
import * as aiFunctions from "@/lib/ai.functions";
import type { DashboardData } from "@/types/dashboard";

vi.mock("@/lib/ai.functions", () => ({
  generateSummary: vi.fn().mockImplementation(async (payload) => {
    return `Summary generated for ${payload.data.puskesmas}`;
  }),
}));

describe("AI Summary Formatter Unit Tests (TC-AI-001)", () => {
  it("should format dashboard data into prompt payload for Gemini AI", async () => {
    const mockDashboardData: DashboardData = {
      nama: "Puskesmas Purwokerto Barat",
      isDinkesView: false,
      kunjunganPuskesmasNama: "Puskesmas Purwokerto Barat",
      totalKunjunganPuskesmas: 1200,
      pasienSakit: 300,
      pasienSembuh: 900,
      trenPenyakit: "Meningkat",
      trenPenyakitHint: "Kasus ISPA mendominasi",
      penyakitTeratas: [
        { nama: "ISPA", persen: 40 },
        { nama: "Diare", persen: 20 },
      ],
      ewsAlerts: [
        { penyakit: "ISPA", kasus: 120, threshold: 85, status: "SIAGA" },
      ],
      puskesmasAlerts: {},
      standarTenaga: [
        { nama: "Dokter", tersedia: 2, kebutuhan: 4, rasioPct: 50 },
      ],
      totalTenaga: 10,
      totalKebutuhan: 15,
      rasio: 67,
      prioritasNakes: {
        label: "Profesi Prioritas",
        nama: "Dokter",
        fullName: "Dokter Umum",
        keterangan: "Kurang 2 nakes",
      },
      okupansiRuang: [{ bulan: "Okt 2026", okupansi: 75 }],
      puskesmasList: [],
    };

    const result = await createAiDashboardSummary(
      mockDashboardData,
      "Oktober 2026",
    );

    expect(result).toBe("Summary generated for Puskesmas Purwokerto Barat");
    expect(aiFunctions.generateSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          puskesmas: "Puskesmas Purwokerto Barat",
          periode: "Oktober 2026",
        }),
      }),
    );
  });
});
