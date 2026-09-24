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
