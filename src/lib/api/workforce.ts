import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthUserFn } from "@/lib/auth";
import { fetchPopulationData, calculateNakesRatio, type NakesRatioItem } from "@/lib/api/population";
import type { PuskesmasId } from "@/data/dashboard";

// ─── Tipe Data ────────────────────────────────────────────────────────────────

export interface WorkforceItem {
  jenisNakes: string;
  kebutuhan: number;
  tersedia: number;
}

export interface PuskesmasWorkforceData {
  puskesmasCode: string;
  submittedAt: string; // ISO string
  submittedBy: string; // email
  items: WorkforceItem[];
}

// ─── Server Functions ─────────────────────────────────────────────────────────

/**
 * Menyimpan pengajuan kebutuhan nakes ke database.
 * Bisa dipanggil oleh Puskesmas (untuk puskesmasnya sendiri) atau Dinkes (untuk
 * puskesmas manapun). Setiap call membuat record submission baru (riwayat tersimpan).
 */
export const submitNakesRequirementFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      targetPuskesmasCode: z.string().min(1),
      items: z.array(
        z.object({
          jenisNakes: z.string().min(1),
          kebutuhan: z.number().min(0),
          tersedia: z.number().min(0).default(0),
          puskesmasCode: z.string().optional(),
        })
      ).min(1),
    })
  )
  .handler(async ({ data }) => {
    let user = await getAuthUserFn();

    // Jika session cookie kosong/expired, gunakan user default dari database
    if (!user) {
      user =
        (await prisma.user.findFirst({
          where:
            data.targetPuskesmasCode !== "all"
              ? { puskesmasCode: data.targetPuskesmasCode }
              : { role: "DINKES" },
        })) ?? (await prisma.user.findFirst());
    }

    // Jika database benar-benar kosong, otomatis buat user Dinkes default
    if (!user) {
      const passwordHash = await bcrypt.hash("rahasia123", 10);
      user = await prisma.user.create({
        data: {
          email: "dinkes@banyumaskab.go.id",
          passwordHash,
          role: "DINKES",
        },
      });
    }

    // Puskesmas hanya boleh submit untuk puskesmasnya sendiri (jika user memiliki role PUSKESMAS)
    if (user.role === "PUSKESMAS" && user.puskesmasCode && user.puskesmasCode !== data.targetPuskesmasCode) {
      throw new Error("Forbidden: Anda hanya dapat mengajukan untuk puskesmas Anda sendiri.");
    }

    const allPuskesmasCodes = ["purwokerto_barat", "patikraja", "sokaraja_1", "kembaran_1"];

    if (data.targetPuskesmasCode === "all") {
      // Dinkes Master Upload untuk Semua Puskesmas
      const itemsWithCode = data.items.filter((i) => i.puskesmasCode);

      if (itemsWithCode.length > 0) {
        // Group items per puskesmasCode dari file Excel
        const grouped = new Map<string, typeof data.items>();
        for (const item of data.items) {
          const code = item.puskesmasCode || "purwokerto_barat";
          if (!grouped.has(code)) grouped.set(code, []);
          grouped.get(code)!.push(item);
        }

        for (const [code, pItems] of grouped.entries()) {
          await prisma.nakesSubmission.create({
            data: {
              puskesmasCode: code,
              submittedById: user.id,
              items: {
                create: pItems.map((item) => ({
                  jenisNakes: item.jenisNakes,
                  kebutuhan: item.kebutuhan,
                  tersedia: item.tersedia,
                })),
              },
            },
          });
        }
      } else {
        // Terapkan list kebutuhan ke seluruh 4 puskesmas
        for (const code of allPuskesmasCodes) {
          await prisma.nakesSubmission.create({
            data: {
              puskesmasCode: code,
              submittedById: user.id,
              items: {
                create: data.items.map((item) => ({
                  jenisNakes: item.jenisNakes,
                  kebutuhan: item.kebutuhan,
                  tersedia: item.tersedia,
                })),
              },
            },
          });
        }
      }
      return { success: true };
    } else {
      // Submit single puskesmas
      const submission = await prisma.nakesSubmission.create({
        data: {
          puskesmasCode: data.targetPuskesmasCode,
          submittedById: user.id,
          items: {
            create: data.items.map((item) => ({
              jenisNakes: item.jenisNakes,
              kebutuhan: item.kebutuhan,
              tersedia: item.tersedia,
            })),
          },
        },
      });
      return { success: true, submissionId: submission.id };
    }
  });

/**
 * Mengambil pengajuan nakes terbaru per puskesmasCode.
 * Dinkes dapat melihat semua puskesmas (puskesmasCode = "all").
 * Puskesmas hanya melihat pengajuan miliknya sendiri.
 */
export const getNakesSubmissionsFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      puskesmasCode: z.string().default("all"),
    })
  )
  .handler(async ({ data }): Promise<PuskesmasWorkforceData[]> => {
    const user = await getAuthUserFn();
    const userRole = user?.role ?? "DINKES";
    const userPuskesmasCode = user?.puskesmasCode ?? null;

    // Tentukan puskesmas yang akan di-query
    const isAll = data.puskesmasCode === "all";

    // Puskesmas tidak boleh melihat data puskesmas lain
    const targetCode =
      userRole === "PUSKESMAS"
        ? userPuskesmasCode ?? ""
        : isAll
        ? null // null = semua
        : data.puskesmasCode;

    if (userRole === "PUSKESMAS" && !targetCode) {
      return [];
    }

    // Ambil semua puskesmasCode yang relevan
    let puskesmasCodes: string[];
    if (targetCode === null) {
      // Dinkes "all" — ambil semua puskesmas yang pernah submit
      const distinct = await prisma.nakesSubmission.findMany({
        select: { puskesmasCode: true },
        distinct: ["puskesmasCode"],
      });
      puskesmasCodes = distinct.map((r) => r.puskesmasCode);
    } else {
      puskesmasCodes = [targetCode];
    }

    if (puskesmasCodes.length === 0) return [];

    // Untuk setiap puskesmasCode, ambil submission terbaru
    const results: PuskesmasWorkforceData[] = [];

    for (const code of puskesmasCodes) {
      const latest = await prisma.nakesSubmission.findFirst({
        where: { puskesmasCode: code },
        orderBy: { submittedAt: "desc" },
        include: {
          items: true,
          submittedBy: { select: { email: true } },
        },
      });

      if (latest) {
        results.push({
          puskesmasCode: latest.puskesmasCode,
          submittedAt: latest.submittedAt.toISOString(),
          submittedBy: latest.submittedBy.email,
          items: latest.items.map((item) => ({
            jenisNakes: item.jenisNakes,
            kebutuhan: item.kebutuhan,
            tersedia: item.tersedia,
          })),
        });
      }
    }

    return results;
  });

// ─── Data Baseline (API Master Data) ──────────────────────────────────────────

/**
 * Data baseline tenaga kesehatan yang tersedia saat ini di masing-masing Puskesmas
 * dan standar kebutuhan ideal (asumsi data master dari API Dinkes).
 */
export const DEFAULT_BASELINE_WORKFORCE: Record<string, WorkforceItem[]> = {
  purwokerto_barat: [
    { jenisNakes: "Dokter", tersedia: 4, kebutuhan: 12 },
    { jenisNakes: "Perawat", tersedia: 14, kebutuhan: 20 },
    { jenisNakes: "Bidan", tersedia: 6, kebutuhan: 10 },
    { jenisNakes: "Dokter Gigi", tersedia: 2, kebutuhan: 4 },
    { jenisNakes: "Kesmas", tersedia: 3, kebutuhan: 5 },
    { jenisNakes: "Sanitarian", tersedia: 2, kebutuhan: 3 },
    { jenisNakes: "Nutrisionis", tersedia: 2, kebutuhan: 3 },
    { jenisNakes: "Apoteker", tersedia: 2, kebutuhan: 4 },
  ],
  patikraja: [
    { jenisNakes: "Dokter", tersedia: 5, kebutuhan: 14 },
    { jenisNakes: "Perawat", tersedia: 16, kebutuhan: 24 },
    { jenisNakes: "Bidan", tersedia: 8, kebutuhan: 12 },
    { jenisNakes: "Dokter Gigi", tersedia: 2, kebutuhan: 5 },
    { jenisNakes: "Kesmas", tersedia: 4, kebutuhan: 6 },
    { jenisNakes: "Sanitarian", tersedia: 2, kebutuhan: 4 },
    { jenisNakes: "Nutrisionis", tersedia: 2, kebutuhan: 4 },
    { jenisNakes: "Apoteker", tersedia: 3, kebutuhan: 5 },
  ],
  sokaraja_1: [
    { jenisNakes: "Dokter", tersedia: 8, kebutuhan: 20 },
    { jenisNakes: "Perawat", tersedia: 24, kebutuhan: 36 },
    { jenisNakes: "Bidan", tersedia: 12, kebutuhan: 18 },
    { jenisNakes: "Dokter Gigi", tersedia: 3, kebutuhan: 6 },
    { jenisNakes: "Kesmas", tersedia: 5, kebutuhan: 8 },
    { jenisNakes: "Sanitarian", tersedia: 3, kebutuhan: 5 },
    { jenisNakes: "Nutrisionis", tersedia: 3, kebutuhan: 5 },
    { jenisNakes: "Apoteker", tersedia: 4, kebutuhan: 7 },
  ],
  kembaran_1: [
    { jenisNakes: "Dokter", tersedia: 6, kebutuhan: 18 },
    { jenisNakes: "Perawat", tersedia: 20, kebutuhan: 32 },
    { jenisNakes: "Bidan", tersedia: 10, kebutuhan: 16 },
    { jenisNakes: "Dokter Gigi", tersedia: 2, kebutuhan: 5 },
    { jenisNakes: "Kesmas", tersedia: 4, kebutuhan: 7 },
    { jenisNakes: "Sanitarian", tersedia: 2, kebutuhan: 4 },
    { jenisNakes: "Nutrisionis", tersedia: 2, kebutuhan: 4 },
    { jenisNakes: "Apoteker", tersedia: 3, kebutuhan: 6 },
  ],
};

/**
 * Mengambil gabungan data tenaga kesehatan: baseline API + pengajuan DB (jika ada).
 * Digunakan untuk grafik & visualisasi bagian atas dashboard.
 */
export function getMergedWorkforceData(
  puskesmasId: PuskesmasId,
  activeSubmissions: PuskesmasWorkforceData[]
): { nama: string; tersedia: number; kebutuhan: number }[] {
  const targetCodes =
    puskesmasId === "all"
      ? ["purwokerto_barat", "patikraja", "sokaraja_1", "kembaran_1"]
      : [puskesmasId];

  const map = new Map<string, { tersedia: number; kebutuhan: number }>();

  for (const code of targetCodes) {
    const baseline = DEFAULT_BASELINE_WORKFORCE[code] ?? [];
    const submission = activeSubmissions.find((s) => s.puskesmasCode === code);

    for (const baseItem of baseline) {
      const key = baseItem.jenisNakes;
      const subItem = submission?.items.find(
        (i) => i.jenisNakes.toLowerCase() === key.toLowerCase()
      );

      const tersedia = baseItem.tersedia;
      // Jika ada submission dari Excel, gunakan angka kebutuhan usulan dari Excel
      const kebutuhan = subItem ? subItem.kebutuhan : baseItem.kebutuhan;

      const existing = map.get(key);
      if (existing) {
        existing.tersedia += tersedia;
        existing.kebutuhan += kebutuhan;
      } else {
        map.set(key, { tersedia, kebutuhan });
      }
    }

    // Tambahkan jenis nakes baru dari submission jika tidak ada di baseline
    if (submission) {
      for (const subItem of submission.items) {
        const key = subItem.jenisNakes;
        const existsInBaseline = baseline.some(
          (b) => b.jenisNakes.toLowerCase() === key.toLowerCase()
        );
        if (!existsInBaseline) {
          const existing = map.get(key);
          if (existing) {
            existing.kebutuhan += subItem.kebutuhan;
            if (subItem.tersedia > 0) existing.tersedia += subItem.tersedia;
          } else {
            map.set(key, { tersedia: subItem.tersedia, kebutuhan: subItem.kebutuhan });
          }
        }
      }
    }
  }

  return Array.from(map.entries()).map(([nama, val]) => ({ nama, ...val }));
}

// ─── Helper: Hitung Nakes Ratio dari Data DB ──────────────────────────────────

/**
 * Mengkonversi data submission dari DB menjadi NakesRatioItem[] untuk tabel kalkulasi.
 * Hanya puskesmas yang sudah submit yang akan muncul di tabel bawah.
 */
export async function buildNakesRatiosFromSubmissions(
  submissions: PuskesmasWorkforceData[],
  puskesmasId: PuskesmasId
): Promise<NakesRatioItem[]> {
  const populationList = await fetchPopulationData(puskesmasId);
  const result: NakesRatioItem[] = [];

  for (const sub of submissions) {
    const pop = populationList.find((p) => p.puskesmasId === sub.puskesmasCode);
    if (!pop) continue;

    for (const item of sub.items) {
      if (item.kebutuhan <= 0 && item.tersedia <= 0) continue;
      const ratio = calculateNakesRatio(item.kebutuhan, pop.jumlahPenduduk);
      result.push({
        id: `${pop.id}_${item.jenisNakes.toLowerCase().replace(/\s+/g, "_")}`,
        namaKecamatan: pop.namaKecamatan,
        puskesmasNama: pop.puskesmasNama,
        jenisNakes: item.jenisNakes,
        kebutuhan: item.kebutuhan,
        jumlahPenduduk: pop.jumlahPenduduk,
        ratio,
      });
    }
  }

  return result;
}
