export type SupportedPuskesmasId =
  "purwokerto_barat" | "patikraja" | "sokaraja_1" | "kembaran_1";

export interface SimpusPuskesmasInfo {
  simpusId: string;
  nama: string;
  kecamatan: string;
}

export interface SimpusDailyItem {
  date: string; // YYYY-MM-DD
  puskesmasId: SupportedPuskesmasId;
  simpusId: string;
  puskesmasNama: string;
  kunjungan: {
    total: number;
    sakit: number;
    sembuh: number;
  };
  rawatInap: {
    isRawatInap: boolean;
    pasien: number;
    kapasitas: number;
  };
  penyakit: Record<string, number>; // diagnosa -> total kasus
  nakesBaseline?: { profesi: string; jumlah: number }[];
}

export interface SimpusDashboardDataResponse {
  dailyData: SimpusDailyItem[];
  nakesBaselines: Record<string, { profesi: string; jumlah: number }[]>;
}
