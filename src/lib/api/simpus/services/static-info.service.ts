import type { SupportedPuskesmasId } from "@/types/simpus";
import { TARGET_PUSKESMAS, CACHE_TTL_STATIC } from "../config";
import { fetchWithTimeout } from "../utils";
import { staticInfoCache, type StaticPuskesmasInfoResult } from "../cache";

export async function fetchPuskesmasStaticInfo(
  code: SupportedPuskesmasId,
  baseUrl: string,
  headers: Record<string, string>,
): Promise<StaticPuskesmasInfoResult | null> {
  const now = Date.now();
  const cached = staticInfoCache.get(code);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const info = TARGET_PUSKESMAS[code];
  if (!info) return null;

  const [rawatRes, nakesRes] = await Promise.all([
    fetchWithTimeout(
      `${baseUrl}/dashboard/rawat_inap?puskesmasId=${info.simpusId}`,
      {
        headers,
      },
    ).catch(() => null),
    fetchWithTimeout(
      `${baseUrl}/dashboard/tenaga_kesehatan?puskesmasId=${info.simpusId}`,
      { headers },
    ).catch(() => null),
  ]);

  let isRawatInap = code === "purwokerto_barat" || code === "sokaraja_1";
  let kapasitas =
    code === "purwokerto_barat" ? 15 : code === "sokaraja_1" ? 20 : 0;
  if (rawatRes && rawatRes.ok) {
    const rawatJson = await rawatRes.json();
    if (rawatJson?.response?.kapasitasRanjang) {
      isRawatInap = Boolean(rawatJson.response.kapasitasRanjang.isRawatInap);
      kapasitas =
        Number(rawatJson.response.kapasitasRanjang.kapasitas) || kapasitas;
    }
  }

  let nakesList: { profesi: string; jumlah: number }[] = [];
  if (nakesRes && nakesRes.ok) {
    const nakesJson = await nakesRes.json();
    const list = nakesJson?.response?.tenagaKesehatan;
    if (Array.isArray(list)) {
      nakesList = list.map((item: Record<string, unknown>) => ({
        profesi: String(item.profesi || "").trim(),
        jumlah: Number(item.jumlah) || 0,
      }));
    }
  }

  const result: StaticPuskesmasInfoResult = {
    code,
    isRawatInap,
    kapasitas,
    nakes: nakesList,
  };
  staticInfoCache.set(code, {
    data: result,
    expiresAt: now + CACHE_TTL_STATIC,
  });
  return result;
}
