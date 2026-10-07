import type { SupportedPuskesmasId, SimpusPuskesmasInfo } from "@/types/simpus";

export const TARGET_PUSKESMAS: Record<
  SupportedPuskesmasId,
  SimpusPuskesmasInfo
> = {
  purwokerto_barat: {
    simpusId: "30",
    nama: "Puskesmas Purwokerto Barat",
    kecamatan: "Kecamatan Purwokerto Barat",
  },
  patikraja: {
    simpusId: "21",
    nama: "Puskesmas Patikraja",
    kecamatan: "Kecamatan Patikraja",
  },
  sokaraja_1: {
    simpusId: "32",
    nama: "Puskesmas Sokaraja 1",
    kecamatan: "Kecamatan Sokaraja",
  },
  kembaran_1: {
    simpusId: "10",
    nama: "Puskesmas Kembaran 1",
    kecamatan: "Kecamatan Kembaran",
  },
};

export const TARGET_PUSKESMAS_CODES: SupportedPuskesmasId[] = [
  "purwokerto_barat",
  "patikraja",
  "sokaraja_1",
  "kembaran_1",
];

export const CACHE_TTL_PAST = 24 * 60 * 60 * 1000; // 24 hours for historical data
export const CACHE_TTL_TODAY = 2 * 60 * 1000; // 2 minutes for current day
export const CACHE_TTL_STATIC = 60 * 60 * 1000; // 1 hour for static info
