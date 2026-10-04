import type { SupportedPuskesmasId, SimpusDailyItem } from "@/types/simpus";

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export type StaticPuskesmasInfoResult = {
  code: SupportedPuskesmasId;
  isRawatInap: boolean;
  kapasitas: number;
  nakes: { profesi: string; jumlah: number }[];
};

export const dailyDataCache = new Map<string, CacheEntry<SimpusDailyItem>>();
export const staticInfoCache = new Map<
  SupportedPuskesmasId,
  CacheEntry<StaticPuskesmasInfoResult>
>();
