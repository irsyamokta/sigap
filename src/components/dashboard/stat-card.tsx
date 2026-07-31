interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

export function StatCard({ label, value, hint, icon: Icon, highlight = false }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-transparent text-primary-foreground [background:var(--gradient-primary)]"
          : "border-border bg-background/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-xs ${highlight ? "opacity-90" : "text-muted-foreground"}`}>{label}</p>
        <Icon className={`size-4 ${highlight ? "opacity-90" : "text-primary"}`} />
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className={`mt-1 text-[11px] ${highlight ? "opacity-80" : "text-muted-foreground"}`}>{hint}</p>
    </div>
  );
}
