import { format, eachDayOfInterval } from "date-fns";
import {
  getNakesSubmissionsFn,
  buildNakesRatiosFromSubmissions,
} from "@/lib/api/workforce";
import { fetchSimpusDashboardDataFn, TARGET_PUSKESMAS } from "@/lib/api/simpus";

import type { PuskesmasId, DashboardData } from "@/types/dashboard";
import type { PuskesmasWorkforceData } from "@/types/workforce";
import type { SimpusDailyItem } from "@/types/simpus";

import { computeEwsMetrics } from "@/lib/dashboard/ews-calculator";
import { computeWorkforceMetrics } from "@/lib/dashboard/workforce-calculator";
import {
  aggregateDailyData,
  buildTrendSeries,
  computeTrendPenyakit,
  computeTopPuskesmas,
  buildPrevDatesRange,
} from "@/lib/dashboard/data-aggregator";

export type { PuskesmasId, DashboardData };

export const puskesmasList: { id: PuskesmasId; nama: string }[] = [
  { id: "all", nama: "Semua Puskesmas" },
  { id: "purwokerto_barat", nama: TARGET_PUSKESMAS.purwokerto_barat.nama },
  { id: "patikraja", nama: TARGET_PUSKESMAS.patikraja.nama },
  { id: "sokaraja_1", nama: TARGET_PUSKESMAS.sokaraja_1.nama },
  { id: "kembaran_1", nama: TARGET_PUSKESMAS.kembaran_1.nama },
];

async function fetchSimpusData(
  pId: PuskesmasId,
  datesToFetch: string[],
): Promise<{
  dailyData: SimpusDailyItem[];
  nakesBaselines: Record<string, { profesi: string; jumlah: number }[]>;
}> {
  try {
    return await fetchSimpusDashboardDataFn({
      data: { puskesmasId: pId, dates: datesToFetch },
    });
  } catch (err) {
    console.error("Gagal mengambil data dari SIMPUS Telkom API:", err);
    return { dailyData: [], nakesBaselines: {} };
  }
}

async function fetchActiveSubmissions(
  pId: PuskesmasId,
): Promise<PuskesmasWorkforceData[]> {
  try {
    return await getNakesSubmissionsFn({ data: { puskesmasCode: pId } });
  } catch {
    return [];
  }
}

export async function fetchDashboardData(
  pId: PuskesmasId,
  startDate: Date,
  endDate: Date,
): Promise<DashboardData> {
  const allIntervalDays = eachDayOfInterval({ start: startDate, end: endDate });
  const selectedDays =
    allIntervalDays.length > 31 ? allIntervalDays.slice(-31) : allIntervalDays;
  const datesToFetch = selectedDays.map((d) => format(d, "yyyy-MM-dd"));

  const currentPeriodDays =
    Math.max(
      1,
      Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
      ),
    ) || 30;
  const prevDaysToFetch = buildPrevDatesRange(
    selectedDays,
    startDate,
    currentPeriodDays,
  );

  const allDatesToFetch = [...new Set([...datesToFetch, ...prevDaysToFetch])];
  const currentDatesSet = new Set(datesToFetch);
  const prevDatesSet = new Set(prevDaysToFetch);

  const [{ dailyData: allDailyData, nakesBaselines: apiNakesBaselines }, activeSubmissions] =
    await Promise.all([
      fetchSimpusData(pId, allDatesToFetch),
      fetchActiveSubmissions(pId),
    ]);

  const dailyData = allDailyData.filter((d) => currentDatesSet.has(d.date));
  const prevPasienSakit = allDailyData
    .filter((d) => prevDatesSet.has(d.date))
    .reduce((sum, d) => sum + d.kunjungan.sakit, 0);

  const nakesRatios = await buildNakesRatiosFromSubmissions(
    activeSubmissions,
    pId,
  );

  const {
    pasienSakit,
    pasienSembuh,
    penyakitCount,
    trenMap,
    ewsMap,
    dailyMap,
    perPuskesmasDailyMap,
    perPuskesmasEwsMap,
  } = aggregateDailyData(dailyData, startDate, endDate);

  const totalPenyakit =
    Object.values(penyakitCount).reduce((a, b) => a + b, 0) || 1;
  const penyakitTeratas = Object.entries(penyakitCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([nama, kasus]) => ({
      nama,
      persen: Number(((kasus / totalPenyakit) * 100).toFixed(1)),
    }));
  const vektorPenyakit = Object.entries(penyakitCount)
    .sort((a, b) => b[1] - a[1])
    .map(([nama, kasus]) => ({ nama, kasus }));

  const { trenPerawatan, perbandinganKapasitas, okupansiRuang } =
    buildTrendSeries(trenMap);

  const { ewsTren, ewsAlerts, puskesmasAlerts } = computeEwsMetrics(
    ewsMap,
    perPuskesmasEwsMap,
    pId,
  );

  const {
    standarTenaga,
    tenagaPerProfesi,
    totalTenaga,
    totalKebutuhan,
    rasio,
    prioritasNakes,
  } = computeWorkforceMetrics(
    pId,
    activeSubmissions,
    apiNakesBaselines,
    puskesmasList,
  );

  const { trenPenyakit, trenPenyakitHint } = computeTrendPenyakit(
    pasienSakit,
    datesToFetch.length,
    startDate,
    endDate,
    prevPasienSakit,
    prevDaysToFetch.length,
  );

  const { targetPuskesmasKunjungan, topPuskesmasNama } = computeTopPuskesmas(
    pId,
    puskesmasList,
    perPuskesmasDailyMap,
  );

  const sortedDailyEntries = Array.from(dailyMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const selectedDailyMap = perPuskesmasDailyMap.get(targetPuskesmasKunjungan);
  const totalKunjunganPuskesmas = selectedDailyMap
    ? Array.from(selectedDailyMap.values()).reduce((sum, v) => sum + v, 0)
    : 0;
  const kunjunganHarian = sortedDailyEntries.map(([isoDay, dayData]) => ({
    label: dayData.label,
    total: selectedDailyMap?.get(isoDay) ?? 0,
  }));

  return {
    nama: puskesmasList.find((p) => p.id === pId)?.nama ?? "Semua Puskesmas",
    pasienSakit,
    pasienSembuh,
    trenPenyakit,
    trenPenyakitHint,
    penyakitTeratas,
    tenagaPerProfesi,
    standarTenaga,
    totalTenaga,
    totalKebutuhan,
    rasio,
    prioritasNakes,
    trenPerawatan,
    perbandinganKapasitas,
    okupansiRuang,
    vektorPenyakit,
    ewsTren,
    ewsAlerts,
    kunjunganHarian,
    totalKunjunganPuskesmas,
    kunjunganPuskesmasNama: topPuskesmasNama,
    kunjunganPuskesmasId: targetPuskesmasKunjungan,
    isDinkesView: pId === "all",
    insight: [
      penyakitTeratas.length > 0
        ? `Kasus ${penyakitTeratas[0].nama} mendominasi dengan ${penyakitTeratas[0].persen}% dari total kasus.`
        : "Belum ada data kasus penyakit pada periode ini.",
      `Tingkat kesembuhan pasien mencapai ${pasienSakit ? ((pasienSembuh / pasienSakit) * 100).toFixed(1) : 0}%.`,
      `Rasio kecukupan tenaga kesehatan saat ini ${rasio}%.`,
    ],
    pId,
    puskesmasAlerts,
    nakesRatios,
  };
}
