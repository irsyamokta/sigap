interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, children, className = "" }: SectionProps) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] ${className}`}>
      <h2 className="mb-4 text-sm font-bold tracking-wide text-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Panel({ title, children, className = "" }: PanelProps) {
  return (
    <div className={`rounded-xl border border-border bg-background/60 p-4 ${className}`}>
      {title ? (
        <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      ) : null}
      {children}
    </div>
  );
}
