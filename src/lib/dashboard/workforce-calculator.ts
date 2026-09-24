import type { PuskesmasId } from "@/types/dashboard";
import type { PuskesmasWorkforceData } from "@/types/workforce";
import { getMergedWorkforceData } from "@/lib/api/workforce";

const clampPct = (n: number) => Math.max(3, Math.min(100, Math.round(n)));

export function computeWorkforceMetrics(
  pId: PuskesmasId,
  activeSubmissions: PuskesmasWorkforceData[],
  apiNakesBaselines: Record<string, { profesi: string; jumlah: number }[]>,
  puskesmasList: { id: PuskesmasId; nama: string }[],
) {
  const standarTenaga = getMergedWorkforceData(
    pId,
    activeSubmissions,
    apiNakesBaselines,
  );
  const tenagaPerProfesi = standarTenaga.map((s) => ({
    nama: s.nama,
    jumlah: s.tersedia,
  }));
  const totalTenaga = standarTenaga.reduce((a, b) => a + b.tersedia, 0);
  const totalKebutuhan = standarTenaga.reduce((a, b) => a + b.kebutuhan, 0);
  const rasio = totalKebutuhan
    ? clampPct((totalTenaga / totalKebutuhan) * 100)
    : 0;

  const analisisPrioritas = puskesmasList
    .filter((item) => item.id !== "all")
    .map((item) => {
      const wf = getMergedWorkforceData(
        item.id as PuskesmasId,
        activeSubmissions,
        apiNakesBaselines,
      );
      const tersedia = wf.reduce((sum, n) => sum + n.tersedia, 0);
      const kebutuhan = wf.reduce((sum, n) => sum + n.kebutuhan, 0);
      const defisit = Math.max(0, kebutuhan - tersedia);
      const rasioPct = kebutuhan ? clampPct((tersedia / kebutuhan) * 100) : 100;
      const sortedByGap = [...wf].sort(
        (a, b) => b.kebutuhan - b.tersedia - (a.kebutuhan - a.tersedia),
      );
      const topGapProfesi = sortedByGap[0];
      const gapCount = topGapProfesi
        ? Math.max(0, topGapProfesi.kebutuhan - topGapProfesi.tersedia)
        : 0;
      return {
        id: item.id,
        nama: item.nama,
        singkat: item.nama.replace("Puskesmas ", ""),
        tersedia,
        kebutuhan,
        defisit,
        rasioPct,
        topProfesi: topGapProfesi?.nama ?? "-",
        topProfesiGap: gapCount,
      };
    })
    .sort((a, b) => b.defisit - a.defisit);

  const topPriorityPuskesmas = analisisPrioritas[0];
  const currentPuskesmasPrioritas = analisisPrioritas.find(
    (item) => item.id === pId,
  );

  const prioritasNakes =
    pId === "all"
      ? {
          label: "Prioritas Kebutuhan",
          nama: topPriorityPuskesmas?.singkat ?? "Kembaran 1",
          fullName: topPriorityPuskesmas?.nama ?? "Puskesmas Kembaran 1",
          keterangan: `Kurang ${topPriorityPuskesmas?.defisit ?? 0} nakes (rasio ${topPriorityPuskesmas?.rasioPct ?? 0}%)`,
        }
      : {
          label: "Profesi Prioritas",
          nama: currentPuskesmasPrioritas?.topProfesi ?? "-",
          fullName: currentPuskesmasPrioritas?.topProfesi ?? "-",
          keterangan:
            currentPuskesmasPrioritas &&
            currentPuskesmasPrioritas.topProfesiGap > 0
              ? `Kurang ${currentPuskesmasPrioritas.topProfesiGap} nakes di unit ini`
              : "Kebutuhan nakes terpenuhi",
        };

  return {
    standarTenaga,
    tenagaPerProfesi,
    totalTenaga,
    totalKebutuhan,
    rasio,
    prioritasNakes,
  };
}
