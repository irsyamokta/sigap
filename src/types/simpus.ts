export type SupportedPuskesmasId =
  | "purwokerto_barat"
  | "patikraja"
  | "sokaraja_1"
  | "kembaran_1";

export interface SimpusPuskesmasInfo {
  simpusId: string;
  nama: string;
  kecamatan: string;
}

export interface PenyakitEntry {
  kode: string;
  nama: string;
  total: number;
}

export interface SimpusDailyItem {
  date: string;
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
  penyakit: PenyakitEntry[];
  nakesBaseline?: { profesi: string; jumlah: number }[];
}

export interface SimpusDashboardDataResponse {
  dailyData: SimpusDailyItem[];
  nakesBaselines: Record<string, { profesi: string; jumlah: number }[]>;
  kapasitasRawatInap?: Record<
    SupportedPuskesmasId,
    { isRawatInap: boolean; kapasitas: number }
  >;
}
