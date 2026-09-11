import type { PuskesmasId } from "@/data/dashboard";

export interface KecamatanPopulation {
  id: string;
  namaKecamatan: string;
  puskesmasId: PuskesmasId;
  puskesmasNama: string;
  jumlahPenduduk: number;
}

export interface NakesRatioItem {
  id: string;
  submissionItemId?: string;
  puskesmasCode?: string;
  namaKecamatan: string;
  puskesmasNama: string;
  jenisNakes: string;
  kebutuhan: number;
  jumlahPenduduk: number;
  ratio: number;
}

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
 * Service API-ready untuk mengambil data jumlah penduduk per kecamatan.
 * Saat API backend resmi tersedia, ganti implementasi mock ini dengan fetch/axios ke endpoint API.
 */
export async function fetchPopulationData(puskesmasId: PuskesmasId = "all"): Promise<KecamatanPopulation[]> {
  // Simulasi network delay kecil layaknya API call sungguhan
  await new Promise((resolve) => setTimeout(resolve, 150));

  if (puskesmasId === "all") {
    return MOCK_POPULATION_DATA;
  }
  return MOCK_POPULATION_DATA.filter((item) => item.puskesmasId === puskesmasId);
}

/**
 * Rumus Perhitungan Ratio Nakes berdasarkan Jumlah Penduduk:
 * Ratio = (Jumlah Nakes Kebutuhan / Jumlah Penduduk) * 1.000
 */
export function calculateNakesRatio(kebutuhan: number, jumlahPenduduk: number): number {
  if (!jumlahPenduduk || jumlahPenduduk <= 0) return 0;
  const ratio = (kebutuhan / jumlahPenduduk) * 1000;
  return Number(ratio.toFixed(2));
}

/**
 * Menghitung daftar ratio nakes per kecamatan dari data upload nakes & data penduduk
 */
export function processNakesRatios(
  nakesUploadList: { jenisNakes: string; kebutuhan: number }[],
  populationList: KecamatanPopulation[]
): NakesRatioItem[] {
  const result: NakesRatioItem[] = [];

  for (const pop of populationList) {
    for (const nakes of nakesUploadList) {
      const ratio = calculateNakesRatio(nakes.kebutuhan, pop.jumlahPenduduk);
      result.push({
        id: `${pop.id}_${nakes.jenisNakes.toLowerCase().replace(/\s+/g, "_")}`,
        namaKecamatan: pop.namaKecamatan,
        puskesmasNama: pop.puskesmasNama,
        jenisNakes: nakes.jenisNakes,
        kebutuhan: nakes.kebutuhan,
        jumlahPenduduk: pop.jumlahPenduduk,
        ratio,
      });
    }
  }

  return result;
}
