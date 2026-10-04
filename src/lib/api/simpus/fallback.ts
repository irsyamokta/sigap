import type { SupportedPuskesmasId, SimpusDailyItem } from "@/types/simpus";
import { TARGET_PUSKESMAS } from "./config";

export function generateFallbackDailyItem(
  code: SupportedPuskesmasId,
  dateStr: string,
  staticInfo: { isRawatInap: boolean; kapasitas: number },
): SimpusDailyItem {
  const info = TARGET_PUSKESMAS[code];
  const seed = (code + dateStr)
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const baseKunjungan =
    code === "sokaraja_1"
      ? 85
      : code === "kembaran_1"
        ? 75
        : code === "patikraja"
          ? 55
          : 65;
  const totalKunjungan = baseKunjungan + (seed % 25);
  const pasienSakit = Math.round(totalKunjungan * (0.8 + (seed % 10) / 100));
  const pasienSembuh = Math.max(0, totalKunjungan - pasienSakit);

  const ispa = 15 + (seed % 12);
  const diare = 8 + (seed % 7);
  const dbd = seed % 5 === 0 ? 4 + (seed % 4) : 1 + (seed % 3);
  const hipertensi = 12 + (seed % 8);
  const gastritis = 9 + (seed % 6);
  const diabetes = 7 + (seed % 5);
  const influenza = 10 + (seed % 6);

  const rawatInapPasien =
    staticInfo.isRawatInap && staticInfo.kapasitas > 0
      ? Math.min(staticInfo.kapasitas, Math.round(pasienSakit * 0.15))
      : 0;

  return {
    date: dateStr,
    puskesmasId: code,
    simpusId: info.simpusId,
    puskesmasNama: info.nama,
    kunjungan: {
      total: totalKunjungan,
      sakit: pasienSakit,
      sembuh: pasienSembuh,
    },
    rawatInap: {
      isRawatInap: staticInfo.isRawatInap,
      pasien: rawatInapPasien,
      kapasitas: staticInfo.kapasitas,
    },
    penyakit: {
      "ISPA (Infeksi Saluran Pernapasan Akut)": ispa,
      "Hipertensi Primary": hipertensi,
      "Diare & Gastroenteritis": diare,
      "Gastritis & Duodenitis": gastritis,
      "Demam Berdarah Dengue (DBD)": dbd,
      "Diabetes Mellitus": diabetes,
      "Influenza & Batuk": influenza,
    },
  };
}
