import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Alert Banner Skeleton */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* Section 1: Data Pasien */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-background/60 p-4"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-7 w-20" />
              <Skeleton className="mt-1 h-3 w-36" />
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: EWS */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-5 w-36 rounded-full" />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-background/60 p-4">
            <Skeleton className="mb-4 h-4 w-44" />
            <Skeleton className="h-[350px] w-full rounded-xl" />
            <div className="mt-3 flex items-center gap-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-4">
            <Skeleton className="mb-4 h-4 w-44" />
            <Skeleton className="h-[350px] w-full rounded-xl" />
          </div>
        </div>
      </section>

      {/* Section 3: Kunjungan Harian */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="mb-4">
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
      </section>

      {/* Section 4: Kapasitas Rawat Inap & Penyakit */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] lg:col-span-2">
          <Skeleton className="mb-3 h-4 w-56" />
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
          <Skeleton className="h-[260px] w-full rounded-xl" />
          <Skeleton className="mx-auto mt-2 h-3 w-64" />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <Skeleton className="mb-4 h-4 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Section 5: Data Tenaga Kesehatan */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <Skeleton className="mb-4 h-4 w-60" />
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">
          <div className="rounded-xl border border-border bg-background/60 p-4 lg:col-span-3 flex flex-col justify-between">
            <Skeleton className="mb-3 h-3 w-40" />
            <Skeleton className="h-[220px] w-full rounded-lg" />
          </div>

          <div className="lg:col-span-6 flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="w-full sm:w-[150px] shrink-0 flex flex-col justify-between gap-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card p-3 flex flex-col justify-center items-center flex-1"
                >
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-1 h-5 w-12" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-background/60 p-4 flex-1 min-w-0 flex flex-col justify-between">
              <Skeleton className="mb-3 h-3 w-48" />
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/60 p-4 lg:col-span-3 flex flex-col justify-between">
            <Skeleton className="mb-3 h-3 w-40" />
            <Skeleton className="mx-auto h-[180px] w-[180px] rounded-full" />
          </div>
        </div>

        {/* Tabel Rasio Nakes */}
        <div className="mt-5 border-t border-border/60 pt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-9 w-64 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/40 p-3 flex gap-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="divide-y divide-border p-3 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 pt-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Ringkasan AI */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <Skeleton className="mb-4 h-4 w-28" />
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-3 w-96" />
            </div>
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>
      </section>
    </div>
  );
}
