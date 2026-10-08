import type { EwsAlert, PuskesmasId } from "@/types/dashboard";
import type { EwsBaseline } from "@/lib/api/simpus/services/ews-baseline.service";

const DISEASE_NAMES = { dbd: "DBD", diare: "Diare", ispa: "ISPA" };

type EwsThresholds = { dbd: number; diare: number; ispa: number };

function extractPuskesmasThreshold(
  pid: string,
  baselineMap?: Record<string, EwsBaseline> | null,
): EwsThresholds {
  if (baselineMap && baselineMap[pid]) {
    const b = baselineMap[pid];
    return {
      dbd: Math.max(0, Math.round(b.dbd.siaga * 10) / 10),
      diare: Math.max(0, Math.round(b.diare.siaga * 10) / 10),
      ispa: Math.max(0, Math.round(b.ispa.siaga * 10) / 10),
    };
  }
  return { dbd: 0, diare: 0, ispa: 0 };
}

function extractAllThresholds(
  baselineMap?: Record<string, EwsBaseline> | null,
): EwsThresholds {
  if (baselineMap) {
    let totalDbd = 0;
    let totalDiare = 0;
    let totalIspa = 0;
    let count = 0;
    for (const key of Object.keys(baselineMap)) {
      const b = baselineMap[key as keyof typeof baselineMap];
      if (b && b.dbd) {
        totalDbd += b.dbd.siaga;
        totalDiare += b.diare.siaga;
        totalIspa += b.ispa.siaga;
        count++;
      }
    }
    if (count > 0) {
      return {
        dbd: Math.round(totalDbd * 10) / 10,
        diare: Math.round(totalDiare * 10) / 10,
        ispa: Math.round(totalIspa * 10) / 10,
      };
    }
  }
  return { dbd: 0, diare: 0, ispa: 0 };
}

function checkAlerts(
  data: { dbd: number; diare: number; ispa: number },
  thr: EwsThresholds,
): EwsAlert[] {
  if (thr.dbd === 0 && thr.diare === 0 && thr.ispa === 0) {
    return [];
  }

  const alerts: EwsAlert[] = [];
  const check = (label: string, kasus: number, threshold: number) => {
    if (threshold <= 0) return;
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
  thr: EwsThresholds,
): { dbd: number; diare: number; ispa: number } | undefined {
  if (thr.dbd === 0 && thr.diare === 0 && thr.ispa === 0) return undefined;
  let peak: { dbd: number; diare: number; ispa: number } | undefined;
  let peakScore = -1;
  for (const [, weekData] of pEwsMap.entries()) {
    const score =
      (thr.dbd > 0 ? weekData.dbd / thr.dbd : 0) +
      (thr.diare > 0 ? weekData.diare / thr.diare : 0) +
      (thr.ispa > 0 ? weekData.ispa / thr.ispa : 0);
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
  baselineMap?: Record<string, EwsBaseline> | null,
) {
  const isAll = pId === "all";

  const allThr = extractAllThresholds(baselineMap);
  const trendThr = isAll ? allThr : extractPuskesmasThreshold(pId, baselineMap);

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
    const thr = extractPuskesmasThreshold(pid, baselineMap);
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
        allThr,
      );
    }
  } else {
    ewsAlerts = puskesmasAlerts[pId] ?? [];
  }

  return { ewsTren, ewsAlerts, puskesmasAlerts };
}
