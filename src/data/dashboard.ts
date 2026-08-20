import { format, parseISO, startOfWeek, startOfMonth, isWithinInterval, subDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export type PuskesmasId = "all" | "purwokerto_barat" | "patikraja" | "sokaraja_1" | "kembaran_1";

export const puskesmasList: { id: PuskesmasId; nama: string }[] = [
  { id: "all", nama: "Semua Puskesmas" },
  { id: "purwokerto_barat", nama: "Puskesmas Purwokerto Barat" },
  { id: "patikraja", nama: "Puskesmas Patikraja" },
  { id: "sokaraja_1", nama: "Puskesmas Sokaraja 1" },
  { id: "kembaran_1", nama: "Puskesmas Kembaran 1" },
];

const clampPct = (n: number) => Math.max(3, Math.min(100, Math.round(n)));

// Static workforce data per puskesmas (since this rarely changes daily)
const workforceData: Record<string, { nama: string, tersedia: number, kebutuhan: number }[]> = {
  purwokerto_barat: [
    { nama: "Dokter", tersedia: 6, kebutuhan: 8 },
    { nama: "Perawat", tersedia: 20, kebutuhan: 22 },
    { nama: "Bidan", tersedia: 5, kebutuhan: 6 },
    { nama: "Dokter Gigi", tersedia: 2, kebutuhan: 2 },
    { nama: "Kesmas", tersedia: 3, kebutuhan: 4 },
  ],
  patikraja: [
    { nama: "Dokter", tersedia: 3, kebutuhan: 4 },
    { nama: "Perawat", tersedia: 12, kebutuhan: 12 },
    { nama: "Bidan", tersedia: 3, kebutuhan: 4 },
    { nama: "Dokter Gigi", tersedia: 1, kebutuhan: 1 },
    { nama: "Kesmas", tersedia: 2, kebutuhan: 2 },
  ],
  sokaraja_1: [
    { nama: "Dokter", tersedia: 5, kebutuhan: 5 },
    { nama: "Perawat", tersedia: 15, kebutuhan: 18 },
    { nama: "Bidan", tersedia: 4, kebutuhan: 4 },
    { nama: "Dokter Gigi", tersedia: 1, kebutuhan: 2 },
    { nama: "Kesmas", tersedia: 3, kebutuhan: 3 },
  ],
  kembaran_1: [
    { nama: "Dokter", tersedia: 4, kebutuhan: 5 },
    { nama: "Perawat", tersedia: 11, kebutuhan: 14 },
    { nama: "Bidan", tersedia: 2, kebutuhan: 3 },
    { nama: "Dokter Gigi", tersedia: 2, kebutuhan: 2 },
    { nama: "Kesmas", tersedia: 2, kebutuhan: 3 },
  ]
};

export async function fetchDashboardData(pId: PuskesmasId, startDate: Date, endDate: Date) {
  // Fetch the mock API JSON file
  const response = await fetch('/data/dinkominfo-api.json');
  const allData: any[] = await response.json();

  // Filter by date range and puskesmas
  const filtered = allData.filter(d => {
    const dDate = parseISO(d.date);
    const inRange = isWithinInterval(dDate, { start: startDate, end: endDate });
    const isPuskesmas = pId === "all" || d.puskesmasId === pId;
    return inRange && isPuskesmas;
  });

  // Aggregate values
  let pasienSakit = 0;
  let pasienSembuh = 0;
  let rawatInapPasien = 0;
  let rawatInapKapasitas = 0;
  let countDays = 0;

  // Diseases count map (aggregated dynamically from database)
  const penyakitCount: Record<string, number> = {};

  // trenMap keyed by ISO period start for reliable sorting; stores days count for rate normalization
  const trenMap = new Map<string, { label: string, sakit: number, sembuh: number, pasien: number, kapasitas: number, days: number }>();
  // ewsMap keyed by ISO week start (e.g. "2026-08-10") for correct sorting & lookup
  const ewsMap = new Map<string, { dbd: number, diare: number, ispa: number, label: string }>();
  // Daily visit map — always per calendar day, used exclusively for kunjunganHarian chart
  const dailyMap = new Map<string, { label: string, total: number }>();
  // Per-puskesmas daily visits for multi-line Dinkes chart (keyed by ISO day)
  const perPuskesmasDailyMap = new Map<string, Map<string, number>>();
  // Per-puskesmas weekly EWS tracking (also keyed by ISO week start)
  const perPuskesmasEwsMap = new Map<string, Map<string, { dbd: number, diare: number, ispa: number }>>();

  // Determine grouping based on range duration (if > 60 days group by month, else by week)
  const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
  const groupBy = daysDiff > 60 ? "month" : "week";

  for (const d of filtered) {
    pasienSakit += d.kunjungan.sakit;
    pasienSembuh += d.kunjungan.sembuh;
    
    // Average capacity calculation requires summing then dividing by count
    rawatInapPasien += d.rawatInap.pasien;
    rawatInapKapasitas += d.rawatInap.kapasitas;
    countDays++;

    // Diseases (aggregated dynamically from keys present in the database record)
    if (d.penyakit) {
      for (const [namaPenyakit, kasus] of Object.entries(d.penyakit)) {
        const jmlKasus = typeof kasus === "number" ? kasus : Number(kasus) || 0;
        penyakitCount[namaPenyakit] = (penyakitCount[namaPenyakit] ?? 0) + jmlKasus;
      }
    }

    // Time grouping — key is ISO date for sorting, label is display string
    const dDate = parseISO(d.date);
    let timeKey = "";
    let timeLabel = "";
    if (groupBy === "month") {
      const mStart = startOfMonth(dDate);
      timeKey = format(mStart, "yyyy-MM-dd");
      timeLabel = format(mStart, "MMM yy", { locale: idLocale });
    } else {
      const wStart = startOfWeek(dDate, { weekStartsOn: 1 });
      timeKey = format(wStart, "yyyy-MM-dd");
      timeLabel = format(wStart, "dd MMM", { locale: idLocale });
    }

    if (!trenMap.has(timeKey)) {
      trenMap.set(timeKey, { label: timeLabel, sakit: 0, sembuh: 0, pasien: 0, kapasitas: 0, days: 0 });
    }
    const t = trenMap.get(timeKey)!;
    t.sakit += d.kunjungan.sakit;
    t.sembuh += d.kunjungan.sembuh;
    t.pasien += d.rawatInap.pasien;
    t.kapasitas += d.rawatInap.kapasitas;
    t.days += 1;

    // EWS is always weekly for the line chart, regardless of global grouping
    const ewsStart = startOfWeek(dDate, { weekStartsOn: 1 });
    // Use ISO string as the internal key so JS Date can sort/compare correctly
    const ewsIsoKey = format(ewsStart, "yyyy-MM-dd");
    const ewsLabel = format(ewsStart, "dd MMM yy", { locale: idLocale });
    if (!ewsMap.has(ewsIsoKey)) {
      ewsMap.set(ewsIsoKey, { dbd: 0, diare: 0, ispa: 0, label: ewsLabel });
    }
    const e = ewsMap.get(ewsIsoKey)!;
    e.dbd += d.penyakit.DBD ?? 0;
    e.diare += d.penyakit.Diare ?? 0;
    e.ispa += d.penyakit.ISPA ?? 0;

    // Daily visit tracking (always per calendar day, for kunjunganHarian chart)
    const pid = d.puskesmasId as string;
    const dayIsoKey = d.date; // already in "yyyy-MM-dd" format
    const dayLabel = format(dDate, "dd MMM", { locale: idLocale });
    if (!dailyMap.has(dayIsoKey)) {
      dailyMap.set(dayIsoKey, { label: dayLabel, total: 0 });
    }
    dailyMap.get(dayIsoKey)!.total += d.kunjungan.total;

    // Per-puskesmas daily visit tracking for multi-line chart
    if (!perPuskesmasDailyMap.has(pid)) {
      perPuskesmasDailyMap.set(pid, new Map());
    }
    const pDailyMap = perPuskesmasDailyMap.get(pid)!;
    pDailyMap.set(dayIsoKey, (pDailyMap.get(dayIsoKey) ?? 0) + d.kunjungan.total);

    // Per-puskesmas EWS tracking (keyed by ISO date for reliable lookup)
    if (!perPuskesmasEwsMap.has(pid)) {
      perPuskesmasEwsMap.set(pid, new Map());
    }
    const pEwsMap = perPuskesmasEwsMap.get(pid)!;
    if (!pEwsMap.has(ewsIsoKey)) {
      pEwsMap.set(ewsIsoKey, { dbd: 0, diare: 0, ispa: 0 });
    }
    const pE = pEwsMap.get(ewsIsoKey)!;
    pE.dbd += d.penyakit.DBD ?? 0;
    pE.diare += d.penyakit.Diare ?? 0;
    pE.ispa += d.penyakit.ISPA ?? 0;
  }

  // Finalize Top Diseases
  const totalPenyakit = Object.values(penyakitCount).reduce((a, b) => a + b, 0) || 1;
  const penyakitTeratas = Object.entries(penyakitCount)
    .sort((a, b) => b[1] - a[1])
    .map(([nama, kasus]) => ({
      nama,
      persen: Number(((kasus / totalPenyakit) * 100).toFixed(1))
    }));
  const vektorPenyakit = Object.entries(penyakitCount)
    .sort((a, b) => b[1] - a[1])
    .map(([nama, kasus]) => ({ nama, kasus }));

  // Finalize Tren Perawatan & Okupansi
  const trenPerawatan = [];
  const perbandinganKapasitas = [];
  const okupansiRuang = [];

  // Sort by ISO key (chronological), use label for display
  const sortedTrenEntries = Array.from(trenMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  for (const [, data] of sortedTrenEntries) {
    const days = data.days || 1;
    trenPerawatan.push({ bulan: data.label, sakit: data.sakit, sembuh: data.sembuh });

    const avgPasien = Math.round(data.pasien / days);
    const avgKapasitas = Math.round(data.kapasitas / days);
    perbandinganKapasitas.push({ bulan: data.label, pasien: avgPasien, kapasitas: avgKapasitas });
    okupansiRuang.push({ bulan: data.label, okupansi: avgKapasitas ? clampPct((avgPasien / avgKapasitas) * 100) : 0 });
  }

  // Finalize Workforce
  const standarTenaga: { nama: string, tersedia: number, kebutuhan: number }[] = [
    { nama: "Dokter", tersedia: 0, kebutuhan: 0 },
    { nama: "Perawat", tersedia: 0, kebutuhan: 0 },
    { nama: "Bidan", tersedia: 0, kebutuhan: 0 },
    { nama: "Dokter Gigi", tersedia: 0, kebutuhan: 0 },
    { nama: "Kesmas", tersedia: 0, kebutuhan: 0 },
  ];

  const targetPuskesmas = pId === "all" ? Object.keys(workforceData) : [pId];
  for (const p of targetPuskesmas) {
    const wf = workforceData[p];
    for (let i = 0; i < standarTenaga.length; i++) {
      standarTenaga[i].tersedia += wf[i].tersedia;
      standarTenaga[i].kebutuhan += wf[i].kebutuhan;
    }
  }

  const tenagaPerProfesi = standarTenaga.map(s => ({ nama: s.nama, jumlah: s.tersedia }));
  const totalTenaga = standarTenaga.reduce((a, b) => a + b.tersedia, 0);
  const totalKebutuhan = standarTenaga.reduce((a, b) => a + b.kebutuhan, 0);
  const rasio = totalKebutuhan ? clampPct((totalTenaga / totalKebutuhan) * 100) : 0;

  // EWS 
  const ewsThresholds = { 
    dbd: pId === "all" ? 180 : 45, 
    diare: pId === "all" ? 280 : 70, 
    ispa: pId === "all" ? 400 : 100 
  };
  
  // Sort by ISO key (lexicographic = chronological for YYYY-MM-DD)
  const ewsTren = Array.from(ewsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([isoKey, d]) => ({
      minggu: d.label,        // display label (Indonesian)
      _isoKey: isoKey,        // internal ISO key preserved for lookup
      dbd: d.dbd,
      diare: d.diare,
      ispa: d.ispa,
      thresholdDbd: ewsThresholds.dbd,
      thresholdDiare: ewsThresholds.diare,
      thresholdIspa: ewsThresholds.ispa
    }));

  const ewsAlerts: { penyakit: string; kasus: number; threshold: number; status: "SIAGA" | "WASPADA" }[] = [];
  if (ewsTren.length > 0) {
    const latest = ewsTren[ewsTren.length - 1];
    const checkAlert = (nama: string, kasus: number, threshold: number) => {
      if (kasus > threshold) {
        ewsAlerts.push({ penyakit: nama, kasus, threshold, status: "SIAGA" });
      } else if (kasus > threshold * 0.85) {
        ewsAlerts.push({ penyakit: nama, kasus, threshold, status: "WASPADA" });
      }
    };
    checkAlert("DBD", latest.dbd, latest.thresholdDbd);
    checkAlert("Diare", latest.diare, latest.thresholdDiare);
    checkAlert("ISPA", latest.ispa, latest.thresholdIspa);
  }

  // Use the ISO key for lookup (not the formatted display label)
  const latestWeekKey = ewsTren.length > 0 ? (ewsTren[ewsTren.length - 1] as any)._isoKey : "";
  const puskesmasAlerts: Record<string, { penyakit: string; kasus: number; threshold: number; status: "SIAGA" | "WASPADA" }[]> = {};
  const indThresholds = { dbd: 45, diare: 70, ispa: 100 };

  for (const [pid, pEwsMap] of perPuskesmasEwsMap.entries()) {
    const data = pEwsMap.get(latestWeekKey);
    if (data) {
      const alerts: { penyakit: string; kasus: number; threshold: number; status: "SIAGA" | "WASPADA" }[] = [];
      const checkIndAlert = (nama: string, kasus: number, threshold: number) => {
        if (kasus > threshold) {
          alerts.push({ penyakit: nama, kasus, threshold, status: "SIAGA" });
        } else if (kasus > threshold * 0.85) {
          alerts.push({ penyakit: nama, kasus, threshold, status: "WASPADA" });
        }
      };
      checkIndAlert("DBD", data.dbd, indThresholds.dbd);
      checkIndAlert("Diare", data.diare, indThresholds.diare);
      checkIndAlert("ISPA", data.ispa, indThresholds.ispa);
      puskesmasAlerts[pid] = alerts;
    }
  }

  // Compare per-day rates between last two periods to avoid bias from incomplete current period
  const trenPenyakit = (() => {
    if (sortedTrenEntries.length < 2) return "Stabil";
    const prev = sortedTrenEntries[sortedTrenEntries.length - 2][1];
    const curr = sortedTrenEntries[sortedTrenEntries.length - 1][1];
    const prevRate = prev.sakit / (prev.days || 1);
    const currRate = curr.sakit / (curr.days || 1);
    if (currRate > prevRate * 1.05) return "Meningkat";
    if (currRate < prevRate * 0.95) return "Menurun";
    return "Stabil";
  })();

  // Build kunjungan harian chart data — always per calendar day
  // Sort daily entries chronologically (ISO string sort = chronological)
  const sortedDailyEntries = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  const kunjunganHarian = sortedDailyEntries.map(([isoDay, dayData]) => {
    const row: Record<string, string | number> = { label: dayData.label };
    if (pId === "all") {
      for (const [pid, pDailyMap] of perPuskesmasDailyMap.entries()) {
        row[pid] = pDailyMap.get(isoDay) ?? 0;
      }
    } else {
      const pDailyMap = perPuskesmasDailyMap.get(pId);
      row.total = pDailyMap?.get(isoDay) ?? 0;
    }
    return row;
  });

  return {
    nama: puskesmasList.find((p) => p.id === pId)?.nama ?? "Semua Puskesmas",
    pasienSakit,
    pasienSembuh,
    trenPenyakit,
    penyakitTeratas,
    tenagaPerProfesi,
    standarTenaga,
    totalTenaga,
    totalKebutuhan,
    rasio,
    trenPerawatan,
    perbandinganKapasitas,
    okupansiRuang,
    vektorPenyakit,
    ewsTren,
    ewsAlerts,
    kunjunganHarian,
    isDinkesView: pId === "all",
    insight: [
      `Kasus ${penyakitTeratas[0]?.nama} mendominasi dengan ${penyakitTeratas[0]?.persen}% dari total kasus.`,
      `Tingkat kesembuhan pasien mencapai ${pasienSakit ? ((pasienSembuh / pasienSakit) * 100).toFixed(1) : 0}%.`,
      `Rasio kecukupan tenaga kesehatan saat ini ${rasio}%.`
    ],
    pId,
    puskesmasAlerts
  };
}

export type DashboardData = Awaited<ReturnType<typeof fetchDashboardData>>;
