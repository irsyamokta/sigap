import type { SupportedPuskesmasId, SimpusDailyItem } from "@/types/simpus";
import { TARGET_PUSKESMAS } from "../config";
import { fetchWithTimeout, getCacheTTL } from "../utils";
import { dailyDataCache } from "../cache";
import { generateFallbackDailyItem } from "../fallback";

export async function fetchDailyPuskesmasData(
  code: SupportedPuskesmasId,
  dateStr: string,
  staticInfo: { isRawatInap: boolean; kapasitas: number },
  baseUrl: string,
  headers: Record<string, string>,
): Promise<SimpusDailyItem> {
  const cacheKey = `${code}_${dateStr}`;
  const now = Date.now();
  const cached = dailyDataCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const info = TARGET_PUSKESMAS[code];
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

    const penyakitMap: Record<string, number> = {};
    if (penyakitRes && penyakitRes.ok) {
      const penyakitJson = await penyakitRes.json();
      const list = penyakitJson?.response?.diagnosa;
      if (Array.isArray(list)) {
        for (const d of list) {
          const name = String(d.diagnosa || d.kodeDiagnosa || "").trim();
          const total = Number(d.total) || 0;
          if (name && total > 0) {
            penyakitMap[name] = (penyakitMap[name] || 0) + total;
          }
        }
      }
    }

    if (totalKunjungan > 0) {
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
        penyakit: penyakitMap,
      };
    }
  } catch {
    result = null;
  }

  let isFallback = false;
  if (!result) {
    result = generateFallbackDailyItem(code, dateStr, staticInfo);
    isFallback = true;
  }

  if (!isFallback) {
    dailyDataCache.set(cacheKey, {
      data: result,
      expiresAt: now + getCacheTTL(dateStr),
    });
  }

  return result;
}
