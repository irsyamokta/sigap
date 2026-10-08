import { format } from "date-fns";
import type { SupportedPuskesmasId, SimpusDailyItem, PenyakitEntry } from "@/types/simpus";
import { TARGET_PUSKESMAS } from "../config";
import { fetchWithTimeout, getCacheTTL } from "../utils";
import { dailyDataCache } from "../cache";

export async function fetchDailyPuskesmasData(
  code: SupportedPuskesmasId,
  dateStr: string,
  staticInfo: { isRawatInap: boolean; kapasitas: number },
  baseUrl: string,
  headers: Record<string, string>,
): Promise<SimpusDailyItem> {
  const info = TARGET_PUSKESMAS[code];

  const todayStr = format(new Date(), "yyyy-MM-dd");
  if (dateStr > todayStr) {
    return {
      date: dateStr,
      puskesmasId: code,
      simpusId: info.simpusId,
      puskesmasNama: info.nama,
      kunjungan: { total: 0, sakit: 0, sembuh: 0 },
      rawatInap: {
        isRawatInap: staticInfo.isRawatInap,
        pasien: 0,
        kapasitas: staticInfo.kapasitas,
      },
      penyakit: [],
    };
  }

  const cacheKey = `${code}_${dateStr}`;
  const now = Date.now();
  const cached = dailyDataCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  let result: SimpusDailyItem | null = null;

  try {
    const [kunjRes, penyakitRes] = await Promise.all([
      fetchWithTimeout(
        `${baseUrl}/dashboard/kunjungan_pasien?date=${dateStr}&puskesmasId=${info.simpusId}`,
        { headers },
      ).catch(() => null),
      fetchWithTimeout(
        `${baseUrl}/dashboard/kasus_penyakit?date=${dateStr}&puskesmasId=${info.simpusId}`,
        { headers },
      ).catch(() => null),
    ]);

    let totalKunjungan = 0;
    let pasienSakit = 0;
    if (kunjRes && kunjRes.ok) {
      const kunjJson = await kunjRes.json();
      const k = kunjJson?.response?.kunjungan;
      if (k) {
        totalKunjungan = Number(k.totalKunjungan) || 0;
        pasienSakit = Number(k.pasienSakit) || 0;
      }
    }

    const penyakitList: PenyakitEntry[] = [];
    if (penyakitRes && penyakitRes.ok) {
      const penyakitJson = await penyakitRes.json();
      const list = penyakitJson?.response?.diagnosa;
      if (Array.isArray(list)) {
        const seen = new Map<string, number>();
        for (const d of list) {
          const kode = String(d.kodeDiagnosa || "")
            .trim()
            .toUpperCase()
            .replace(/\.\d+$/, "");
          const nama = String(d.diagnosa || d.namaDiagnosa || "").trim();
          const total = Number(d.total) || 0;
          if ((!kode && !nama) || total <= 0) continue;

          const dedupeKey = kode || nama;
          if (seen.has(dedupeKey)) {
            penyakitList[seen.get(dedupeKey)!].total += total;
          } else {
            seen.set(dedupeKey, penyakitList.length);
            penyakitList.push({ kode, nama, total });
          }
        }
      }
    }

    const pasienSembuh = Math.max(0, totalKunjungan - pasienSakit);
    const rawatInapPasien =
      staticInfo.isRawatInap && staticInfo.kapasitas > 0
        ? Math.min(staticInfo.kapasitas, Math.round(pasienSakit * 0.15))
        : 0;

    result = {
      date: dateStr,
      puskesmasId: code,
      simpusId: info.simpusId,
      puskesmasNama: info.nama,
      kunjungan: {
        total: totalKunjungan,
        sakit: pasienSakit,
        sembuh: pasienSembuh,
      },
      rawatInap: {
        isRawatInap: staticInfo.isRawatInap,
        pasien: rawatInapPasien,
        kapasitas: staticInfo.kapasitas,
      },
      penyakit: penyakitList,
    };
  } catch (err) {
    console.error(`Error fetching SIMPUS data for ${code} on ${dateStr}:`, err);
    result = null;
  }

  if (!result) {
    result = {
      date: dateStr,
      puskesmasId: code,
      simpusId: info.simpusId,
      puskesmasNama: info.nama,
      kunjungan: { total: 0, sakit: 0, sembuh: 0 },
      rawatInap: {
        isRawatInap: staticInfo.isRawatInap,
        pasien: 0,
        kapasitas: staticInfo.kapasitas,
      },
      penyakit: [],
    };
  } else {
    dailyDataCache.set(cacheKey, {
      data: result,
      expiresAt: now + getCacheTTL(dateStr),
    });
  }

  return result;
}
