import type { DashboardData } from "@/types/dashboard";
import { generateSummary } from "@/lib/ai.functions";

const nf = new Intl.NumberFormat("id-ID");

export async function createAiDashboardSummary(
  d: DashboardData,
  periodeLabel: string,
) {
  const nakesDetail = d.standarTenaga
    .map(
      (s) =>
        `- Profesi: ${s.nama} | Kebutuhan: ${nf.format(s.kebutuhan)} | Tersedia: ${nf.format(s.tersedia)} | Defisit: ${nf.format(Math.max(0, s.kebutuhan - s.tersedia))} | Status: ${s.tersedia >= s.kebutuhan ? "Terpenuhi" : "Defisit"}`,
    )
    .join("\n");

  const puskesmasPalingMembutuhkan =
    d.prioritasNakes.fullName && d.prioritasNakes.fullName !== "-"
      ? `${d.prioritasNakes.fullName} (${d.prioritasNakes.keterangan})`
      : d.prioritasPuskesmas && d.prioritasPuskesmas !== "-"
        ? d.prioritasPuskesmas
        : d.nama;

  const ringkasan = [
    `Fasilitas / Wilayah Evaluasi: ${d.isDinkesView ? "Seluruh Puskesmas di Kab. Banyumas (Perspektif Dinkes)" : d.nama}`,
    `Puskesmas Paling Membutuhkan Penambahan Nakes: ${puskesmasPalingMembutuhkan}`,
    `Ringkasan Ketenagakerjaan Wilayah: Total Tersedia ${nf.format(d.totalTenaga)} dari Total Kebutuhan ${nf.format(d.totalKebutuhan)} personel (Rasio Kecukupan ${d.rasio}%)`,
    `Prioritas Utama Profesi Nakes: ${d.prioritasTenagaKesehatan}`,
    `Rincian Kebutuhan & Ketersediaan Nakes per Profesi:\n${nakesDetail}`,
  ]
    .filter(Boolean)
    .join("\n");

  return generateSummary({
    data: { puskesmas: d.nama, periode: periodeLabel, ringkasan },
  });
}
