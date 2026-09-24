import type {
  WorkforceItem,
  PuskesmasWorkforceData,
  NakesRatioItem,
} from "@/types/workforce";
import type { PuskesmasId } from "@/types/dashboard";
import { fetchPopulationData, calculateNakesRatio } from "@/lib/api/population";

export const DEFAULT_BASELINE_WORKFORCE: Record<string, WorkforceItem[]> = {
  purwokerto_barat: [
    { jenisNakes: "Dokter", tersedia: 4, kebutuhan: 12 },
    { jenisNakes: "Dokter Gigi", tersedia: 2, kebutuhan: 4 },
    { jenisNakes: "Perawat", tersedia: 14, kebutuhan: 20 },
    { jenisNakes: "Bidan", tersedia: 6, kebutuhan: 10 },
    { jenisNakes: "Farmasi", tersedia: 2, kebutuhan: 4 },
    { jenisNakes: "Kesmas", tersedia: 3, kebutuhan: 5 },
    { jenisNakes: "Kesling", tersedia: 2, kebutuhan: 3 },
    { jenisNakes: "Gizi", tersedia: 2, kebutuhan: 3 },
    { jenisNakes: "Teklabmed", tersedia: 2, kebutuhan: 4 },
  ],
  patikraja: [
    { jenisNakes: "Dokter", tersedia: 5, kebutuhan: 14 },
    { jenisNakes: "Dokter Gigi", tersedia: 2, kebutuhan: 5 },
    { jenisNakes: "Perawat", tersedia: 16, kebutuhan: 24 },
    { jenisNakes: "Bidan", tersedia: 8, kebutuhan: 12 },
    { jenisNakes: "Farmasi", tersedia: 3, kebutuhan: 5 },
    { jenisNakes: "Kesmas", tersedia: 4, kebutuhan: 6 },
    { jenisNakes: "Kesling", tersedia: 2, kebutuhan: 4 },
    { jenisNakes: "Gizi", tersedia: 2, kebutuhan: 4 },
    { jenisNakes: "Teklabmed", tersedia: 2, kebutuhan: 4 },
  ],
  sokaraja_1: [
    { jenisNakes: "Dokter", tersedia: 8, kebutuhan: 20 },
    { jenisNakes: "Dokter Gigi", tersedia: 3, kebutuhan: 6 },
    { jenisNakes: "Perawat", tersedia: 24, kebutuhan: 36 },
    { jenisNakes: "Bidan", tersedia: 12, kebutuhan: 18 },
    { jenisNakes: "Farmasi", tersedia: 4, kebutuhan: 7 },
    { jenisNakes: "Kesmas", tersedia: 5, kebutuhan: 8 },
    { jenisNakes: "Kesling", tersedia: 3, kebutuhan: 5 },
    { jenisNakes: "Gizi", tersedia: 3, kebutuhan: 5 },
    { jenisNakes: "Teklabmed", tersedia: 3, kebutuhan: 5 },
  ],
  kembaran_1: [
    { jenisNakes: "Dokter", tersedia: 6, kebutuhan: 18 },
    { jenisNakes: "Dokter Gigi", tersedia: 2, kebutuhan: 5 },
    { jenisNakes: "Perawat", tersedia: 20, kebutuhan: 32 },
    { jenisNakes: "Bidan", tersedia: 10, kebutuhan: 16 },
    { jenisNakes: "Farmasi", tersedia: 3, kebutuhan: 6 },
    { jenisNakes: "Kesmas", tersedia: 4, kebutuhan: 7 },
    { jenisNakes: "Kesling", tersedia: 2, kebutuhan: 4 },
    { jenisNakes: "Gizi", tersedia: 2, kebutuhan: 4 },
    { jenisNakes: "Teklabmed", tersedia: 2, kebutuhan: 4 },
  ],
};

export function normalizeNakesProfesi(rawName: string): string {
  const clean = rawName.trim();
  const lower = clean.toLowerCase();
  if (lower.includes("dokter gigi") || lower.includes("dr. gigi"))
    return "Dokter Gigi";
  if (lower.includes("dokter") || lower.includes("dr. umum")) return "Dokter";
  if (lower.includes("perawat")) return "Perawat";
  if (lower.includes("bidan")) return "Bidan";
  if (
    lower.includes("farmasi") ||
    lower.includes("kefarmasian") ||
    lower.includes("apoteker")
  )
    return "Farmasi";
  if (lower.includes("kesmas") || lower.includes("masyarakat")) return "Kesmas";
  if (
    lower.includes("kesling") ||
    lower.includes("lingkungan") ||
    lower.includes("sanitarian")
  )
    return "Kesling";
  if (lower.includes("gizi") || lower.includes("nutrisionis")) return "Gizi";
  if (
    lower.includes("teklabmed") ||
    lower.includes("laboratorium") ||
    lower.includes("atlm")
  )
    return "Teklabmed";
  return clean;
}

export function getMergedWorkforceData(
  puskesmasId: PuskesmasId,
  activeSubmissions: PuskesmasWorkforceData[],
  apiNakesBaselines?: Record<string, { profesi: string; jumlah: number }[]>,
): { nama: string; tersedia: number; kebutuhan: number }[] {
  const targetCodes =
    puskesmasId === "all"
      ? ["purwokerto_barat", "patikraja", "sokaraja_1", "kembaran_1"]
      : [puskesmasId];

  const map = new Map<string, { tersedia: number; kebutuhan: number }>();

  for (const code of targetCodes) {
    const defaultBaseline = DEFAULT_BASELINE_WORKFORCE[code] ?? [];
    const apiBaseline = apiNakesBaselines?.[code];

    let baselineItems: WorkforceItem[] = defaultBaseline;
    if (apiBaseline && apiBaseline.length > 0) {
      baselineItems = apiBaseline.map((apiItem) => {
        const canonicalName = normalizeNakesProfesi(apiItem.profesi);
        const def = defaultBaseline.find(
          (d) => normalizeNakesProfesi(d.jenisNakes) === canonicalName,
        );
        return {
          jenisNakes: canonicalName,
          tersedia: apiItem.jumlah,
          kebutuhan: def
            ? def.kebutuhan
            : Math.max(apiItem.jumlah, Math.round(apiItem.jumlah * 1.5)),
        };
      });
    }

    const submission = activeSubmissions.find((s) => s.puskesmasCode === code);

    for (const baseItem of baselineItems) {
      const key = normalizeNakesProfesi(baseItem.jenisNakes);
      const subItem = submission?.items.find(
        (i) => normalizeNakesProfesi(i.jenisNakes) === key,
      );

      const tersedia = baseItem.tersedia;
      const kebutuhan = subItem ? subItem.kebutuhan : baseItem.kebutuhan;

      const existing = map.get(key);
      if (existing) {
        existing.tersedia += tersedia;
        existing.kebutuhan += kebutuhan;
      } else {
        map.set(key, { tersedia, kebutuhan });
      }
    }

    if (submission) {
      for (const subItem of submission.items) {
        const key = normalizeNakesProfesi(subItem.jenisNakes);
        const existsInBaseline = baselineItems.some(
          (b) => normalizeNakesProfesi(b.jenisNakes) === key,
        );
        if (!existsInBaseline) {
          const existing = map.get(key);
          if (existing) {
            existing.kebutuhan += subItem.kebutuhan;
            if (subItem.tersedia > 0) existing.tersedia += subItem.tersedia;
          } else {
            map.set(key, {
              tersedia: subItem.tersedia,
              kebutuhan: subItem.kebutuhan,
            });
          }
        }
      }
    }
  }

  return Array.from(map.entries()).map(([nama, val]) => ({ nama, ...val }));
}

export async function buildNakesRatiosFromSubmissions(
  submissions: PuskesmasWorkforceData[],
  puskesmasId: PuskesmasId,
): Promise<NakesRatioItem[]> {
  const populationList = await fetchPopulationData(puskesmasId);
  const result: NakesRatioItem[] = [];

  for (const sub of submissions) {
    const pop = populationList.find((p) => p.puskesmasId === sub.puskesmasCode);
    if (!pop) continue;

    for (const item of sub.items) {
      if (item.kebutuhan <= 0 && item.tersedia <= 0) continue;
      const canonicalName = normalizeNakesProfesi(item.jenisNakes);
      const ratio = calculateNakesRatio(item.kebutuhan, pop.jumlahPenduduk);
      result.push({
        id:
          item.id ||
          `${pop.id}_${canonicalName.toLowerCase().replace(/\s+/g, "_")}`,
        submissionItemId: item.id,
        puskesmasCode: sub.puskesmasCode,
        namaKecamatan: pop.namaKecamatan,
        puskesmasNama: pop.puskesmasNama,
        jenisNakes: canonicalName,
        kebutuhan: item.kebutuhan,
        jumlahPenduduk: pop.jumlahPenduduk,
        ratio,
      });
    }
  }

  return result;
}
