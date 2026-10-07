import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { Navbar } from "@/components/dashboard/navbar";
import { ThemeSwitcher } from "@/components/dashboard/theme-switcher";
import { AiSummary } from "@/components/dashboard/ai-summary";
import { Section } from "@/components/dashboard/section";
import {
  DashboardPasienSection,
  DashboardEwsSection,
  DashboardKunjunganSection,
  DashboardPenyakitSection,
  DashboardNakesSection,
  DashboardAlertBanner,
} from "@/components/dashboard/dashboard-sections";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { NakesUploadDrawer } from "@/components/dashboard/nakes-upload-drawer";

import { fetchDashboardData } from "@/data/dashboard";
import type { PuskesmasId } from "@/types/dashboard";
import type { NakesRatioItem } from "@/types/workforce";
import { getAuthUserFn } from "@/lib/auth";
import { deleteNakesItemsFn } from "@/lib/api/workforce";
import { createAiDashboardSummary } from "@/lib/summary-formatter";

function getDefaultRange(): DateRange {
  const today = new Date();
  return {
    from: new Date(today.getFullYear(), today.getMonth(), 1),
    to: today,
  };
}

export function formatRange(range: DateRange | undefined) {
  if (!range?.from) return "Pilih periode";
  const fmt = (d: Date) => format(d, "dd/MM/yyyy", { locale: id });
  return range.to ? `${fmt(range.from)} – ${fmt(range.to)}` : fmt(range.from);
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Sigap" },
      {
        name: "description",
        content:
          "Dashboard Sigap: ringkasan data pasien, tren perawatan, penyakit terbanyak, dan kecukupan tenaga kesehatan per puskesmas.",
      },
    ],
  }),
  beforeLoad: async () => {
    const user = await getAuthUserFn();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const [scrolled, setScrolled] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(getDefaultRange);
  const [puskesmas, setPuskesmas] = useState<PuskesmasId>(
    user.role === "PUSKESMAS" && user.puskesmasCode
      ? (user.puskesmasCode as PuskesmasId)
      : "all",
  );

  const periodeLabel = formatRange(range);

  const {
    data: dashboardData,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: [
      "dashboard",
      puskesmas,
      range?.from?.toISOString(),
      range?.to?.toISOString(),
    ],
    queryFn: async () => {
      const start = range?.from ?? getDefaultRange().from!;
      const end = range?.to ?? range?.from ?? getDefaultRange().to!;
      return fetchDashboardData(puskesmas, start, end);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleNakesUpload = async () => {
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleGenerateSummary() {
    if (!dashboardData) return { error: "Data belum dimuat" };
    return createAiDashboardSummary(dashboardData, periodeLabel);
  }

  const handleDeleteItems = async (itemsToDelete: NakesRatioItem[]) => {
    const itemIds = itemsToDelete
      .map((i) => i.submissionItemId || i.id)
      .filter(Boolean);
    const targets = itemsToDelete
      .filter((i) => i.puskesmasCode && i.jenisNakes)
      .map((i) => ({
        puskesmasCode: i.puskesmasCode!,
        jenisNakes: i.jenisNakes,
      }));
    await deleteNakesItemsFn({ data: { itemIds, targets } });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const showSkeleton = isLoading || isFetching || !dashboardData;

  return (
    <div className="min-h-screen bg-background">
      <ThemeSwitcher />

      <Navbar
        user={user}
        scrolled={scrolled}
        periodeLabel={periodeLabel}
        range={range}
        onRangeChange={setRange}
        puskesmas={puskesmas}
        onPuskesmasChange={setPuskesmas}
        defaultRange={getDefaultRange()}
      />

      {error ? (
        <div className="mx-auto max-w-screen-2xl p-6 text-center text-destructive">
          Gagal memuat data: {(error as Error).message}
        </div>
      ) : showSkeleton ? (
        <main className="mx-auto max-w-screen-2xl space-y-5 px-3 py-4 sm:px-6 sm:py-6">
          <DashboardSkeleton />
        </main>
      ) : (
        <>
          <DashboardAlertBanner alerts={dashboardData.ewsAlerts} />

          <main className="mx-auto max-w-screen-2xl space-y-5 px-3 py-4 sm:px-6 sm:py-6">
            <DashboardPasienSection d={dashboardData} />
            <DashboardEwsSection d={dashboardData} />
            <DashboardKunjunganSection d={dashboardData} />
            <DashboardPenyakitSection d={dashboardData} />
            <DashboardNakesSection
              d={dashboardData}
              onDeleteItems={handleDeleteItems}
            />

            <Section title="Ringkasan AI">
              <AiSummary
                key={puskesmas}
                puskesmasNama={dashboardData.nama}
                periodeLabel={periodeLabel}
                onGenerate={handleGenerateSummary}
              />
            </Section>
          </main>
        </>
      )}

      <NakesUploadDrawer
        userRole={user.role as "DINKES" | "PUSKESMAS"}
        selectedPuskesmasId={puskesmas}
        onProcessUpload={handleNakesUpload}
      />
    </div>
  );
}
