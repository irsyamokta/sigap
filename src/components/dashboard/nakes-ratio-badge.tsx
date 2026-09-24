import { CheckCircle, AlertTriangle, Info } from "lucide-react";

export function getRatioBadge(ratio: number) {
  if (ratio < 0.5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
        <AlertTriangle className="size-3" />
        Kritis ({ratio.toLocaleString("id-ID", { minimumFractionDigits: 2 })})
      </span>
    );
  }
  if (ratio < 1.0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
        <Info className="size-3" />
        Sedang ({ratio.toLocaleString("id-ID", { minimumFractionDigits: 2 })})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      <CheckCircle className="size-3" />
      Baik ({ratio.toLocaleString("id-ID", { minimumFractionDigits: 2 })})
    </span>
  );
}
