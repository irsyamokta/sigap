import { lazy, Suspense, useEffect, useState } from "react";
import type { DashboardData } from "@/data/dashboard";
import { Loader2 } from "lucide-react";

// Lazy load the actual map component because leaflet requires 'window'
// which is not available during Server-Side Rendering (SSR).
const EwsMapClient = lazy(() =>
  import("./ews-map-client").then((mod) => ({ default: mod.EwsMap }))
);

export function EwsMap({ data }: { data: DashboardData }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return a skeleton/loader while SSR and before client hydration
  if (!mounted) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center rounded-xl border bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-[350px] w-full items-center justify-center rounded-xl border bg-muted/20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <EwsMapClient data={data} />
    </Suspense>
  );
}
