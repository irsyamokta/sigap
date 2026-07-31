export type PuskesmasId = "all" | "melati" | "kenanga" | "cempaka" | "anggrek";

export const puskesmasList: { id: PuskesmasId; nama: string }[] = [
  { id: "all", nama: "Semua Puskesmas" },
  { id: "melati", nama: "Puskesmas Melati" },
  { id: "kenanga", nama: "Puskesmas Kenanga" },
  { id: "cempaka", nama: "Puskesmas Cempaka" },
  { id: "anggrek", nama: "Puskesmas Anggrek" },
];

const factors: Record<PuskesmasId, number> = {
  all: 1,
  melati: 0.34,
  kenanga: 0.27,
  cempaka: 0.22,
  anggrek: 0.17,
};

const baseTren = [
  { bulan: "Jan 25", sakit: 180, sembuh: 160 },
  { bulan: "Feb 25", sakit: 210, sembuh: 190 },
  { bulan: "Mar 25", sakit: 165, sembuh: 175 },
  { bulan: "Apr 25", sakit: 285, sembuh: 250 },
  { bulan: "Mei 25", sakit: 270, sembuh: 265 },
  { bulan: "Jun 25", sakit: 300, sembuh: 280 },
  { bulan: "Jul 25", sakit: 340, sembuh: 300 },
  { bulan: "Agt 25", sakit: 355, sembuh: 330 },
  { bulan: "Sep 25", sakit: 330, sembuh: 345 },
  { bulan: "Okt 25", sakit: 375, sembuh: 360 },
  { bulan: "Nov 25", sakit: 390, sembuh: 380 },
  { bulan: "Des 25", sakit: 410, sembuh: 395 },
  { bulan: "Jan 26", sakit: 385, sembuh: 370 },
  { bulan: "Feb 26", sakit: 400, sembuh: 385 },
  { bulan: "Mar 26", sakit: 420, sembuh: 410 },
  { bulan: "Apr 26", sakit: 440, sembuh: 425 },
  { bulan: "Mei 26", sakit: 460, sembuh: 450 },
  { bulan: "Jun 26", sakit: 480, sembuh: 470 },
];

const basePenyakit = [
  { nama: "ISPA", persen: 32.8 },
  { nama: "Diare", persen: 18.4 },
  { nama: "Hipertensi", persen: 12.7 },
  { nama: "Demam Berdarah", persen: 9.6 },
  { nama: "Diabetes Mellitus", persen: 8.8 },
];

const baseTenaga = [
  { nama: "Dokter", jumlah: 18 },
  { nama: "Perawat", jumlah: 58 },
  { nama: "Bidan", jumlah: 14 },
  { nama: "Dokter Gigi", jumlah: 6 },
  { nama: "Kesmas", jumlah: 10 },
];

const baseStandar = [
  { nama: "Dokter", tersedia: 18, kebutuhan: 22 },
  { nama: "Perawat", tersedia: 58, kebutuhan: 60 },
  { nama: "Bidan", tersedia: 14, kebutuhan: 16 },
  { nama: "Dokter Gigi", tersedia: 6, kebutuhan: 8 },
  { nama: "Kesmas", tersedia: 10, kebutuhan: 12 },
];

const basePerbandingan = [
  { bulan: "Jan 25", pasien: 120, kapasitas: 260 },
  { bulan: "Apr 25", pasien: 175, kapasitas: 260 },
  { bulan: "Jul 25", pasien: 215, kapasitas: 260 },
  { bulan: "Okt 25", pasien: 235, kapasitas: 260 },
  { bulan: "Jan 26", pasien: 220, kapasitas: 260 },
  { bulan: "Apr 26", pasien: 250, kapasitas: 260 },
];

const baseOkupansi = [
  { bulan: "Jan 25", okupansi: 58 },
  { bulan: "Apr 25", okupansi: 68 },
  { bulan: "Jul 25", okupansi: 74 },
  { bulan: "Okt 25", okupansi: 79 },
  { bulan: "Jan 26", okupansi: 76 },
  { bulan: "Apr 26", okupansi: 82 },
];

const baseVektor = [
  { nama: "ISPA", kasus: 420 },
  { nama: "Diare", kasus: 210 },
  { nama: "Hipertensi", kasus: 155 },
  { nama: "DB", kasus: 98 },
  { nama: "DM", kasus: 88 },
];

const shifts: Record<PuskesmasId, number> = {
  all: 0,
  melati: 1.6,
  kenanga: -1.1,
  cempaka: 2.3,
  anggrek: -2.0,
};

const scale = (n: number, f: number) => Math.max(1, Math.round(n * f));
const clampPct = (n: number) => Math.max(3, Math.min(96, Math.round(n)));

export function getDashboardData(id: PuskesmasId) {
  const f = factors[id];
  const s = shifts[id];

  const trenPerawatan = baseTren.map((d) => ({
    bulan: d.bulan,
    sakit: scale(d.sakit, f),
    sembuh: scale(d.sembuh, f),
  }));

  const penyakitTeratas = basePenyakit.map((d, i) => ({
    nama: d.nama,
    persen: Number(Math.max(2, d.persen + (i === 0 ? s : s / 2)).toFixed(1)),
  }));

  const tenagaPerProfesi = baseTenaga.map((d) => ({ nama: d.nama, jumlah: scale(d.jumlah, f) }));
  const standarTenaga = baseStandar.map((d) => ({
    nama: d.nama,
    tersedia: scale(d.tersedia, f),
    kebutuhan: scale(d.kebutuhan, f),
  }));

  const totalTenaga = tenagaPerProfesi.reduce((a, b) => a + b.jumlah, 0);
  const totalKebutuhan = standarTenaga.reduce((a, b) => a + b.kebutuhan, 0);
  const totalTersedia = standarTenaga.reduce((a, b) => a + b.tersedia, 0);
  const rasio = clampPct((totalTersedia / totalKebutuhan) * 100);

  const perbandinganKapasitas = basePerbandingan.map((d) => ({
    bulan: d.bulan,
    pasien: scale(d.pasien, f),
    kapasitas: scale(d.kapasitas, f),
  }));

  const okupansiRuang = baseOkupansi.map((d) => ({
    bulan: d.bulan,
    okupansi: clampPct(d.okupansi + s * 2),
  }));

  const vektorPenyakit = baseVektor.map((d) => ({ nama: d.nama, kasus: scale(d.kasus, f) }));

  const pasienSakit = trenPerawatan.reduce((a, b) => a + b.sakit, 0);
  const pasienSembuh = trenPerawatan.reduce((a, b) => a + b.sembuh, 0);

  return {
    nama: puskesmasList.find((p) => p.id === id)?.nama ?? "Semua Puskesmas",
    pasienSakit,
    pasienSembuh,
    trenPenyakit: s >= 0 ? "Meningkat" : "Menurun",
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
    insight: [
      `Kasus ${penyakitTeratas[0].nama} tercatat ${penyakitTeratas[0].persen}% dari total kasus.`,
      `Tingkat kesembuhan pasien mencapai ${((pasienSembuh / pasienSakit) * 100).toFixed(1)}%.`,
      `Okupansi ruang rawat inap terakhir ${okupansiRuang[okupansiRuang.length - 1].okupansi}% dari kapasitas.`,
    ],
  };
}

export type DashboardData = ReturnType<typeof getDashboardData>;
