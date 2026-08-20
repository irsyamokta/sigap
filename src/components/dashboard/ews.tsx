import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import {
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import type { DashboardData } from "@/data/dashboard";

// ─── EWS Alert Banner ────────────────────────────────────────────────────────

interface EwsAlertBannerProps {
  alerts: DashboardData["ewsAlerts"];
}

export function EwsAlertBanner({ alerts }: EwsAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!alerts.length || dismissed) return null;

  const hasSiaga = alerts.some((a) => a.status === "SIAGA");

  return (
    <div
      className={`relative mx-3 mt-3 sm:mx-6 rounded-xl border px-4 py-3 ${
        hasSiaga
          ? "border-red-300 bg-red-50 dark:border-red-700/60 dark:bg-red-950/40"
          : "border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/40"
      }`}
    >
      <div className="flex flex-wrap items-start gap-3">
        {/* Icon */}
        <div
          className={`mt-0.5 flex-shrink-0 ${
            hasSiaga ? "text-red-500" : "text-amber-500"
          }`}
        >
          {hasSiaga ? (
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          ) : (
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          <p
            className={`text-sm font-semibold ${
              hasSiaga ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"
            }`}
          >
            {hasSiaga ? "Peringatan SIAGA Aktif" : "Peringatan WASPADA Aktif"} —{" "}
            {alerts.length} penyakit terdeteksi
          </p>
          <div className="flex flex-wrap gap-2">
            {alerts.map((a) => (
              <span
                key={a.penyakit}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  a.status === "SIAGA"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    a.status === "SIAGA" ? "bg-red-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                {a.status} {a.penyakit}: {a.kasus} kasus (batas {a.threshold})
              </span>
            ))}
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className={`flex-shrink-0 rounded-lg p-1 transition-colors ${
            hasSiaga
              ? "text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
              : "text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
          }`}
          title="Tutup peringatan"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function EwsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const series = payload.filter((p: any) => !p.dataKey?.startsWith("threshold"));

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg text-xs">
      <p className="mb-2 font-semibold text-foreground">{label}</p>
      {series.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-bold text-foreground">{p.value} kasus</span>
        </div>
      ))}
    </div>
  );
}

// ─── EWS Trend Chart ─────────────────────────────────────────────────────────

interface EwsTrendChartProps {
  data: DashboardData["ewsTren"];
}

export function EwsTrendChart({ data }: EwsTrendChartProps) {
  // Find the threshold values (constant across all weeks scaled to puskesmas)
  const thresholdDbd   = data[0]?.thresholdDbd   ?? 75;
  const thresholdDiare = data[0]?.thresholdDiare ?? 110;
  const thresholdIspa  = data[0]?.thresholdIspa  ?? 160;

  // Max Y for domain
  const maxVal = Math.max(
    ...data.flatMap((d) => [d.dbd, d.diare, d.ispa]),
    thresholdIspa,
  );

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="minggu"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground fill-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="text-muted-foreground fill-muted-foreground"
          width={36}
          domain={[0, Math.ceil(maxVal * 1.12)]}
        />
        <Tooltip content={<EwsTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
        />

        {/* Danger zones above each threshold */}
        <ReferenceArea y1={thresholdDbd}   y2={Math.ceil(maxVal * 1.12)} fill="#ef44441a" />

        {/* Threshold reference lines */}
        <ReferenceLine
          y={thresholdDbd}
          stroke="#ef4444"
          strokeDasharray="5 3"
          strokeWidth={1.5}
          label={{ value: `Batas DBD: ${thresholdDbd}`, position: "insideTopRight", fontSize: 10, fill: "#ef4444" }}
        />
        <ReferenceLine
          y={thresholdDiare}
          stroke="#f97316"
          strokeDasharray="5 3"
          strokeWidth={1.5}
          label={{ value: `Batas Diare: ${thresholdDiare}`, position: "insideTopRight", fontSize: 10, fill: "#f97316" }}
        />
        <ReferenceLine
          y={thresholdIspa}
          stroke="#eab308"
          strokeDasharray="5 3"
          strokeWidth={1.5}
          label={{ value: `Batas ISPA: ${thresholdIspa}`, position: "insideTopRight", fontSize: 10, fill: "#eab308" }}
        />

        {/* Actual case lines */}
        <Line
          type="monotone"
          dataKey="dbd"
          name="DBD"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 3, fill: "#ef4444" }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="diare"
          name="Diare"
          stroke="#f97316"
          strokeWidth={2}
          dot={{ r: 3, fill: "#f97316" }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="ispa"
          name="ISPA"
          stroke="#eab308"
          strokeWidth={2}
          dot={{ r: 3, fill: "#eab308" }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
