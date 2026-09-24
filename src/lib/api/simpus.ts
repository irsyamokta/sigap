import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  SupportedPuskesmasId,
  SimpusPuskesmasInfo,
  SimpusDailyItem,
  SimpusDashboardDataResponse,
} from "@/types/simpus";

export type {
  SupportedPuskesmasId,
  SimpusDailyItem,
  SimpusDashboardDataResponse,
};

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

let cachedToken: string | null = null;
let cachedTokenExpiresAt: number = 0;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

type StaticPuskesmasInfoResult = {
  code: SupportedPuskesmasId;
  isRawatInap: boolean;
  kapasitas: number;
  nakes: { profesi: string; jumlah: number }[];
};

const dailyDataCache = new Map<string, CacheEntry<SimpusDailyItem>>();
const staticInfoCache = new Map<
  SupportedPuskesmasId,
  CacheEntry<StaticPuskesmasInfoResult>
>();

const CACHE_TTL_PAST = 24 * 60 * 60 * 1000; // 24 hours for historical data
const CACHE_TTL_TODAY = 10 * 60 * 1000; // 10 minutes for current day
const CACHE_TTL_STATIC = 60 * 60 * 1000; // 1 hour for static info

function getCacheTTL(dateStr: string): number {
  const todayStr = new Date().toISOString().split("T")[0];
  return dateStr === todayStr ? CACHE_TTL_TODAY : CACHE_TTL_PAST;
}

async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let index = 0;

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (index < items.length) {
        const currentIndex = index++;
        results[currentIndex] = await fn(items[currentIndex]);
      }
    },
  );

  await Promise.all(workers);
  return results;
}

async function getSimpusToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  const baseUrl = process.env.BASE_URL || "https://simpus.banyumaskab.go.id/api_telkom/v1";
  const clientId = process.env.CLIENT_ID || "";
  const clientSecret = process.env.CLIENT_SECRET || "";

  const authRes = await fetch(`${baseUrl}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  });

  if (!authRes.ok) {
    throw new Error(`Gagal autentikasi SIMPUS API (HTTP ${authRes.status})`);
  }

  const authJson = await authRes.json();
  const token = authJson?.response?.access_token;
  if (!token) {
    throw new Error(
      "Token autentikasi tidak ditemukan dalam respons SIMPUS API",
    );
  }

  const remainingSeconds = authJson?.response?.remaining_seconds ?? 3600;
  cachedToken = token;
  cachedTokenExpiresAt = Date.now() + remainingSeconds * 1000;
  return token;
}

async function fetchPuskesmasStaticInfo(
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
    fetch(`${baseUrl}/dashboard/rawat_inap?puskesmasId=${info.simpusId}`, {
      headers,
    }).catch(() => null),
    fetch(
      `${baseUrl}/dashboard/tenaga_kesehatan?puskesmasId=${info.simpusId}`,
      { headers },
    ).catch(() => null),
  ]);

  let isRawatInap = false;
  let kapasitas = 0;
  if (rawatRes && rawatRes.ok) {
    const rawatJson = await rawatRes.json();
    isRawatInap = Boolean(rawatJson?.response?.kapasitasRanjang?.isRawatInap);
    kapasitas = Number(rawatJson?.response?.kapasitasRanjang?.kapasitas) || 0;
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

async function fetchDailyPuskesmasData(
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
  const [kunjRes, penyakitRes] = await Promise.all([
    fetch(
      `${baseUrl}/dashboard/kunjungan_pasien?date=${dateStr}&puskesmasId=${info.simpusId}`,
      { headers },
    ).catch(() => null),
    fetch(
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
  const pasienSembuh = Math.max(0, totalKunjungan - pasienSakit);

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

  const rawatInapPasien =
    staticInfo.isRawatInap && staticInfo.kapasitas > 0
      ? Math.min(staticInfo.kapasitas, Math.round(pasienSakit * 0.15))
      : 0;

  const result: SimpusDailyItem = {
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

  dailyDataCache.set(cacheKey, {
    data: result,
    expiresAt: now + getCacheTTL(dateStr),
  });

  return result;
}

export const fetchSimpusDashboardDataFn = createServerFn({ method: "POST" })
  .validator(z.object({ puskesmasId: z.string(), dates: z.array(z.string()) }))
  .handler(async ({ data }): Promise<SimpusDashboardDataResponse> => {
    const baseUrl =
      process.env.BASE_URL || "https://simpus.banyumaskab.go.id/api_telkom/v1";
    const token = await getSimpusToken();
    const headers = { Authorization: `Bearer ${token}` };

    const selectedCodes: SupportedPuskesmasId[] =
      data.puskesmasId === "all"
        ? TARGET_PUSKESMAS_CODES
        : TARGET_PUSKESMAS_CODES.includes(
              data.puskesmasId as SupportedPuskesmasId,
            )
          ? [data.puskesmasId as SupportedPuskesmasId]
          : TARGET_PUSKESMAS_CODES;

    const staticResults = await Promise.all(
      selectedCodes.map((code) =>
        fetchPuskesmasStaticInfo(code, baseUrl, headers),
      ),
    );

    const staticInfoMap = new Map<
      SupportedPuskesmasId,
      {
        isRawatInap: boolean;
        kapasitas: number;
        nakes: { profesi: string; jumlah: number }[];
      }
    >();
    const nakesBaselines: Record<
      string,
      { profesi: string; jumlah: number }[]
    > = {};

    for (const res of staticResults) {
      if (res) {
        staticInfoMap.set(res.code, res);
        nakesBaselines[res.code] = res.nakes;
      }
    }

    const taskItems: { code: SupportedPuskesmasId; dateStr: string }[] = [];
    for (const code of selectedCodes) {
      for (const dateStr of data.dates) {
        taskItems.push({ code, dateStr });
      }
    }

    const dailyData = await mapConcurrent(taskItems, 10, (item) => {
      const staticData = staticInfoMap.get(item.code) || {
        isRawatInap: false,
        kapasitas: 0,
        nakes: [],
      };
      return fetchDailyPuskesmasData(
        item.code,
        item.dateStr,
        staticData,
        baseUrl,
        headers,
      );
    });

    return { dailyData, nakesBaselines };
  });
