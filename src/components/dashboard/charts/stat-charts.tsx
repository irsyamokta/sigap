import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from "recharts";

const axisProps = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
  tick: { fill: "var(--color-muted-foreground)", fontSize: 11 },
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

interface KapasitasTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { singkat: string; isRawatInap: boolean } }[];
  label?: string;
}

function KapasitasTooltip({ active, payload, label }: KapasitasTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const isActive = entry.payload.isRawatInap && entry.value > 0;
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-md text-xs space-y-1 min-w-[160px]">
      <p className="font-semibold text-foreground border-b border-border/50 pb-1">{label}</p>
      <p className={isActive ? "text-primary font-medium" : "text-muted-foreground"}>
        Kapasitas Rawat Inap :{" "}
        <span className="font-bold">
          {isActive ? `${entry.value} Tempat Tidur (TT)` : "0 TT (Non-Rawat Inap)"}
        </span>
      </p>
    </div>
  );
}

export function KapasitasBarChart({
  data,
  height = 260,
}: {
  data: { singkat: string; kapasitas: number; isRawatInap: boolean }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 25, right: 15, left: -15, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="singkat"
          {...axisProps}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
        />
        <YAxis
          {...axisProps}
          allowDecimals={false}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
        />
        <Tooltip content={<KapasitasTooltip />} cursor={{ fill: "var(--color-accent)" }} />
        <Bar dataKey="kapasitas" name="Kapasitas Bed (TT)" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.isRawatInap && entry.kapasitas > 0
                  ? "var(--color-primary)"
                  : "var(--color-muted)"
              }
              opacity={entry.isRawatInap && entry.kapasitas > 0 ? 0.9 : 1}
            />
          ))}
          <LabelList
            dataKey="kapasitas"
            position="top"
            content={({ x, y, width, value, index }) => {
              if (index === undefined || !data[index]) return null;
              const entry = data[index];
              const isActive = entry.isRawatInap && entry.kapasitas > 0;
              const label = value && Number(value) > 0 ? `${value} TT` : "Non-RI";
              return (
                <text
                  x={Number(x) + Number(width) / 2}
                  y={Number(y) - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill={
                    isActive
                      ? "var(--color-foreground)"
                      : "var(--color-muted-foreground)"
                  }
                >
                  {label}
                </text>
              );
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}


export function PerbandinganChart({
  data,
  height = 280,
}: {
  data: { bulan: string; pasien: number; kapasitas: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="gradPasien" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-primary)"
              stopOpacity={0.4}
            />
            <stop
              offset="95%"
              stopColor="var(--color-primary)"
              stopOpacity={0.0}
            />
          </linearGradient>
          <linearGradient id="gradKapasitas" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-chart-4)"
              stopOpacity={0.25}
            />
            <stop
              offset="95%"
              stopColor="var(--color-chart-4)"
              stopOpacity={0.0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis dataKey="bulan" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Area
          type="monotone"
          dataKey="pasien"
          name="Rerata Pasien/Hari"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          fill="url(#gradPasien)"
        />
        <Area
          type="monotone"
          dataKey="kapasitas"
          name="Kapasitas Bed"
          stroke="var(--color-chart-4)"
          strokeWidth={2}
          strokeDasharray="4 4"
          fill="url(#gradKapasitas)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function KunjunganHarianChart({
  data,
}: {
  data: { label: string; total: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip
          {...tooltipStyle}
          formatter={(value: number | string) => [
            `${value} kunjungan`,
            "Total Kunjungan",
          ]}
        />
        <Line
          type="monotone"
          dataKey="total"
          name="Total Kunjungan"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--color-primary)" }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
