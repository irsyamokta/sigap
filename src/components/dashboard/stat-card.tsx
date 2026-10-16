interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={`flex h-full flex-col justify-between rounded-xl border p-4 transition-all duration-200 ${
        highlight
          ? "border-transparent text-primary-foreground [background:var(--gradient-primary)]"
          : "border-border bg-background/60"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-xs leading-snug ${highlight ? "opacity-90" : "text-muted-foreground"}`}
          >
            {label}
          </p>
          <Icon
            className={`size-4 shrink-0 mt-0.5 ${highlight ? "opacity-90" : "text-primary"}`}
          />
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight leading-tight">{value}</p>
      </div>
      <p
        className={`mt-2 text-[11px] leading-snug ${highlight ? "opacity-80" : "text-muted-foreground"}`}
      >
        {hint}
      </p>
    </div>
  );
}
