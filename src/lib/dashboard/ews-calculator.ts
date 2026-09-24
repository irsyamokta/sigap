import type { EwsAlert, PuskesmasId } from "@/types/dashboard";

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
  const thresholds = {
    dbd: pId === "all" ? 28 : 17,
    diare: pId === "all" ? 55 : 38,
    ispa: pId === "all" ? 120 : 85,
  };

  const ewsTren = Array.from(ewsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([isoKey, d]) => ({
      minggu: d.label,
      _isoKey: isoKey,
      dbd: d.dbd,
      diare: d.diare,
      ispa: d.ispa,
      thresholdDbd: thresholds.dbd,
      thresholdDiare: thresholds.diare,
      thresholdIspa: thresholds.ispa,
    }));

  const ewsAlerts: EwsAlert[] = [];
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

  const puskesmasAlerts: Record<string, EwsAlert[]> = {};
  const puskesmasThresholds: Record<
    string,
    { dbd: number; diare: number; ispa: number }
  > = {
    purwokerto_barat: { dbd: 13, diare: 27, ispa: 55 },
    sokaraja_1: { dbd: 11, diare: 20, ispa: 47 },
    patikraja: { dbd: 6, diare: 10, ispa: 22 },
    kembaran_1: { dbd: 8, diare: 13, ispa: 30 },
  };

  for (const [pid, pEwsMap] of perPuskesmasEwsMap.entries()) {
    const thr = puskesmasThresholds[pid] ?? { dbd: 13, diare: 27, ispa: 55 };
    let peakData: { dbd: number; diare: number; ispa: number } | undefined;
    let peakScore = -1;
    for (const [, weekData] of pEwsMap.entries()) {
      const score =
        weekData.dbd / thr.dbd +
        weekData.diare / thr.diare +
        weekData.ispa / thr.ispa;
      if (score > peakScore) {
        peakScore = score;
        peakData = weekData;
      }
    }
    if (peakData) {
      const alerts: EwsAlert[] = [];
      const checkIndAlert = (
        nama: string,
        kasus: number,
        threshold: number,
      ) => {
        if (kasus > threshold) {
          alerts.push({ penyakit: nama, kasus, threshold, status: "SIAGA" });
        } else if (kasus > threshold * 0.85) {
          alerts.push({ penyakit: nama, kasus, threshold, status: "WASPADA" });
        }
      };
      checkIndAlert("DBD", peakData.dbd, thr.dbd);
      checkIndAlert("Diare", peakData.diare, thr.diare);
      checkIndAlert("ISPA", peakData.ispa, thr.ispa);
      puskesmasAlerts[pid] = alerts;
    }
  }

  return { ewsTren, ewsAlerts, puskesmasAlerts };
}
