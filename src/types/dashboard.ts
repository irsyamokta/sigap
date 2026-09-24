import type { NakesRatioItem } from "./workforce";

export type PuskesmasId =
  "all" | "purwokerto_barat" | "patikraja" | "sokaraja_1" | "kembaran_1";

export interface EwsAlert {
  penyakit: string;
  kasus: number;
  threshold: number;
  status: "SIAGA" | "WASPADA";
}

export interface EwsTrendItem {
  minggu: string;
  _isoKey: string;
  dbd: number;
  diare: number;
  ispa: number;
  thresholdDbd: number;
  thresholdDiare: number;
  thresholdIspa: number;
}

export interface DashboardData {
  nama: string;
  pasienSakit: number;
  pasienSembuh: number;
  trenPenyakit: string;
  trenPenyakitHint: string;
  penyakitTeratas: { nama: string; persen: number }[];
  tenagaPerProfesi: { nama: string; jumlah: number }[];
  standarTenaga: { nama: string; tersedia: number; kebutuhan: number }[];
  totalTenaga: number;
  totalKebutuhan: number;
  rasio: number;
  prioritasNakes: {
    label: string;
    nama: string;
    fullName: string;
    keterangan: string;
  };
  trenPerawatan: { bulan: string; sakit: number; sembuh: number }[];
  perbandinganKapasitas: { bulan: string; pasien: number; kapasitas: number }[];
  okupansiRuang: { bulan: string; okupansi: number }[];
  vektorPenyakit: { nama: string; kasus: number }[];
  ewsTren: EwsTrendItem[];
  ewsAlerts: EwsAlert[];
  kunjunganHarian: { label: string; total: number }[];
  totalKunjunganPuskesmas: number;
  kunjunganPuskesmasNama: string;
  kunjunganPuskesmasId: PuskesmasId;
  isDinkesView: boolean;
  insight: string[];
  pId: PuskesmasId;
  puskesmasAlerts: Record<string, EwsAlert[]>;
  nakesRatios: NakesRatioItem[];
}
