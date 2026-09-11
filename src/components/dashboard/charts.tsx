import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axisProps = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "10px",
    fontSize: "12px",
    color: "var(--color-card-foreground)",
  },
} as const;

export function TrenPerawatanChart({
  data,
}: {
  data: { bulan: string; sakit: number; sembuh: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gradSakit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradSembuh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="bulan" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Area
          type="monotone"
          dataKey="sakit"
          name="Pasien Sakit"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          fill="url(#gradSakit)"
        />
        <Area
          type="monotone"
          dataKey="sembuh"
          name="Pasien Sembuh"
          stroke="var(--color-chart-2)"
          strokeWidth={2}
          strokeDasharray="5 4"
          fill="url(#gradSembuh)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const NAKES_SHORT_LABELS: Record<string, string> = {
  "Dokter": "Dokter",
  "Dokter Gigi": "Dr. Gigi",
  "Perawat": "Perawat",
  "Bidan": "Bidan",
  "Tenaga Kesehatan Masyarakat": "Kesmas",
  "Tenaga Kesehatan Lingkungan (Sanitarian)": "Sanitarian",
  "Ahli Teknologi Laboratorium Medik (ATLM)": "ATLM",
  "Tenaga Gizi (Nutrisionis)": "Gizi",
  "Tenaga Kefarmasian": "Farmasi",
};

export function TenagaBarChart({ data }: { data: { nama: string; jumlah: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 25 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="nama"
          {...axisProps}
          tickFormatter={(name) => NAKES_SHORT_LABELS[name] ?? name}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={40}
        />
        <YAxis {...axisProps} />
        <Tooltip
          {...tooltipStyle}
          cursor={{ fill: "var(--color-accent)" }}
          formatter={(value: any, name: any, item: any) => [
            `${value} orang`,
            item?.payload?.nama ?? name,
          ]}
        />
        <Bar dataKey="jumlah" name="Tersedia" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StandarTenagaChart({
  data,
}: {
  data: { nama: string; tersedia: number; kebutuhan: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 12, left: 16, bottom: 0 }}
        barGap={2}
      >
        <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" {...axisProps} />
        <YAxis
          type="category"
          dataKey="nama"
          width={75}
          {...axisProps}
          tickFormatter={(name) => NAKES_SHORT_LABELS[name] ?? name}
          fontSize={10}
        />
        <Tooltip
          {...tooltipStyle}
          cursor={{ fill: "var(--color-accent)" }}
          formatter={(value: any, name: any, item: any) => [
            `${value} orang`,
            `${name} (${item?.payload?.nama ?? ""})`,
          ]}
        />
        <Bar dataKey="tersedia" name="Tersedia" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={8} />
        <Bar dataKey="kebutuhan" name="Kebutuhan" fill="var(--color-chart-3)" radius={[0, 4, 4, 0]} barSize={8} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RasioDonut({ value }: { value: number }) {
  const data = [
    { name: "Terpenuhi", value },
    { name: "Kurang", value: Math.max(0, 100 - value) },
  ];

  const statusInfo = value >= 80
    ? { label: "Cukup", color: "var(--color-primary)", textColor: "text-primary" }
    : value >= 50
    ? { label: "Sedang", color: "var(--color-chart-3)", textColor: "text-amber-600 dark:text-amber-400" }
    : { label: "Kritis", color: "var(--color-destructive)", textColor: "text-destructive" };

  return (
    <div className="relative mx-auto w-full max-w-[210px]">
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={68}
            outerRadius={92}
            startAngle={90}
            endAngle={-270}
            paddingAngle={2}
            stroke="none"
          >
            <Cell fill={statusInfo.color} />
            <Cell fill="var(--color-muted)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${statusInfo.textColor}`}>{value}%</span>
        <span className="text-xs font-medium text-muted-foreground">{statusInfo.label}</span>
      </div>
    </div>
  );
}

export function PerbandinganChart({
  data,
  height = 260,
}: {
  data: { bulan: string; pasien: number; kapasitas: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="bulan" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-accent)" }} />
        <Bar dataKey="pasien" name="Pasien" fill="var(--color-primary)" radius={[5, 5, 0, 0]} barSize={16} />
        <Bar dataKey="kapasitas" name="Kapasitas" fill="var(--color-chart-4)" radius={[5, 5, 0, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function OkupansiChart({ data }: { data: { bulan: string; okupansi: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="bulan" {...axisProps} />
        <YAxis {...axisProps} domain={[0, 100]} />
        <Tooltip {...tooltipStyle} />
        <Line
          type="monotone"
          dataKey="okupansi"
          name="Okupansi (%)"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--color-primary)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function VektorPenyakitChart({ data }: { data: { nama: string; kasus: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="nama" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-accent)" }} />
        <Bar dataKey="kasus" name="Kasus" fill="var(--color-primary)" radius={[6, 6, 0, 0]} barSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Single puskesmas daily visit chart
export function KunjunganHarianChart({
  data,
}: {
  data: Record<string, string | number>[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gradKunjungan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
        <YAxis {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Area
          type="monotone"
          dataKey="total"
          name="Kunjungan"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill="url(#gradKunjungan)"
          dot={false}
          activeDot={{ r: 4, fill: "var(--color-primary)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Multi-line chart for Dinkes view — one line per puskesmas
const PUSKESMAS_COLORS: Record<string, string> = {
  purwokerto_barat: "var(--color-primary)",
  patikraja:        "var(--color-chart-2)",
  sokaraja_1:       "var(--color-chart-3)",
  kembaran_1:       "var(--color-chart-4)",
};
const PUSKESMAS_LABELS: Record<string, string> = {
  purwokerto_barat: "Purwokerto Barat",
  patikraja:        "Patikraja",
  sokaraja_1:       "Sokaraja 1",
  kembaran_1:       "Kembaran 1",
};

export function KunjunganMultiLineChart({
  data,
}: {
  data: Record<string, string | number>[];
}) {
  const puskesmasKeys = Object.keys(PUSKESMAS_COLORS);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
        <YAxis {...axisProps} />
        <Tooltip
          {...tooltipStyle}
          formatter={(value: number, name: string) => [
            value,
            PUSKESMAS_LABELS[name] ?? name,
          ]}
        />
        {puskesmasKeys.map((pid) => (
          <Line
            key={pid}
            type="monotone"
            dataKey={pid}
            name={pid}
            stroke={PUSKESMAS_COLORS[pid]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
