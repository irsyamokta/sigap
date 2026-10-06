import type { EwsAlert, PuskesmasId } from "@/types/dashboard";

const PUSKESMAS_THRESHOLDS: Record<
  string,
  { dbd: number; diare: number; ispa: number }
> = {
  purwokerto_barat: { dbd: 13, diare: 27, ispa: 55 },
  sokaraja_1: { dbd: 11, diare: 20, ispa: 47 },
  patikraja: { dbd: 6, diare: 10, ispa: 22 },
  kembaran_1: { dbd: 8, diare: 13, ispa: 30 },
};

const ALL_THRESHOLDS = { dbd: 28, diare: 55, ispa: 120 };

const DISEASE_NAMES = { dbd: "DBD", diare: "Diare", ispa: "ISPA" };

function checkAlerts(
  data: { dbd: number; diare: number; ispa: number },
  thr: { dbd: number; diare: number; ispa: number },
): EwsAlert[] {
  const alerts: EwsAlert[] = [];
  const check = (label: string, kasus: number, threshold: number) => {
    if (kasus > threshold) {
      alerts.push({ penyakit: label, kasus, threshold, status: "SIAGA" });
    } else if (kasus > threshold * 0.85) {
      alerts.push({ penyakit: label, kasus, threshold, status: "WASPADA" });
    }
  };
  check(DISEASE_NAMES.dbd, data.dbd, thr.dbd);
  check(DISEASE_NAMES.diare, data.diare, thr.diare);
  check(DISEASE_NAMES.ispa, data.ispa, thr.ispa);
  return alerts;
}

function getPeakData(
  pEwsMap: Map<string, { dbd: number; diare: number; ispa: number }>,
  thr: { dbd: number; diare: number; ispa: number },
): { dbd: number; diare: number; ispa: number } | undefined {
  let peak: { dbd: number; diare: number; ispa: number } | undefined;
  let peakScore = -1;
  for (const [, weekData] of pEwsMap.entries()) {
    const score =
      weekData.dbd / thr.dbd +
      weekData.diare / thr.diare +
      weekData.ispa / thr.ispa;
    if (score > peakScore) {
      peakScore = score;
      peak = weekData;
    }
  }
  return peak;
}

export function computeEwsMetrics(
  ewsMap: Map<
    string,
    { dbd: number; diare: number; ispa: number; label: string }
  >,
  perPuskesmasEwsMap: Map<
    string,
    Map<string, { dbd: number; diare: number; ispa: number }>
  >,
  pId: PuskesmasId,
) {
  const isAll = pId === "all";

  const trendThr = isAll
    ? ALL_THRESHOLDS
    : (PUSKESMAS_THRESHOLDS[pId] ?? ALL_THRESHOLDS);

  const ewsTren = Array.from(ewsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([isoKey, d]) => ({
      minggu: d.label,
      _isoKey: isoKey,
      dbd: d.dbd,
      diare: d.diare,
      ispa: d.ispa,
      thresholdDbd: trendThr.dbd,
      thresholdDiare: trendThr.diare,
      thresholdIspa: trendThr.ispa,
    }));

  const puskesmasAlerts: Record<string, EwsAlert[]> = {};
  for (const [pid, pEwsMap] of perPuskesmasEwsMap.entries()) {
    const thr = PUSKESMAS_THRESHOLDS[pid] ?? ALL_THRESHOLDS;
    const peak = getPeakData(pEwsMap, thr);
    if (peak) {
      puskesmasAlerts[pid] = checkAlerts(peak, thr);
    }
  }

  let ewsAlerts: EwsAlert[] = [];

  if (isAll) {
    if (ewsTren.length > 0) {
      const latest = ewsTren[ewsTren.length - 1];
      ewsAlerts = checkAlerts(
        { dbd: latest.dbd, diare: latest.diare, ispa: latest.ispa },
        ALL_THRESHOLDS,
      );
    }
  } else {
    ewsAlerts = puskesmasAlerts[pId] ?? [];
  }

  return { ewsTren, ewsAlerts, puskesmasAlerts };
}
