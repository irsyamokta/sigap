import { format, subDays, startOfWeek, getDate } from "date-fns";
import type { SupportedPuskesmasId } from "@/types/simpus";
import { TARGET_PUSKESMAS, TARGET_PUSKESMAS_CODES } from "../config";
import { fetchWithTimeout } from "../utils";
import { classifyDisease } from "@/lib/icd10-mapping";

export interface DiseaseThreshold {
  mean: number;
  stddev: number;
  waspada: number;
  siaga: number;
  weeksUsed: number;
}

export interface EwsBaseline {
  dbd: DiseaseThreshold;
  diare: DiseaseThreshold;
  ispa: DiseaseThreshold;
  computedAt: string;
}

const BASELINE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
let baselineCache: {
  data: Record<SupportedPuskesmasId, EwsBaseline>;
  computedAt: number;
} | null = null;

interface CumulativeCounts {
  dbd: number;
  diare: number;
  ispa: number;
}

const ZERO_COUNTS: CumulativeCounts = { dbd: 0, diare: 0, ispa: 0 };

const rawCache = new Map<string, CumulativeCounts>();

async function fetchCumulativeOnDate(
  dateStr: string,
  code: SupportedPuskesmasId,
  baseUrl: string,
  headers: Record<string, string>,
): Promise<CumulativeCounts> {
  const cacheKey = `baseline_${code}_${dateStr}`;
  if (rawCache.has(cacheKey)) return rawCache.get(cacheKey)!;

  const info = TARGET_PUSKESMAS[code];
  const url = `${baseUrl}/dashboard/kasus_penyakit?date=${dateStr}&puskesmasId=${info.simpusId}`;

  try {
    const res = await fetchWithTimeout(url, { headers });
    if (!res.ok) {
      rawCache.set(cacheKey, ZERO_COUNTS);
      return ZERO_COUNTS;
    }
    const json = await res.json();
    const list = json?.response?.diagnosa;

    const counts: CumulativeCounts = { dbd: 0, diare: 0, ispa: 0 };

    if (Array.isArray(list)) {
      for (const d of list) {
        const kode = String(d.kodeDiagnosa || "")
          .trim()
          .toUpperCase()
          .replace(/\.\d+$/, "");
        const nama = String(d.diagnosa || d.namaDiagnosa || "").trim();
        const total = Number(d.total) || 0;
        if (total <= 0) continue;

        const category = classifyDisease(kode, nama);
        if (category === "DBD") counts.dbd += total;
        else if (category === "Diare") counts.diare += total;
        else if (category === "ISPA") counts.ispa += total;
      }
    }

    rawCache.set(cacheKey, counts);
    return counts;
  } catch {
    rawCache.set(cacheKey, ZERO_COUNTS);
    return ZERO_COUNTS;
  }
}

async function getWeeklyIncrement(
  monday: Date,
  sunday: Date,
  code: SupportedPuskesmasId,
  baseUrl: string,
  headers: Record<string, string>,
): Promise<CumulativeCounts> {
  const mondayMonth = monday.getMonth();
  const sundayMonth = sunday.getMonth();
  const saturdayBeforeMonday = subDays(monday, 1);

  const sundayStr = format(sunday, "yyyy-MM-dd");

  if (mondayMonth === sundayMonth) {
    const cumSunday = await fetchCumulativeOnDate(sundayStr, code, baseUrl, headers);

    if (getDate(monday) === 1) {
      return cumSunday;
    }

    const cumSaturday = await fetchCumulativeOnDate(
      format(saturdayBeforeMonday, "yyyy-MM-dd"),
      code,
      baseUrl,
      headers,
    );

    return {
      dbd:   Math.max(0, cumSunday.dbd   - cumSaturday.dbd),
      diare: Math.max(0, cumSunday.diare - cumSaturday.diare),
      ispa:  Math.max(0, cumSunday.ispa  - cumSaturday.ispa),
    };
  } else {
    const lastDayOfFirstMonth = new Date(monday.getFullYear(), mondayMonth + 1, 0);
    const lastDayStr = format(lastDayOfFirstMonth, "yyyy-MM-dd");

    const cumLastDayFirstMonth = await fetchCumulativeOnDate(lastDayStr, code, baseUrl, headers);

    let firstMonthCases: CumulativeCounts;
    if (getDate(monday) === 1) {
      firstMonthCases = cumLastDayFirstMonth;
    } else {
      const cumSaturday = await fetchCumulativeOnDate(
        format(saturdayBeforeMonday, "yyyy-MM-dd"),
        code,
        baseUrl,
        headers,
      );
      firstMonthCases = {
        dbd:   Math.max(0, cumLastDayFirstMonth.dbd   - cumSaturday.dbd),
        diare: Math.max(0, cumLastDayFirstMonth.diare - cumSaturday.diare),
        ispa:  Math.max(0, cumLastDayFirstMonth.ispa  - cumSaturday.ispa),
      };
    }

    const cumSunday = await fetchCumulativeOnDate(sundayStr, code, baseUrl, headers);

    return {
      dbd:   firstMonthCases.dbd   + cumSunday.dbd,
      diare: firstMonthCases.diare + cumSunday.diare,
      ispa:  firstMonthCases.ispa  + cumSunday.ispa,
    };
  }
}

function computeStats(values: number[]): { mean: number; stddev: number } {
  const n = values.length;
  if (n === 0) return { mean: 0, stddev: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  return { mean, stddev: Math.sqrt(variance) };
}

function buildThreshold(values: number[]): DiseaseThreshold {
  const { mean, stddev } = computeStats(values);
  return {
    mean:      Math.round(mean * 10) / 10,
    stddev:    Math.round(stddev * 10) / 10,
    waspada:   Math.max(1, Math.round(mean + 1.5 * stddev)),
    siaga:     Math.max(2, Math.round(mean + 2.0 * stddev)),
    weeksUsed: values.length,
  };
}

export async function getEwsBaseline(
  baseUrl: string,
  headers: Record<string, string>,
): Promise<Record<SupportedPuskesmasId, EwsBaseline>> {
  if (baselineCache && Date.now() - baselineCache.computedAt < BASELINE_CACHE_TTL) {
    return baselineCache.data;
  }

  rawCache.clear();

  const today = new Date();

  const lastCompletedSunday = startOfWeek(today, { weekStartsOn: 1 });
  const lastSunday = subDays(lastCompletedSunday, 1);

  const weeks: Array<{ monday: Date; sunday: Date }> = [];
  for (let i = 0; i < 52; i++) {
    const sunday = subDays(lastSunday, i * 7);
    const monday = subDays(sunday, 6);
    weeks.push({ monday, sunday });
  }

  const result: Partial<Record<SupportedPuskesmasId, EwsBaseline>> = {};

  for (const code of TARGET_PUSKESMAS_CODES) {
    const dbdValues: number[] = [];
    const diareValues: number[] = [];
    const ispaValues: number[] = [];

    const BATCH = 4;
    for (let i = 0; i < weeks.length; i += BATCH) {
      const batch = weeks.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map(({ monday, sunday }) =>
          getWeeklyIncrement(monday, sunday, code, baseUrl, headers),
        ),
      );
      for (const r of results) {
        dbdValues.push(r.dbd);
        diareValues.push(r.diare);
        ispaValues.push(r.ispa);
      }
    }

    result[code] = {
      dbd:   buildThreshold(dbdValues),
      diare: buildThreshold(diareValues),
      ispa:  buildThreshold(ispaValues),
      computedAt: new Date().toISOString(),
    };
  }

  const data = result as Record<SupportedPuskesmasId, EwsBaseline>;
  baselineCache = { data, computedAt: Date.now() };

  return data;
}

/** Hitung threshold gabungan (semua puskesmas) untuk tampilan Dinkes */
export function aggregateBaselineForAll(
  baseline: Record<SupportedPuskesmasId, EwsBaseline>,
): EwsBaseline {
  const aggregate = (key: "dbd" | "diare" | "ispa"): DiseaseThreshold => {
    const all = TARGET_PUSKESMAS_CODES.map((c) => baseline[c][key]);
    const totalWeeks = all.reduce((s, t) => s + t.weeksUsed, 0);
    // Threshold gabungan = jumlah threshold tiap puskesmas
    return {
      mean:      all.reduce((s, t) => s + t.mean, 0),
      stddev:    all.reduce((s, t) => s + t.stddev, 0),
      waspada:   all.reduce((s, t) => s + t.waspada, 0),
      siaga:     all.reduce((s, t) => s + t.siaga, 0),
      weeksUsed: Math.round(totalWeeks / all.length),
    };
  };

  return {
    dbd:         aggregate("dbd"),
    diare:       aggregate("diare"),
    ispa:        aggregate("ispa"),
    computedAt:  new Date().toISOString(),
  };
}
