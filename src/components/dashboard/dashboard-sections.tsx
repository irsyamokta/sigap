import {
  Activity,
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
  PerbandinganChart,
  StandarTenagaChart,
  TenagaBarChart,
  RasioDonut,
  KunjunganHarianChart,
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Jumlah Pasien Sakit"
          value={nf.format(d.pasienSakit)}
          hint="+4,2% dari periode sebelumnya"
          icon={Users}
        />
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
          Pemantauan kasus penyakit secara geografis dan tren waktu.
        </p>
        {d.ewsAlerts.length === 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Semua
            indikator normal
          </span>
        )}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Peta Sebaran Kasus Waspada
          </h3>
          <EwsMap data={d} />
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Tren Mingguan Penyakit
          </h3>
          <EwsTrendChart data={d.ewsTren} />
        </div>
      </div>
    </Section>
  );
}

interface DashboardPenyakitSectionProps {
  d: DashboardData;
}

export function DashboardPenyakitSection({ d }: DashboardPenyakitSectionProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Section
        title="Perbandingan Pasien & Kapasitas"
        className="lg:col-span-2"
      >
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
                    <span className="font-semibold text-primary">
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
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Tidak ada data penyakit pada periode ini.
          </p>
        )}
      </Section>
    </div>
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
  return (
    <Section title="Data Tenaga Kesehatan">
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Panel className="text-center">
              <p className="text-[11px] text-muted-foreground">Total Tenaga</p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {d.totalTenaga}
              </p>
            </Panel>
            <Panel className="text-center">
              <p className="text-[11px] text-muted-foreground">Last Update</p>
              <p className="mt-1 text-sm font-bold text-foreground">
                21 Apr 2025
              </p>
            </Panel>
            <Panel className="text-center">
              <p className="text-[11px] text-muted-foreground">
                {d.prioritasNakes.label}
              </p>
              <p className="mt-1 text-sm font-bold text-amber-600 truncate">
                {d.prioritasNakes.nama}
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
        <Panel
          title="Rasio Kecukupan Tenaga Kesehatan"
          className="flex flex-col justify-between"
        >
          <RasioDonut
            value={d.rasio}
            totalTenaga={d.totalTenaga}
            totalKebutuhan={d.totalKebutuhan}
            keterangan={d.prioritasNakes?.keterangan}
          />
        </Panel>
      </div>

      <div className="mt-5 border-t border-border/60 pt-5">
        <NakesRatioTable
          items={d.nakesRatios || []}
          onDeleteItems={onDeleteItems}
        />
      </div>
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
