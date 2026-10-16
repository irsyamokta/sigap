import {
  Activity,
  BedDouble,
  Building2,
  Minus,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { Panel, Section } from "@/components/dashboard/section";
import { StatCard } from "@/components/dashboard/stat-card";
import { EwsAlertBanner, EwsTrendChart } from "@/components/dashboard/ews";
import { EwsMap } from "@/components/dashboard/ews-map";
import {
  StandarTenagaChart,
  TenagaBarChart,
  RasioDonut,
  KunjunganHarianChart,
  KapasitasBarChart,
} from "@/components/dashboard/charts";
import { NakesRatioTable } from "@/components/dashboard/nakes-ratio-table";
import type { DashboardData } from "@/types/dashboard";
import type { NakesRatioItem } from "@/types/workforce";

const nf = new Intl.NumberFormat("id-ID");

interface DashboardPasienSectionProps {
  d: DashboardData;
}

export function DashboardPasienSection({ d }: DashboardPasienSectionProps) {
  return (
    <Section title="Data Pasien">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Total Kunjungan Pasien"
          value={nf.format(d.totalKunjunganSemua)}
          hint="Keseluruhan (4 Puskesmas)"
          icon={UserCheck}
        />
        <StatCard
          label={
            d.isDinkesView ? "Kunjungan Tertinggi" : "Kunjungan Puskesmas"
          }
          value={nf.format(d.totalKunjunganPuskesmas)}
          hint={
            d.isDinkesView
              ? `${d.kunjunganPuskesmasNama} (tertinggi)`
              : `Total di ${d.kunjunganPuskesmasNama}`
          }
          icon={Building2}
        />
        <StatCard
          label="Total Pasien Sakit"
          value={nf.format(d.pasienSakit)}
          hint={d.pasienSakitHint}
          icon={Users}
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
          label="Penyakit Tertinggi"
          value={d.penyakitTeratas[0]?.nama ?? "-"}
          hint={
            d.penyakitTeratas[0]
              ? `${d.penyakitTeratas[0].persen}% dari total kasus`
              : "Tidak ada data kasus"
          }
          icon={Activity}
        />
      </div>
    </Section>
  );
}

interface DashboardEwsSectionProps {
  d: DashboardData;
}

export function DashboardEwsSection({ d }: DashboardEwsSectionProps) {
  return (
    <Section title="Sistem Peringatan Dini (EWS)">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="text-xs text-muted-foreground">
          Pemantauan kasus penyakit secara geografis dan 10 penyakit teratas.
        </p>
        {d.ewsAlerts.length === 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Semua
            indikator normal
          </span>
        )}
      </div>
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-12">
        <div className="rounded-xl border bg-card p-4 shadow-sm lg:col-span-7 xl:col-span-8 flex flex-col">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Peta Sebaran Kasus Waspada
          </h3>
          <div className="flex-1">
            <EwsMap data={d} />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm lg:col-span-5 xl:col-span-4 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                10 Penyakit Paling Sering Muncul
              </h3>
              <span className="text-[11px] font-medium text-muted-foreground">
                Top 10
              </span>
            </div>
            {d.penyakitTeratas.length > 0 ? (
              <ul className="space-y-2.5">
                {d.penyakitTeratas.map((p, index) => (
                  <li key={p.nama} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="flex items-start gap-2 font-medium text-foreground min-w-0">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <span className="leading-snug">{p.nama}</span>
                      </span>
                      <span className="shrink-0 font-semibold text-primary">
                        {p.persen}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full [background:var(--gradient-primary)] transition-all duration-300"
                        style={{
                          width: `${(p.persen / (d.penyakitTeratas[0]?.persen || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                Tidak ada data penyakit pada periode ini.
              </p>
            )}
          </div>

          {d.penyakitTeratas.length > 0 && (() => {
            const totalTop10Percent = d.penyakitTeratas
              .reduce((sum, p) => sum + p.persen, 0)
              .toFixed(1);
            const totalTop10Kasus = d.penyakitTeratas.reduce(
              (sum, p) => sum + (p.kasus ?? 0),
              0,
            );
            const totalSemuaKasus =
              d.totalKasusDiagnosis ??
              d.vektorPenyakit?.reduce((sum, p) => sum + p.kasus, 0) ??
              0;
            const sisaPercent = Math.max(
              0,
              100 - parseFloat(totalTop10Percent),
            ).toFixed(1);

            return (
              <div className="mt-4 rounded-lg border border-border/80 bg-muted/40 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    Akumulasi 10 Penyakit Teratas
                  </span>
                  <span className="font-bold text-primary">
                    {totalTop10Percent}% Total Kasus
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  10 penyakit ini mencakup <strong>{totalTop10Percent}%</strong>
                  {totalTop10Kasus > 0 && ` (${nf.format(totalTop10Kasus)} kasus)`}
                  {totalSemuaKasus > 0 &&
                    ` dari total ${nf.format(totalSemuaKasus)} diagnosis`}
                  . Sisanya <strong>{sisaPercent}%</strong> tersebar pada diagnosis lainnya.
                </p>
              </div>
            );
          })()}
        </div>
      </div>
    </Section>
  );
}

interface DashboardTrenMingguanSectionProps {
  d: DashboardData;
}

export function DashboardTrenMingguanSection({
  d,
}: DashboardTrenMingguanSectionProps) {
  return (
    <Section title="Tren Mingguan Penyakit">
      <EwsTrendChart data={d.ewsTren} />
    </Section>
  );
}

interface DashboardPenyakitSectionProps {
  d: DashboardData;
}

export function DashboardPenyakitSection({
  d,
}: DashboardPenyakitSectionProps) {
  const rawatInapCount = d.kapasitasPerPuskesmas.filter(
    (p) => p.isRawatInap && p.kapasitas > 0,
  ).length;
  const totalKapasitas = d.kapasitasPerPuskesmas.reduce(
    (sum, p) => sum + p.kapasitas,
    0,
  );

  return (
    <Section title="Kapasitas Rawat Inap per Puskesmas">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          <BedDouble className="size-3" />
          {rawatInapCount} Puskesmas Rawat Inap
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          Total Kapasitas: {totalKapasitas} TT
        </span>
      </div>
      <KapasitasBarChart data={d.kapasitasPerPuskesmas} height={260} />
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Bar berwarna = Rawat Inap aktif · Bar pudar = Non-Rawat Inap
      </p>
    </Section>
  );
}

interface DashboardNakesSectionProps {
  d: DashboardData;
  onDeleteItems: (items: NakesRatioItem[]) => Promise<void>;
}

export function DashboardNakesSection({
  d,
  onDeleteItems,
}: DashboardNakesSectionProps) {
  const sectionTitle = `Data Tenaga Kesehatan ${d.nama}`;

  return (
    <Section title={sectionTitle}>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">
        <Panel
          title="Analisis Jumlah Tenaga per Profesi"
          className="lg:col-span-3 flex flex-col justify-between"
        >
          <TenagaBarChart data={d.tenagaPerProfesi} />
        </Panel>

        <div className="lg:col-span-6 flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="w-full sm:w-[150px] shrink-0 flex flex-col justify-between gap-2.5">
            <Panel className="text-center p-3 flex flex-col justify-center items-center flex-1 bg-card shadow-xs border border-border">
              <p className="text-[11px] font-medium text-muted-foreground leading-tight">
                Total Tenaga Kesehatan
              </p>
              <p className="mt-1 text-xl font-extrabold text-foreground">
                {d.totalTenaga}
              </p>
            </Panel>
            <Panel className="text-center p-3 flex flex-col justify-center items-center flex-1 bg-card shadow-xs border border-border">
              <p className="text-[11px] font-medium text-muted-foreground leading-tight">
                Prioritas Tenaga Kesehatan
              </p>
              <p
                className="mt-1 text-sm font-bold text-foreground truncate max-w-full"
                title={d.prioritasTenagaKesehatan}
              >
                {d.prioritasTenagaKesehatan}
              </p>
            </Panel>
            <Panel className="text-center p-3 flex flex-col justify-center items-center flex-1 bg-card shadow-xs border border-border">
              <p className="text-[11px] font-medium text-muted-foreground leading-tight">
                Prioritas Puskesmas
              </p>
              <p
                className="mt-1 text-sm font-bold text-amber-600 dark:text-amber-400 truncate max-w-full"
                title={d.prioritasPuskesmas}
              >
                {d.prioritasPuskesmas}
              </p>
            </Panel>
          </div>

          <Panel
            title="Analisis Berdasarkan Target Rasio Tenaga Kesehatan"
            className="flex-1 min-w-0 flex flex-col justify-between"
          >
            <StandarTenagaChart data={d.standarTenaga} />
          </Panel>
        </div>

        <Panel
          title="Rasio Kecukupan Tenaga Kesehatan"
          className="lg:col-span-3 flex flex-col justify-between"
        >
          <RasioDonut
            value={d.rasio}
            totalTenaga={d.totalTenaga}
            totalKebutuhan={d.totalKebutuhan}
            keterangan={d.prioritasNakes?.keterangan}
          />
        </Panel>
      </div>

      {/* <div className="mt-5 border-t border-border/60 pt-5">
        <NakesRatioTable
          items={d.nakesRatios || []}
          onDeleteItems={onDeleteItems}
        />
      </div> */}
    </Section>
  );
}

interface EwsAlertBannerWrapperProps {
  alerts: DashboardData["ewsAlerts"];
}

export function DashboardAlertBanner({ alerts }: EwsAlertBannerWrapperProps) {
  return <EwsAlertBanner alerts={alerts} />;
}

interface DashboardKunjunganSectionProps {
  d: DashboardData;
}

export function DashboardKunjunganSection({
  d,
}: DashboardKunjunganSectionProps) {
  return (
    <Section
      title={
        d.isDinkesView
          ? `Tren Kunjungan Harian — ${d.kunjunganPuskesmasNama} (Tertinggi)`
          : `Tren Kunjungan Harian — ${d.kunjunganPuskesmasNama}`
      }
    >
      <KunjunganHarianChart data={d.kunjunganHarian} />
    </Section>
  );
}
