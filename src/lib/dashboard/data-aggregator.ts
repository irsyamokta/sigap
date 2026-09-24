import { format, parseISO, startOfWeek, startOfMonth, subDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { SimpusDailyItem } from "@/types/simpus";
import type { PuskesmasId } from "@/types/dashboard";
import type {
  AggregatedDailyRow,
  AggregatedEwsRow,
  AggregateMaps,
} from "@/types/aggregator";

export type { AggregatedDailyRow, AggregatedEwsRow, AggregateMaps };

function classifyDisease(name: string): "dbd" | "diare" | "ispa" | null {
  const lower = name.toLowerCase();
  if (
    lower.includes("dbd") ||
    lower.includes("dengue") ||
    lower.includes("haemorrhagic") ||
    lower.includes("hemorrhagic") ||
    lower.includes("berdarah")
  )
    return "dbd";
  if (
    lower.includes("diare") ||
    lower.includes("diarrhoea") ||
    lower.includes("diarrhea") ||
    lower.includes("gastroenteritis") ||
    lower.includes("disentri") ||
    lower.includes("dehidrasi")
  )
    return "diare";
  if (
    lower.includes("ispa") ||
    lower.includes("pharyngitis") ||
    lower.includes("respiratory") ||
    lower.includes("rhinitis") ||
    lower.includes("influenza") ||
    lower.includes("cough") ||
    lower.includes("batuk") ||
    lower.includes("flu") ||
    lower.includes("nasopharyngitis") ||
    lower.includes("tonsilitis") ||
    lower.includes("laringitis") ||
    lower.includes("sinusitis") ||
    lower.includes("faringitis")
  )
    return "ispa";
  return null;
}

export function aggregateDailyData(
  dailyData: SimpusDailyItem[],
  startDate: Date,
  endDate: Date,
): AggregateMaps {
  const daysDiff =
    (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
  const groupBy = daysDiff > 30 ? "month" : "week";

  let pasienSakit = 0;
  let pasienSembuh = 0;
  const penyakitCount: Record<string, number> = {};
  const trenMap = new Map<string, AggregatedDailyRow>();
  const ewsMap = new Map<string, AggregatedEwsRow>();
  const dailyMap = new Map<string, { label: string; total: number }>();
  const perPuskesmasDailyMap = new Map<string, Map<string, number>>();
  const perPuskesmasEwsMap = new Map<
    string,
    Map<string, { dbd: number; diare: number; ispa: number }>
  >();

  for (const d of dailyData) {
    pasienSakit += d.kunjungan.sakit;
    pasienSembuh += d.kunjungan.sembuh;

    let dbdInDay = 0;
    let diareInDay = 0;
    let ispaInDay = 0;

    if (d.penyakit) {
      for (const [namaPenyakit, kasus] of Object.entries(d.penyakit)) {
        const jmlKasus = typeof kasus === "number" ? kasus : Number(kasus) || 0;
        penyakitCount[namaPenyakit] =
          (penyakitCount[namaPenyakit] ?? 0) + jmlKasus;
        const category = classifyDisease(namaPenyakit);
        if (category === "dbd") dbdInDay += jmlKasus;
        else if (category === "diare") diareInDay += jmlKasus;
        else if (category === "ispa") ispaInDay += jmlKasus;
      }
    }

    const dDate = parseISO(d.date);
    const timeKey =
      groupBy === "month"
        ? format(startOfMonth(dDate), "yyyy-MM-dd")
        : format(startOfWeek(dDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const timeLabel =
      groupBy === "month"
        ? format(startOfMonth(dDate), "MMM yy", { locale: idLocale })
        : format(startOfWeek(dDate, { weekStartsOn: 1 }), "dd MMM", {
            locale: idLocale,
          });

    if (!trenMap.has(timeKey)) {
      trenMap.set(timeKey, {
        label: timeLabel,
        sakit: 0,
        sembuh: 0,
        pasien: 0,
        kapasitas: 0,
        days: 0,
      });
    }
    const t = trenMap.get(timeKey)!;
    t.sakit += d.kunjungan.sakit;
    t.sembuh += d.kunjungan.sembuh;
    t.pasien += d.rawatInap.pasien;
    t.kapasitas += d.rawatInap.kapasitas;
    t.days += 1;

    const ewsIsoKey = format(
      startOfWeek(dDate, { weekStartsOn: 1 }),
      "yyyy-MM-dd",
    );
    const ewsLabel = `Minggu ${format(startOfWeek(dDate, { weekStartsOn: 1 }), "dd MMM", { locale: idLocale })}`;
    if (!ewsMap.has(ewsIsoKey)) {
      ewsMap.set(ewsIsoKey, { label: ewsLabel, dbd: 0, diare: 0, ispa: 0 });
    }
    const e = ewsMap.get(ewsIsoKey)!;
    e.dbd += dbdInDay;
    e.diare += diareInDay;
    e.ispa += ispaInDay;

    const pid = d.puskesmasId;
    const dayIsoKey = d.date;
    const dayLabel = format(dDate, "dd MMM", { locale: idLocale });
    if (!dailyMap.has(dayIsoKey))
      dailyMap.set(dayIsoKey, { label: dayLabel, total: 0 });
    dailyMap.get(dayIsoKey)!.total += d.kunjungan.total;

    if (!perPuskesmasDailyMap.has(pid))
      perPuskesmasDailyMap.set(pid, new Map());
    const pDailyMap = perPuskesmasDailyMap.get(pid)!;
    pDailyMap.set(
      dayIsoKey,
      (pDailyMap.get(dayIsoKey) ?? 0) + d.kunjungan.total,
    );

    if (!perPuskesmasEwsMap.has(pid)) perPuskesmasEwsMap.set(pid, new Map());
    const pEwsMap = perPuskesmasEwsMap.get(pid)!;
    if (!pEwsMap.has(ewsIsoKey))
      pEwsMap.set(ewsIsoKey, { dbd: 0, diare: 0, ispa: 0 });
    const pE = pEwsMap.get(ewsIsoKey)!;
    pE.dbd += dbdInDay;
    pE.diare += diareInDay;
    pE.ispa += ispaInDay;
  }

  return {
    pasienSakit,
    pasienSembuh,
    penyakitCount,
    trenMap,
    ewsMap,
    dailyMap,
    perPuskesmasDailyMap,
    perPuskesmasEwsMap,
  };
}

export function buildTrendSeries(trenMap: Map<string, AggregatedDailyRow>) {
  const clampPct = (n: number) => Math.max(3, Math.min(100, Math.round(n)));
  const trenPerawatan: { bulan: string; sakit: number; sembuh: number }[] = [];
  const perbandinganKapasitas: {
    bulan: string;
    pasien: number;
    kapasitas: number;
  }[] = [];
  const okupansiRuang: { bulan: string; okupansi: number }[] = [];

  const sortedEntries = Array.from(trenMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  for (const [, data] of sortedEntries) {
    const days = data.days || 1;
    trenPerawatan.push({
      bulan: data.label,
      sakit: data.sakit,
      sembuh: data.sembuh,
    });
    const avgPasien = Math.round(data.pasien / days);
    const avgKapasitas = Math.round(data.kapasitas / days);
    perbandinganKapasitas.push({
      bulan: data.label,
      pasien: avgPasien,
      kapasitas: avgKapasitas,
    });
    okupansiRuang.push({
      bulan: data.label,
      okupansi: avgKapasitas ? clampPct((avgPasien / avgKapasitas) * 100) : 0,
    });
  }

  return { trenPerawatan, perbandinganKapasitas, okupansiRuang };
}

export function computeTrendPenyakit(
  pasienSakit: number,
  dailyDataLength: number,
  startDate: Date,
  endDate: Date,
  prevPasienSakit: number,
  prevDaysCount: number,
): { trenPenyakit: string; trenPenyakitHint: string } {
  const currentPeriodDays =
    Math.max(
      1,
      Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
      ),
    ) || 30;

  const prevRate = prevPasienSakit / (prevDaysCount || 1);
  const currRate = pasienSakit / (dailyDataLength || 1);

  let trenPenyakitPct = 0;
  const trenPenyakit = (() => {
    if (prevRate === 0 && currRate === 0) return "Stabil";
    if (prevRate > 0) {
      trenPenyakitPct = Number(
        (((currRate - prevRate) / prevRate) * 100).toFixed(1),
      );
    }
    if (currRate > prevRate * 1.05) return "Meningkat";
    if (currRate < prevRate * 0.95) return "Menurun";
    return "Stabil";
  })();

  const trenPeriodLabel = `${currentPeriodDays} hari sebelumnya`;
  const trenPenyakitHint =
    trenPenyakitPct !== 0
      ? `${trenPenyakitPct > 0 ? "+" : ""}${trenPenyakitPct.toLocaleString("id-ID")}% dibanding ${trenPeriodLabel}`
      : `Stabil dibanding ${trenPeriodLabel}`;

  return { trenPenyakit, trenPenyakitHint };
}

export function computeTopPuskesmas(
  pId: PuskesmasId,
  puskesmasList: { id: PuskesmasId; nama: string }[],
  perPuskesmasDailyMap: Map<string, Map<string, number>>,
): { targetPuskesmasKunjungan: PuskesmasId; topPuskesmasNama: string } {
  if (pId === "all") {
    let maxTotal = -1;
    let topPid: PuskesmasId = "purwokerto_barat";
    for (const p of puskesmasList.filter((item) => item.id !== "all")) {
      const pDailyMap = perPuskesmasDailyMap.get(p.id);
      const totalVisits = pDailyMap
        ? Array.from(pDailyMap.values()).reduce((sum, v) => sum + v, 0)
        : 0;
      if (totalVisits > maxTotal) {
        maxTotal = totalVisits;
        topPid = p.id;
      }
    }
    return {
      targetPuskesmasKunjungan: topPid,
      topPuskesmasNama:
        puskesmasList.find((p) => p.id === topPid)?.nama ?? "Puskesmas",
    };
  }
  return {
    targetPuskesmasKunjungan: pId,
    topPuskesmasNama:
      puskesmasList.find((p) => p.id === pId)?.nama ?? "Puskesmas",
  };
}

export function buildPrevDatesRange(
  selectedDays: Date[],
  startDate: Date,
  currentPeriodDays: number,
): string[] {
  const prevPeriodStart = subDays(startDate, currentPeriodDays);
  return (
    selectedDays.length > 31 ? selectedDays.slice(-31) : selectedDays
  ).map((_, i) => format(subDays(prevPeriodStart, -i), "yyyy-MM-dd"));
}
