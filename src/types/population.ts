import type { PuskesmasId } from "./dashboard";

export interface KecamatanPopulation {
  id: string;
  namaKecamatan: string;
  puskesmasId: PuskesmasId;
  puskesmasNama: string;
  jumlahPenduduk: number;
}
