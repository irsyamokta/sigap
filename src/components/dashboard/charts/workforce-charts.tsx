import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const axisProps = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "var(--color-card)",
    borderColor: "var(--color-border)",
    borderRadius: "0.5rem",
    boxShadow: "var(--shadow-soft)",
    fontSize: "12px",
    color: "var(--color-foreground)",
  },
};

const NAKES_SHORT_LABELS: Record<string, string> = {
  Dokter: "Dokter",
  "Dokter Umum": "Dr. Umum",
  "Dokter Gigi": "Dr. Gigi",
  Perawat: "Perawat",
  Bidan: "Bidan",
  Farmasi: "Farmasi",
  "Tenaga Kefarmasian": "Farmasi",
  Apoteker: "Farmasi",
  Kesmas: "Kesmas",
  "Tenaga Kesehatan Masyarakat": "Kesmas",
  Kesling: "Kesling",
  "Tenaga Kesehatan Lingkungan": "Kesling",
  Sanitarian: "Kesling",
  Gizi: "Gizi",
  "Tenaga Gizi": "Gizi",
  Nutrisionis: "Gizi",
  Teklabmed: "Teklabmed",
  "Ahli Teknologi Laboratorium Medik": "ATLM",
};

export function TenagaBarChart({
  data,
}: {
  data: { nama: string; jumlah: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 10, left: -20, bottom: 45 }}
      >
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="nama"
          {...axisProps}
          interval={0}
          angle={-30}
          textAnchor="end"
          tickFormatter={(name) => NAKES_SHORT_LABELS[name] ?? name}
        />
        <YAxis {...axisProps} />
        <Tooltip
          {...tooltipStyle}
          cursor={{ fill: "var(--color-accent)" }}
          formatter={(
            value: number | string,
            name: string,
            item: { payload?: { nama?: string } },
          ) => [`${value} orang`, item?.payload?.nama ?? name]}
        />
        <Bar
          dataKey="jumlah"
          name="Tersedia"
          fill="var(--color-primary)"
          radius={[4, 4, 0, 0]}
          barSize={18}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
interface StandarTenagaPayloadItem {
  dataKey: string;
  name: string;
  value: number;
  payload?: {
    nama?: string;
  };
}

interface StandarTenagaTooltipProps {
  active?: boolean;
  payload?: StandarTenagaPayloadItem[];
  label?: string;
}

function StandarTenagaTooltip({
  active,
  payload,
  label,
}: StandarTenagaTooltipProps) {
  if (!active || !payload?.length) return null;

  const profName = payload[0]?.payload?.nama ?? label;

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-md text-xs space-y-1.5 min-w-[190px]">
      <p className="font-semibold text-foreground border-b border-border/50 pb-1">
        {profName}
      </p>
      {payload.map((entry) => {
        const isTersedia = entry.dataKey === "tersedia";
        const dotColor = isTersedia
          ? "var(--color-primary)"
          : "var(--color-muted-foreground)";
        const textColor = isTersedia
          ? "text-primary"
          : "text-foreground font-semibold";

        return (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: dotColor }}
              />
              <span className="text-muted-foreground font-medium">
                {entry.name}
              </span>
            </div>
            <span className={textColor}>{entry.value} orang</span>
          </div>
        );
      })}
    </div>
  );
}

export function StandarTenagaChart({
  data,
}: {
  data: { nama: string; tersedia: number; kebutuhan: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 12, left: 16, bottom: 0 }}
        barGap={2}
      >
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="var(--color-border)"
          horizontal={false}
        />
        <XAxis type="number" {...axisProps} />
        <YAxis
          type="category"
          dataKey="nama"
          width={80}
          {...axisProps}
          interval={0}
          tickFormatter={(name) => NAKES_SHORT_LABELS[name] ?? name}
          fontSize={11}
        />
        <Tooltip
          content={<StandarTenagaTooltip />}
          cursor={{ fill: "var(--color-accent)" }}
        />
        <Bar
          dataKey="tersedia"
          name="Tersedia"
          fill="var(--color-primary)"
          radius={[0, 4, 4, 0]}
          barSize={8}
        />
        <Bar
          dataKey="kebutuhan"
          name="Kebutuhan"
          fill="var(--color-muted)"
          radius={[0, 4, 4, 0]}
          barSize={8}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RasioDonut({
  value,
  totalTenaga,
  totalKebutuhan,
  keterangan,
}: {
  value: number;
  totalTenaga?: number;
  totalKebutuhan?: number;
  keterangan?: string;
}) {
  const percentage = Math.min(100, Math.max(0, value));
  const pieData = [
    { name: "Tercapai", value: percentage },
    { name: "Sisa", value: Math.max(0, 100 - percentage) },
  ];

  const defisit =
    totalKebutuhan && totalTenaga
      ? Math.max(0, totalKebutuhan - totalTenaga)
      : 0;

  return (
    <div className="flex h-full flex-col justify-between pt-1 pb-2">
      {/* Donut Chart */}
      <div className="relative flex h-[195px] w-full items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={78}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="var(--color-primary)" />
              <Cell fill="var(--color-muted)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-foreground">
            {value}%
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            Kecukupan
          </span>
        </div>
      </div>

      {/* Information Cards underneath */}
      <div className="mt-3 space-y-2.5">
        {/* Legend / Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-accent/40 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
              <span className="text-muted-foreground font-medium">
                Tersedia
              </span>
            </div>
            <span className="font-bold text-foreground">
              {totalTenaga ?? 0}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-accent/40 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-muted)]" />
              <span className="text-muted-foreground font-medium">Target</span>
            </div>
            <span className="font-bold text-foreground">
              {totalKebutuhan ?? 0}
            </span>
          </div>
        </div>

        {/* Status Callout */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs">
          <div className="flex items-center justify-between font-semibold text-amber-700 dark:text-amber-400">
            <span>Status Kecukupan</span>
            <span>
              {defisit > 0 ? `Defisit ${defisit} Nakes` : "Terpenuhi"}
            </span>
          </div>
          {keterangan && (
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              {keterangan}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
