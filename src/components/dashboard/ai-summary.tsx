import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface AiSummaryProps {
  puskesmasNama: string;
  periodeLabel: string;
  onGenerate: () => Promise<{ text?: string; error?: string }>;
}

export function AiSummary({
  puskesmasNama,
  periodeLabel,
  onGenerate,
}: AiSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setSummaryError(null);
    setSummary(null);
    try {
      const res = await onGenerate();
      if (res.error) setSummaryError(res.error);
      else setSummary(res.text ?? null);
    } catch {
      setSummaryError("Terjadi kesalahan saat membuat ringkasan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="text-sm text-foreground">
            Buat ringkasan eksekutif otomatis dari data {puskesmasNama} periode{" "}
            {periodeLabel}.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            AI akan menganalisis tren pasien, penyakit terbanyak, dan kecukupan
            tenaga kesehatan.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-primary-foreground [background:var(--gradient-primary)] disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {loading ? "Membuat ringkasan..." : "Generate Summary"}
        </button>
      </div>

      {summaryError && (
        <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
          {summaryError}
        </p>
      )}

      {summary && (
        <div className="mt-4 rounded-xl border border-border bg-background/60 p-4 transition-all duration-300 animate-in fade-in-50">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="mb-3 text-sm font-bold text-foreground">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mt-4 mb-2 text-xs font-bold uppercase tracking-wider text-primary border-b border-border/40 pb-1 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-2 mb-1 text-xs font-semibold text-foreground">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-2 text-xs leading-relaxed text-foreground/90 last:mb-0">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="mb-3 space-y-1.5 pl-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-3 space-y-1.5 pl-4 list-decimal text-xs">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-xs leading-relaxed text-foreground/90 list-disc ml-4">
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-muted-foreground">{children}</em>
              ),
            }}
          >
            {summary}
          </ReactMarkdown>
        </div>
      )}
    </>
  );
}
