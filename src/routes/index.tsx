import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, HeartPulse, TrendingUp, Users } from "lucide-react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { AiSummary } from "@/components/dashboard/ai-summary";
import { EwsAlertBanner, EwsTrendChart } from "@/components/dashboard/ews";
import { EwsMap } from "@/components/dashboard/ews-map";
import { Navbar } from "@/components/dashboard/navbar";
import { Panel, Section } from "@/components/dashboard/section";
import { StatCard } from "@/components/dashboard/stat-card";
import { ThemeSwitcher } from "@/components/dashboard/theme-switcher";
import {
  OkupansiChart,
  PerbandinganChart,
  RasioDonut,
  StandarTenagaChart,
  TenagaBarChart,
  TrenPerawatanChart,
  VektorPenyakitChart,
  KunjunganHarianChart,
  KunjunganMultiLineChart,
} from "@/components/dashboard/charts";
import { fetchDashboardData, type PuskesmasId } from "@/data/dashboard";
import { generateSummary } from "@/lib/ai.functions";
import { getAuthUserFn } from "@/lib/auth";
const nf = new Intl.NumberFormat("id-ID");

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
      { property: "og:title", content: "Dashboard Sigap" },
      {
        property: "og:description",
        content: "Ringkasan data pasien, tren perawatan, dan kecukupan tenaga kesehatan per puskesmas.",
      },
    ],
  }),
  beforeLoad: async () => {
    const user = await getAuthUserFn();
    if (!user) {
      throw redirect({
        to: "/login",
      });
    }
    return { user };
  },
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const [scrolled, setScrolled] = useState(false);
  // Restrict Puskesmas users to their own clinic's data; default to "all" for Dinkes admins.
  const [puskesmas, setPuskesmas] = useState<PuskesmasId>(
    user.role === "PUSKESMAS" && user.puskesmasCode ? (user.puskesmasCode as PuskesmasId) : "all"
  );
  const [range, setRange] = useState<DateRange | undefined>(getDefaultRange);

  const { data: d, isLoading, error } = useQuery({
    queryKey: ['dashboard', puskesmas, range?.from?.toISOString(), range?.to?.toISOString()],
    queryFn: async () => {
      const start = range?.from ?? getDefaultRange().from!;
      const end = range?.to ?? (range?.from ?? getDefaultRange().to!);
      return fetchDashboardData(puskesmas, start, end);
    },
    placeholderData: keepPreviousData
  });

  const periodeLabel = formatRange(range);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleGenerateSummary() {
    if (!d) return { error: "Data belum dimuat" };
    const ringkasan = [
      `Total pasien sakit: ${d.pasienSakit}`,
      `Total pasien sembuh: ${d.pasienSembuh}`,
      `Tren penyakit: ${d.trenPenyakit}`,
      `Penyakit terbanyak: ${d.penyakitTeratas.map((p) => `${p.nama} ${p.persen}%`).join(", ")}`,
      `Total tenaga kesehatan: ${d.totalTenaga} dari kebutuhan ${d.totalKebutuhan} (rasio ${d.rasio}%)`,
      `Okupansi ruang per bulan: ${d.okupansiRuang.map((o) => `${o.bulan} ${o.okupansi}%`).join(", ")}`,
    ].join("\n");

    return generateSummary({
      data: { puskesmas: d.nama, periode: periodeLabel, ringkasan },
    });
  }

  // Hanya tampilkan full-screen loading jika data belum pernah dimuat (first load)
  if (isLoading && !d) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="animate-pulse text-sm text-muted-foreground">Memuat data agregat Dinkominfo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-destructive">
        Gagal memuat data: {(error as Error).message}
      </div>
    );
  }

  // After all guards, `d` is guaranteed to be defined from here on.
  if (!d) return null;

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

      {/* EWS alert banner — shown above main content when alerts are active */}
      <EwsAlertBanner alerts={d.ewsAlerts} />

      <main className="mx-auto max-w-screen-2xl space-y-5 px-3 py-4 sm:px-6 sm:py-6">
        {/* Patient Metrics Section */}
        <Section title="Data Pasien">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Jumlah Pasien Sakit" value={nf.format(d.pasienSakit)} hint="+4,2% dari periode sebelumnya" icon={Users} />
            <StatCard label="Jumlah Pasien Sembuh" value={nf.format(d.pasienSembuh)} hint="+6,4% dari periode sebelumnya" icon={HeartPulse} />
            <StatCard label="Tren Penyakit" value={d.trenPenyakit} hint="dibanding periode sebelumnya" icon={TrendingUp} highlight />
            <StatCard label="Penyakit Paling Sering" value={d.penyakitTeratas[0].nama} hint={`${d.penyakitTeratas[0].persen}% dari total kasus`} icon={Activity} />
          </div>
        </Section>

        {/* AI Summary Generation Section */}
        <Section title="Ringkasan AI">
          <AiSummary
            key={puskesmas}
            puskesmasNama={d.nama}
            periodeLabel={periodeLabel}
            onGenerate={handleGenerateSummary}
          />
        </Section>

        {/* Early Warning System Section */}
        <Section title="Sistem Peringatan Dini (EWS)">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Pemantauan kasus penyakit secara geografis dan tren waktu. Garis putus-putus pada grafik menunjukkan batas siaga.
            </p>
            {d.ewsAlerts.length === 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Semua indikator normal
              </span>
            )}
          </div>
          
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Peta Sebaran Kasus Waspada</h3>
              <EwsMap data={d} />
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Tren Mingguan Penyakit</h3>
              <EwsTrendChart data={d.ewsTren} />
            </div>
          </div>
        </Section>

        {/* Kunjungan Harian Section */}
        <Section title={d.isDinkesView ? "Kunjungan Harian Semua Puskesmas" : "Tren Kunjungan Harian"} >
          <p className="mb-4 text-xs text-muted-foreground">
            {d.isDinkesView
              ? "Perbandingan volume kunjungan harian antar puskesmas dalam periode yang dipilih."
              : "Volume kunjungan harian pada puskesmas ini selama periode yang dipilih."}
          </p>
          {d.isDinkesView ? (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-4">
                {(["purwokerto_barat", "patikraja", "sokaraja_1", "kembaran_1"] as const).map((pid, i) => {
                  const colors = ["bg-primary", "bg-chart-2", "bg-chart-3", "bg-chart-4"];
                  const labels: Record<string, string> = {
                    purwokerto_barat: "Purwokerto Barat",
                    patikraja: "Patikraja",
                    sokaraja_1: "Sokaraja 1",
                    kembaran_1: "Kembaran 1",
                  };
                  return (
                    <span key={pid} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={`h-0.5 w-5 rounded ${colors[i]}`} />
                      {labels[pid]}
                    </span>
                  );
                })}
              </div>
              <KunjunganMultiLineChart data={d.kunjunganHarian} />
            </>
          ) : (
            <KunjunganHarianChart data={d.kunjunganHarian} />
          )}
        </Section>

        {/* Treatment Trends & Diagnoses Section */}
        <div className="grid gap-5 lg:grid-cols-3">
          <Section title="Tren Perawatan" className="lg:col-span-2">
            <div className="mb-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 rounded bg-primary" /> Pasien Sakit
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 rounded bg-chart-2" /> Pasien Sembuh
              </span>
            </div>
            <TrenPerawatanChart data={d.trenPerawatan} />
          </Section>

          <Section title="Penyakit yang Paling Sering Muncul">
            <ul className="space-y-4">
              {d.penyakitTeratas.map((p) => (
                <li key={p.nama} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{p.nama}</span>
                    <span className="font-semibold text-primary">{p.persen}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full [background:var(--gradient-primary)]"
                      style={{ width: `${(p.persen / d.penyakitTeratas[0].persen) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* Healthcare Workforce Analysis Section */}
        <Section title="Data Tenaga Kesehatan">
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Panel className="text-center">
                  <p className="text-[11px] text-muted-foreground">Total Tenaga</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{d.totalTenaga}</p>
                </Panel>
                <Panel className="text-center">
                  <p className="text-[11px] text-muted-foreground">Last Update</p>
                  <p className="mt-1 text-sm font-bold text-foreground">21 Apr 2025</p>
                </Panel>
                <Panel className="text-center">
                  <p className="text-[11px] text-muted-foreground">Kebutuhan</p>
                  <p className="mt-1 text-xl font-bold text-primary">{d.totalKebutuhan}</p>
                </Panel>
              </div>
              <Panel title="Analisis Jumlah Tenaga per Profesi">
                <TenagaBarChart data={d.tenagaPerProfesi} />
              </Panel>
            </div>

            <Panel title="Analisis Berdasarkan Standar Tenaga Kesehatan">
              <StandarTenagaChart data={d.standarTenaga} />
            </Panel>

            <Panel title="Rasio Kecukupan Tenaga Kesehatan">
              <RasioDonut value={d.rasio} />
              <p className="text-center text-[11px] text-muted-foreground mt-2">dari standar 100%</p>
            </Panel>
          </div>
        </Section>

        {/* Extended Graphs & Visual Analytics Section */}
        <Section title="Grafik & Analisis">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Panel title="Perbandingan Pasien & Kapasitas">
              <PerbandinganChart data={d.perbandinganKapasitas} />
            </Panel>
            <Panel title="Grafik Okupansi Ruang">
              <OkupansiChart data={d.okupansiRuang} />
            </Panel>
            <Panel title="Grafik Vektor Penyakit (Top 5)">
              <VektorPenyakitChart data={d.vektorPenyakit} />
            </Panel>
          </div>
        </Section>
      </main>
    </div>
  );
}
