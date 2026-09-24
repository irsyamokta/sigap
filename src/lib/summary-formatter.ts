import type { DashboardData } from "@/types/dashboard";
import { generateSummary } from "@/lib/ai.functions";
import { puskesmasList } from "@/data/dashboard";

const nf = new Intl.NumberFormat("id-ID");

export async function createAiDashboardSummary(
  d: DashboardData,
  periodeLabel: string,
) {
  const ewsSummary =
    d.ewsAlerts.length > 0
      ? d.ewsAlerts
          .map(
            (a) =>
              `[${a.status}] ${a.penyakit}: ${nf.format(a.kasus)} kasus (Threshold: ${nf.format(a.threshold)})`,
          )
          .join("; ")
      : "Semua indikator EWS dalam batas aman (Normal).";

  const pAlertsSummary =
    d.isDinkesView && d.puskesmasAlerts
      ? Object.entries(d.puskesmasAlerts)
          .map(([pid, alerts]) => {
            if (!alerts.length) return null;
            const pName = puskesmasList.find((p) => p.id === pid)?.nama ?? pid;
            return `${pName}: ${alerts.map((a) => `${a.penyakit} (${a.status}, ${nf.format(a.kasus)} kasus)`).join(", ")}`;
          })
          .filter(Boolean)
          .join("; ")
      : "";

  const nakesDefisit = d.standarTenaga
    .filter((s) => s.kebutuhan > s.tersedia)
    .map(
      (s) =>
        `${s.nama} (Tersedia ${s.tersedia} dari ${s.kebutuhan}, kurang ${s.kebutuhan - s.tersedia})`,
    )
    .join("; ");

  const ringkasan = [
    `Tampilan Wilayah: ${d.isDinkesView ? "Seluruh Puskesmas di Kab. Banyumas (Perspektif Dinkes)" : d.nama}`,
    `Puskesmas Kunjungan Pasien Tertinggi: ${d.kunjunganPuskesmasNama} (${nf.format(d.totalKunjunganPuskesmas)} kunjungan)`,
    `Total Pasien Sakit: ${nf.format(d.pasienSakit)} orang`,
    `Total Pasien Sembuh: ${nf.format(d.pasienSembuh)} orang`,
    `Tren Penyakit: ${d.trenPenyakit} (${d.trenPenyakitHint})`,
    `10 Penyakit Teratas: ${d.penyakitTeratas.map((p, i) => `${i + 1}. ${p.nama} (${p.persen}%)`).join(", ")}`,
    `Status Early Warning System (EWS) Wilayah: ${ewsSummary}`,
    pAlertsSummary
      ? `Detail Status Alert EWS per Puskesmas: ${pAlertsSummary}`
      : "",
    `Tenaga Kesehatan Terpasang: Total ${d.totalTenaga} dari kebutuhan ${d.totalKebutuhan} personel (Rasio kecukupan ${d.rasio}%)`,
    `Prioritas Nakes (Fasilitas / Profesi): ${d.prioritasNakes.fullName} — ${d.prioritasNakes.keterangan}`,
    `Rincian Profesi Nakes yang Kurang: ${nakesDefisit || "Semua profesi nakes telah memenuhi standar minimal"}`,
    `Okupansi Perawatan Bulanan: ${d.okupansiRuang.map((o) => `${o.bulan} (${o.okupansi}%)`).join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  return generateSummary({
    data: { puskesmas: d.nama, periode: periodeLabel, ringkasan },
  });
}
