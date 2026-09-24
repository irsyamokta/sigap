export interface WorkforceItem {
  id?: string;
  jenisNakes: string;
  kebutuhan: number;
  tersedia: number;
}

export interface PuskesmasWorkforceData {
  puskesmasCode: string;
  submittedAt: string;
  submittedBy: string;
  items: WorkforceItem[];
}

export interface NakesRequirementInput {
  jenisNakes: string;
  kebutuhan: number;
  puskesmasCode?: string;
  puskesmasNama?: string;
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
