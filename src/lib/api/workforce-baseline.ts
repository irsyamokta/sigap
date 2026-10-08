import type {
  WorkforceItem,
  PuskesmasWorkforceData,
  NakesRatioItem,
} from "@/types/workforce";
import type { PuskesmasId } from "@/types/dashboard";
import {
  fetchPopulationData,
  calculateNakesRatio,
  getTargetRatio,
} from "@/lib/api/population";

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
    return "Tenaga Kefarmasian";
  if (
    lower.includes("kesmas") ||
    lower.includes("promosi kesehatan") ||
    lower.includes("masyarakat")
  )
    return "Promosi Kesehatan";
  if (
    lower.includes("kesling") ||
    lower.includes("lingkungan") ||
    lower.includes("sanitarian")
  )
    return "Tenaga Kesehatan Lingkungan";
  if (lower.includes("gizi") || lower.includes("nutrisionis"))
    return "Tenaga Gizi";
  if (
    lower.includes("teklabmed") ||
    lower.includes("laboratorium") ||
    lower.includes("atlm")
  )
    return "ATLM";
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
    const apiBaseline = apiNakesBaselines?.[code];
    const submission = activeSubmissions.find((s) => s.puskesmasCode === code);

    // Prioritas: data dari upload Excel (submission), lalu API baseline
    let items: WorkforceItem[] = [];

    if (submission && submission.items.length > 0) {
      items = submission.items;
    } else if (apiBaseline && apiBaseline.length > 0) {
      items = apiBaseline.map((apiItem) => ({
        jenisNakes: normalizeNakesProfesi(apiItem.profesi),
        tersedia: apiItem.jumlah,
        kebutuhan: Math.max(apiItem.jumlah, Math.round(apiItem.jumlah * 1.5)),
      }));
    }

    for (const item of items) {
      const key = normalizeNakesProfesi(item.jenisNakes);
      const existing = map.get(key);
      if (existing) {
        existing.tersedia += item.tersedia;
        existing.kebutuhan += item.kebutuhan;
      } else {
        map.set(key, { tersedia: item.tersedia, kebutuhan: item.kebutuhan });
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
      const ratio = calculateNakesRatio(item.tersedia, pop.jumlahPenduduk);
      const targetRatio = getTargetRatio(canonicalName);
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
        tersedia: item.tersedia,
        jumlahPenduduk: pop.jumlahPenduduk,
        ratio,
        targetRatio,
        tanggalPengajuan: sub.submittedAt,
      });
    }
  }

  return result;
}
