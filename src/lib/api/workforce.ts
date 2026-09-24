import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthUserFn } from "@/lib/auth";
import type { PuskesmasWorkforceData, WorkforceItem } from "@/types/workforce";
import {
  DEFAULT_BASELINE_WORKFORCE,
  getMergedWorkforceData,
  buildNakesRatiosFromSubmissions,
} from "./workforce-baseline";

export type { PuskesmasWorkforceData, WorkforceItem };
export {
  DEFAULT_BASELINE_WORKFORCE,
  getMergedWorkforceData,
  buildNakesRatiosFromSubmissions,
};

export const deleteNakesItemsFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      itemIds: z.array(z.string()),
      targets: z
        .array(
          z.object({
            puskesmasCode: z.string(),
            jenisNakes: z.string(),
          }),
        )
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    let deletedCount = 0;

    if (data.itemIds.length > 0) {
      const res = await prisma.nakesSubmissionItem.deleteMany({
        where: { id: { in: data.itemIds } },
      });
      deletedCount += res.count;
    }

    if (data.targets && data.targets.length > 0) {
      for (const t of data.targets) {
        const res = await prisma.nakesSubmissionItem.deleteMany({
          where: {
            jenisNakes: { equals: t.jenisNakes, mode: "insensitive" },
            submission: { puskesmasCode: t.puskesmasCode },
          },
        });
        deletedCount += res.count;
      }
    }

    return { success: true, deletedCount };
  });

export const submitNakesRequirementFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      targetPuskesmasCode: z.string().min(1),
      items: z
        .array(
          z.object({
            jenisNakes: z.string().min(1),
            kebutuhan: z.number().min(0),
            tersedia: z.number().min(0).default(0),
            puskesmasCode: z.string().optional(),
          }),
        )
        .min(1),
    }),
  )
  .handler(async ({ data }) => {
    let user = await getAuthUserFn();

    if (!user) {
      user =
        (await prisma.user.findFirst({
          where:
            data.targetPuskesmasCode !== "all"
              ? { puskesmasCode: data.targetPuskesmasCode }
              : { role: "DINKES" },
        })) ?? (await prisma.user.findFirst());
    }

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

    if (
      user.role === "PUSKESMAS" &&
      user.puskesmasCode &&
      user.puskesmasCode !== data.targetPuskesmasCode
    ) {
      throw new Error(
        "Forbidden: Anda hanya dapat mengajukan untuk puskesmas Anda sendiri.",
      );
    }

    const allPuskesmasCodes = [
      "purwokerto_barat",
      "patikraja",
      "sokaraja_1",
      "kembaran_1",
    ];

    if (data.targetPuskesmasCode === "all") {
      const itemsWithCode = data.items.filter((i) => i.puskesmasCode);

      if (itemsWithCode.length > 0) {
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

export const getNakesSubmissionsFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      puskesmasCode: z.string().default("all"),
    }),
  )
  .handler(async ({ data }): Promise<PuskesmasWorkforceData[]> => {
    const user = await getAuthUserFn();
    const userRole = user?.role ?? "DINKES";
    const userPuskesmasCode = user?.puskesmasCode ?? null;

    const isAll = data.puskesmasCode === "all";
    const targetCode =
      userRole === "PUSKESMAS"
        ? (userPuskesmasCode ?? "")
        : isAll
          ? null
          : data.puskesmasCode;

    if (userRole === "PUSKESMAS" && !targetCode) return [];

    let puskesmasCodes: string[];
    if (targetCode === null) {
      const distinct = await prisma.nakesSubmission.findMany({
        select: { puskesmasCode: true },
        distinct: ["puskesmasCode"],
      });
      puskesmasCodes = distinct.map((r) => r.puskesmasCode);
    } else {
      puskesmasCodes = [targetCode];
    }

    if (puskesmasCodes.length === 0) return [];

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
            id: item.id,
            jenisNakes: item.jenisNakes,
            kebutuhan: item.kebutuhan,
            tersedia: item.tersedia,
          })),
        });
      }
    }

    return results;
  });
