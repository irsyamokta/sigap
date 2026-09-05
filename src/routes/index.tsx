import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, Minus, TrendingDown, TrendingUp, UserCheck, Users } from "lucide-react";
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
  PerbandinganChart,
  RasioDonut,
  StandarTenagaChart,
  TenagaBarChart,
  KunjunganHarianChart,
} from "@/components/dashboard/charts";
import { fetchDashboardData, puskesmasList, type PuskesmasId } from "@/data/dashboard";
import { generateSummary } from "@/lib/ai.functions";
import { getAuthUserFn } from "@/lib/auth";
const nf = new Intl.NumberFormat("id-ID");

function getDefaultRange(): DateRange {
 
  const latestDataDate = new Date(2026, 7, 14); // 14 Agustus 2026
  const today = new Date();
  const refDate = today > latestDataDate ? latestDataDate : today;
  return {
    from: new Date(refDate.getFullYear(), refDate.getMonth(), 1),
    to: refDate,
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
  const navigate = Route.useNavigate();

  const handleLogout = async () => {
    navigate({ to: "/login" });
  };

  const [scrolled, setScrolled] = useState(false);

  // Filters State
  const [range, setRange] = useState<DateRange | undefined>(getDefaultRange);
  const [puskesmas, setPuskesmas] = useState<PuskesmasId>(
    user.role === "PUSKESMAS" && user.puskesmasCode ? (user.puskesmasCode as PuskesmasId) : "all"
  );

  const periodeLabel = formatRange(range);

  const { data: d, isLoading, error } = useQuery({
    queryKey: ["dashboard", puskesmas, range?.from?.toISOString(), range?.to?.toISOString()],
    queryFn: async () => {
      const start = range?.from ?? getDefaultRange().from!;
      const end = range?.to ?? (range?.from ?? getDefaultRange().to!);
      return fetchDashboardData(puskesmas, start, end);
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleGenerateSummary() {
    if (!d) return { error: "Data belum dimuat" };

    const ewsSummary = d.ewsAlerts.length > 0
      ? d.ewsAlerts.map(a => `[${a.status}] ${a.penyakit}: ${nf.format(a.kasus)} kasus (Threshold: ${nf.format(a.threshold)})`).join("; ")
      : "Semua indikator EWS dalam batas aman (Normal).";

    const pAlertsSummary = d.isDinkesView && d.puskesmasAlerts
      ? Object.entries(d.puskesmasAlerts)
          .map(([pid, alerts]) => {
            if (!alerts.length) return null;
            const pName = puskesmasList.find(p => p.id === pid)?.nama ?? pid;
            return `${pName}: ${alerts.map(a => `${a.penyakit} (${a.status}, ${nf.format(a.kasus)} kasus)`).join(", ")}`;
          })
          .filter(Boolean)
          .join("; ")
      : "";

    const nakesDefisit = d.standarTenaga
      .filter(s => s.kebutuhan > s.tersedia)
      .map(s => `${s.nama} (Tersedia ${s.tersedia} dari ${s.kebutuhan}, kurang ${s.kebutuhan - s.tersedia})`)
      .join("; ");

    const ringkasan = [
      `Tampilan Wilayah: ${d.isDinkesView ? "Seluruh Puskesmas di Kab. Banyumas (Perspektif Dinkes)" : d.nama}`,
      `Puskesmas Kunjungan Pasien Tertinggi: ${d.kunjunganPuskesmasNama} (${nf.format(d.totalKunjunganPuskesmas)} kunjungan)`,
      `Total Pasien Sakit: ${nf.format(d.pasienSakit)} orang`,
      `Total Pasien Sembuh: ${nf.format(d.pasienSembuh)} orang`,
      `Tren Penyakit: ${d.trenPenyakit} (${d.trenPenyakitHint})`,
      `10 Penyakit Teratas: ${d.penyakitTeratas.map((p, i) => `${i + 1}. ${p.nama} (${p.persen}%)`).join(", ")}`,
      `Status Early Warning System (EWS) Wilayah: ${ewsSummary}`,
      pAlertsSummary ? `Detail Status Alert EWS per Puskesmas: ${pAlertsSummary}` : "",
      `Tenaga Kesehatan Terpasang: Total ${d.totalTenaga} dari kebutuhan ${d.totalKebutuhan} personel (Rasio kecukupan ${d.rasio}%)`,
      `Prioritas Nakes (Fasilitas / Profesi): ${d.prioritasNakes.fullName} — ${d.prioritasNakes.keterangan}`,
      `Rincian Profesi Nakes yang Kurang: ${nakesDefisit || "Semua profesi nakes telah memenuhi standar minimal"}`,
      `Okupansi Perawatan Bulanan: ${d.okupansiRuang.map((o) => `${o.bulan} (${o.okupansi}%)`).join(", ")}`,
    ].filter(Boolean).join("\n");

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
            <StatCard
              label="Jumlah Kunjungan Pasien"
              value={nf.format(d.totalKunjunganPuskesmas)}
              hint={
                d.isDinkesView
                  ? `${d.kunjunganPuskesmasNama} (tertinggi)`
                  : `Total di ${d.kunjunganPuskesmasNama}`
              }
              icon={UserCheck}
            />
            <StatCard
              label="Tren Penyakit"
              value={d.trenPenyakit}
              hint={d.trenPenyakitHint}
              icon={
                d.trenPenyakit === "Menurun"
                  ? TrendingDown
                  : d.trenPenyakit === "Stabil"
                  ? Minus
                  : TrendingUp
              }
              highlight
            />
            <StatCard
              label="Penyakit Paling Sering"
              value={d.penyakitTeratas[0]?.nama ?? "-"}
              hint={d.penyakitTeratas[0] ? `${d.penyakitTeratas[0].persen}% dari total kasus` : "Tidak ada data kasus"}
              icon={Activity}
            />
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
        <Section
          title={
            d.isDinkesView
              ? `Tren Kunjungan Harian — ${d.kunjunganPuskesmasNama} (Tertinggi)`
              : `Tren Kunjungan Harian — ${d.kunjunganPuskesmasNama}`
          }
        >
          <p className="mb-4 text-xs text-muted-foreground">
            {d.isDinkesView
              ? `Menampilkan volume kunjungan harian pada puskesmas dengan volume kunjungan tertinggi (${d.kunjunganPuskesmasNama}) selama periode yang dipilih.`
              : `Volume kunjungan harian pada ${d.kunjunganPuskesmasNama} selama periode yang dipilih.`}
          </p>
          <KunjunganHarianChart data={d.kunjunganHarian} />
        </Section>

        {/* Patient Comparison & Top Diagnoses Section */}
        <div className="grid gap-5 lg:grid-cols-3">
          <Section title="Perbandingan Pasien & Kapasitas" className="lg:col-span-2">
            <div className="mb-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 rounded bg-primary" /> Pasien
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 rounded bg-chart-4" /> Kapasitas
              </span>
            </div>
            <PerbandinganChart data={d.perbandinganKapasitas} height={260} />
          </Section>

          <Section title="10 Penyakit Paling Sering Muncul">
            {d.penyakitTeratas.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto pr-1">
                <ul className="space-y-2.5">
                  {d.penyakitTeratas.map((p, index) => (
                    <li key={p.nama} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                            {index + 1}
                          </span>
                          {p.nama}
                        </span>
                        <span className="font-semibold text-primary">{p.persen}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full [background:var(--gradient-primary)] transition-all duration-300"
                          style={{ width: `${(p.persen / (d.penyakitTeratas[0]?.persen || 1)) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground">Tidak ada data penyakit pada periode ini.</p>
              </div>
            )}
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
                  <p className="text-[10px] text-muted-foreground mt-0.5">dari {d.totalKebutuhan} nakes</p>
                </Panel>
                <Panel className="text-center">
                  <p className="text-[11px] text-muted-foreground">Last Update</p>
                  <p className="mt-1 text-sm font-bold text-foreground">21 Apr 2025</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Dinkes Banyumas</p>
                </Panel>
                <Panel className="text-center">
                  <p className="text-[11px] text-muted-foreground">{d.prioritasNakes.label}</p>
                  <p className="mt-1 text-sm font-bold text-amber-600 dark:text-amber-400 truncate" title={d.prioritasNakes.fullName}>
                    {d.prioritasNakes.nama}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={d.prioritasNakes.keterangan}>
                    {d.prioritasNakes.keterangan}
                  </p>
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


      </main>
    </div>
  );
}
