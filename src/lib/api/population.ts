import type { PuskesmasId } from "@/types/dashboard";
import type { KecamatanPopulation } from "@/types/population";

export type { KecamatanPopulation };

const MOCK_POPULATION_DATA: KecamatanPopulation[] = [
  {
    id: "kec_purwokerto_barat",
    namaKecamatan: "Kecamatan Purwokerto Barat",
    puskesmasId: "purwokerto_barat",
    puskesmasNama: "Puskesmas Purwokerto Barat",
    jumlahPenduduk: 54224,
  },
  {
    id: "kec_patikraja",
    namaKecamatan: "Kecamatan Patikraja",
    puskesmasId: "patikraja",
    puskesmasNama: "Puskesmas Patikraja",
    jumlahPenduduk: 63770,
  },
  {
    id: "kec_sokaraja",
    namaKecamatan: "Kecamatan Sokaraja",
    puskesmasId: "sokaraja_1",
    puskesmasNama: "Puskesmas Sokaraja 1",
    jumlahPenduduk: 92436,
  },
  {
    id: "kec_kembaran",
    namaKecamatan: "Kecamatan Kembaran",
    puskesmasId: "kembaran_1",
    puskesmasNama: "Puskesmas Kembaran 1",
    jumlahPenduduk: 83955,
  },
];

/**
 * Service untuk mengambil data jumlah penduduk per kecamatan di Banyumas.
 */
export async function fetchPopulationData(
  puskesmasId: PuskesmasId = "all",
): Promise<KecamatanPopulation[]> {
  if (puskesmasId === "all") {
    return MOCK_POPULATION_DATA;
  }
  return MOCK_POPULATION_DATA.filter(
    (item) => item.puskesmasId === puskesmasId,
  );
}

/**
 * Target rasio nakes per 1.000 penduduk berdasarkan Permenkes/SDMK Nasional.
 * Promosi Kesehatan: 1 per faskes (tidak berbasis penduduk) → null.
 */
export const TARGET_RATIO_PER_1000: Record<string, number | null> = {
  Dokter: 1,
  "Dokter Gigi": 0.2,
  Perawat: 2.4,
  Bidan: 2,
  "Tenaga Kefarmasian": 1,
  "Promosi Kesehatan": null,
  "Tenaga Gizi": 0.35,
  "Tenaga Kesehatan Lingkungan": 0.21,
  ATLM: 0.354,
};

export function getTargetRatio(jenisNakes: string): number | null {
  return TARGET_RATIO_PER_1000[jenisNakes] ?? null;
}

/**
 * Rumus Perhitungan Rasio Nakes:
 * Rasio = (Jumlah Nakes Tersedia / Jumlah Penduduk) × 1.000
 */
export function calculateNakesRatio(
  tersedia: number,
  jumlahPenduduk: number,
): number {
  if (!jumlahPenduduk || jumlahPenduduk <= 0) return 0;
  const ratio = (tersedia / jumlahPenduduk) * 1000;
  return Number(ratio.toFixed(3));
}
