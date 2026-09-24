import type { PuskesmasId } from "@/types/dashboard";
import type { KecamatanPopulation } from "@/types/population";

export type { KecamatanPopulation };

const MOCK_POPULATION_DATA: KecamatanPopulation[] = [
  {
    id: "kec_purwokerto_barat",
    namaKecamatan: "Kecamatan Purwokerto Barat",
    puskesmasId: "purwokerto_barat",
    puskesmasNama: "Puskesmas Purwokerto Barat",
    jumlahPenduduk: 48250,
  },
  {
    id: "kec_patikraja",
    namaKecamatan: "Kecamatan Patikraja",
    puskesmasId: "patikraja",
    puskesmasNama: "Puskesmas Patikraja",
    jumlahPenduduk: 56120,
  },
  {
    id: "kec_sokaraja",
    namaKecamatan: "Kecamatan Sokaraja",
    puskesmasId: "sokaraja_1",
    puskesmasNama: "Puskesmas Sokaraja 1",
    jumlahPenduduk: 89400,
  },
  {
    id: "kec_kembaran",
    namaKecamatan: "Kecamatan Kembaran",
    puskesmasId: "kembaran_1",
    puskesmasNama: "Puskesmas Kembaran 1",
    jumlahPenduduk: 78600,
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
 * Rumus Perhitungan Ratio Nakes berdasarkan Jumlah Penduduk:
 * Ratio = (Jumlah Nakes Kebutuhan / Jumlah Penduduk) * 1.000
 */
export function calculateNakesRatio(
  kebutuhan: number,
  jumlahPenduduk: number,
): number {
  if (!jumlahPenduduk || jumlahPenduduk <= 0) return 0;
  const ratio = (kebutuhan / jumlahPenduduk) * 1000;
  return Number(ratio.toFixed(2));
}
