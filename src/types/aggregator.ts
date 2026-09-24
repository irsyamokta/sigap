export interface AggregatedDailyRow {
  label: string;
  sakit: number;
  sembuh: number;
  pasien: number;
  kapasitas: number;
  days: number;
}

export interface AggregatedEwsRow {
  dbd: number;
  diare: number;
  ispa: number;
  label: string;
}

export interface AggregateMaps {
  pasienSakit: number;
  pasienSembuh: number;
  penyakitCount: Record<string, number>;
  trenMap: Map<string, AggregatedDailyRow>;
  ewsMap: Map<string, AggregatedEwsRow>;
  dailyMap: Map<string, { label: string; total: number }>;
  perPuskesmasDailyMap: Map<string, Map<string, number>>;
  perPuskesmasEwsMap: Map<
    string,
    Map<string, { dbd: number; diare: number; ispa: number }>
  >;
}
