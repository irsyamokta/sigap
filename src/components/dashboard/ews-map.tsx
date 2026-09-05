import { lazy, Suspense, useEffect, useState } from "react";
import type { DashboardData } from "@/data/dashboard";
import { Loader2 } from "lucide-react";

const EwsMapClient = lazy(() =>
  import("./ews-map-client").then((mod) => ({ default: mod.EwsMap }))
);

export function EwsMapLegend() {
  return (
    <div className="mt-3 rounded-lg border border-border/80 bg-muted/40 p-3">
      <p className="mb-2 text-xs font-semibold text-foreground">Legenda Status Wilayah (EWS):</p>
      <div className="grid gap-2.5 text-xs sm:grid-cols-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-[#22c55e] ring-2 ring-green-500/20 shadow-xs" />
          <div>
            <span className="font-semibold text-green-700 dark:text-green-400">Hijau (Normal)</span>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Semua indikator penyakit aman dan di bawah batas waspada
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-[#eab308] ring-2 ring-yellow-500/20 shadow-xs" />
          <div>
            <span className="font-semibold text-yellow-700 dark:text-yellow-400">Kuning (Waspada)</span>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Kasus meningkat mendekati ambang batas (&gt;85% batas siaga)
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-[#ef4444] ring-2 ring-red-500/20 shadow-xs" />
          <div>
            <span className="font-semibold text-red-700 dark:text-red-400">Merah (Siaga)</span>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Kasus melebihi batas siaga, berpotensi terjadi Kejadian Luar Biasa (KLB)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EwsMap({ data }: { data: DashboardData }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div>
      {!mounted ? (
        <div className="flex h-[350px] w-full items-center justify-center rounded-xl border bg-muted/20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="flex h-[350px] w-full items-center justify-center rounded-xl border bg-muted/20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <EwsMapClient data={data} />
        </Suspense>
      )}
      <EwsMapLegend />
    </div>
  );
}
