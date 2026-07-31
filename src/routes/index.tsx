import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, HeartPulse, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { AiSummary } from "@/components/dashboard/ai-summary";
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
} from "@/components/dashboard/charts";
import { getDashboardData, type PuskesmasId } from "@/data/dashboard";
import { generateSummary } from "@/lib/ai.functions";

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
          "Dashboard rumah sakit: ringkasan data pasien, tren perawatan, penyakit terbanyak, dan kecukupan tenaga kesehatan per puskesmas.",
      },
      { property: "og:title", content: "Dashboard Rumah Sakit" },
      {
        property: "og:description",
        content: "Ringkasan data pasien, tren perawatan, dan kecukupan tenaga kesehatan per puskesmas.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [scrolled, setScrolled] = useState(false);
  const [puskesmas, setPuskesmas] = useState<PuskesmasId>("all");
  const [range, setRange] = useState<DateRange | undefined>(getDefaultRange);

  const d = useMemo(() => getDashboardData(puskesmas), [puskesmas]);
  const periodeLabel = formatRange(range);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleGenerateSummary() {
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

  return (
    <div className="min-h-screen bg-background">
      <ThemeSwitcher />

      <Navbar
        scrolled={scrolled}
        periodeLabel={periodeLabel}
        range={range}
        onRangeChange={setRange}
        puskesmas={puskesmas}
        onPuskesmasChange={setPuskesmas}
        defaultRange={getDefaultRange()}
      />

      <main className="mx-auto max-w-screen-2xl space-y-5 px-3 py-4 sm:px-6 sm:py-6">
        {/* Data Pasien */}
        <Section title="Data Pasien">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Jumlah Pasien Sakit" value={nf.format(d.pasienSakit)} hint="+4,2% dari periode sebelumnya" icon={Users} />
            <StatCard label="Jumlah Pasien Sembuh" value={nf.format(d.pasienSembuh)} hint="+6,4% dari periode sebelumnya" icon={HeartPulse} />
            <StatCard label="Tren Penyakit" value={d.trenPenyakit} hint="dibanding periode sebelumnya" icon={TrendingUp} highlight />
            <StatCard label="Penyakit Paling Sering" value={d.penyakitTeratas[0].nama} hint={`${d.penyakitTeratas[0].persen}% dari total kasus`} icon={Activity} />
          </div>
        </Section>

        {/* Ringkasan AI */}
        <Section title="Ringkasan AI">
          <AiSummary
            puskesmasNama={d.nama}
            periodeLabel={periodeLabel}
            onGenerate={handleGenerateSummary}
          />
        </Section>

        {/* Tren & Penyakit */}
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

        {/* Tenaga Kesehatan */}
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

        {/* Grafik & Analisis */}
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
