import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  SupportedPuskesmasId,
  SimpusPuskesmasInfo,
  SimpusDailyItem,
  SimpusDashboardDataResponse,
} from "@/types/simpus";

import { TARGET_PUSKESMAS, TARGET_PUSKESMAS_CODES } from "./config";
import { mapConcurrent } from "./utils";
import { getSimpusToken } from "./auth";
import { fetchPuskesmasStaticInfo } from "./services/static-info.service";
import { fetchDailyPuskesmasData } from "./services/daily-data.service";

export type {
  SupportedPuskesmasId,
  SimpusPuskesmasInfo,
  SimpusDailyItem,
  SimpusDashboardDataResponse,
};

export { TARGET_PUSKESMAS, TARGET_PUSKESMAS_CODES } from "./config";
export { getSimpusToken } from "./auth";
export { fetchPuskesmasStaticInfo } from "./services/static-info.service";
export { fetchDailyPuskesmasData } from "./services/daily-data.service";
export { generateFallbackDailyItem } from "./fallback";
export { dailyDataCache, staticInfoCache } from "./cache";

export const fetchSimpusDashboardDataFn = createServerFn({ method: "POST" })
  .validator(z.object({ puskesmasId: z.string(), dates: z.array(z.string()) }))
  .handler(async ({ data }): Promise<SimpusDashboardDataResponse> => {
    const baseUrl =
      process.env.BASE_URL || "https://simpus.banyumaskab.go.id/api_telkom/v1";
    const token = await getSimpusToken();
    const headers = { Authorization: `Bearer ${token}` };

    const selectedCodes: SupportedPuskesmasId[] =
      data.puskesmasId === "all"
        ? TARGET_PUSKESMAS_CODES
        : TARGET_PUSKESMAS_CODES.includes(
              data.puskesmasId as SupportedPuskesmasId,
            )
          ? [data.puskesmasId as SupportedPuskesmasId]
          : TARGET_PUSKESMAS_CODES;

    const staticResults = await Promise.all(
      selectedCodes.map((code) =>
        fetchPuskesmasStaticInfo(code, baseUrl, headers),
      ),
    );

    const staticInfoMap = new Map<
      SupportedPuskesmasId,
      {
        isRawatInap: boolean;
        kapasitas: number;
        nakes: { profesi: string; jumlah: number }[];
      }
    >();
    const nakesBaselines: Record<
      string,
      { profesi: string; jumlah: number }[]
    > = {};

    for (const res of staticResults) {
      if (res) {
        staticInfoMap.set(res.code, res);
        nakesBaselines[res.code] = res.nakes;
      }
    }

    const taskItems: { code: SupportedPuskesmasId; dateStr: string }[] = [];
    for (const code of selectedCodes) {
      for (const dateStr of data.dates) {
        taskItems.push({ code, dateStr });
      }
    }

    const dailyData = await mapConcurrent(taskItems, 20, (item) => {
      const staticData = staticInfoMap.get(item.code) || {
        isRawatInap: false,
        kapasitas: 0,
        nakes: [],
      };
      return fetchDailyPuskesmasData(
        item.code,
        item.dateStr,
        staticData,
        baseUrl,
        headers,
      );
    });

    return { dailyData, nakesBaselines };
  });
