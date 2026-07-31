import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

interface AiSummaryProps {
  puskesmasNama: string;
  periodeLabel: string;
  onGenerate: () => Promise<{ text?: string; error?: string }>;
}

export function AiSummary({ puskesmasNama, periodeLabel, onGenerate }: AiSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayedSummary, setDisplayedSummary] = useState<string>("");

  // Typewriter effect
  useEffect(() => {
    if (!summary) {
      setDisplayedSummary("");
      return;
    }
    setDisplayedSummary("");
    let i = 0;
    const interval = setInterval(() => {
      i += 4;
      setDisplayedSummary(summary.slice(0, i));
      if (i >= summary.length) {
        setDisplayedSummary(summary);
        clearInterval(interval);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [summary]);

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
            Buat ringkasan eksekutif otomatis dari data {puskesmasNama} periode {periodeLabel}.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            AI akan menganalisis tren pasien, penyakit terbanyak, dan kecukupan tenaga kesehatan.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-primary-foreground [background:var(--gradient-primary)] disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "Membuat ringkasan..." : "Generate Summary"}
        </button>
      </div>

      {summaryError && (
        <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
          {summaryError}
        </p>
      )}

      {summary && (
        <div className="mt-4 rounded-xl border border-border bg-background/60 p-4">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="mb-2 text-sm font-bold text-foreground">{children}</h1>,
              h2: ({ children }) => <h2 className="mb-2 text-sm font-semibold text-foreground">{children}</h2>,
              h3: ({ children }) => <h3 className="mb-1 text-xs font-semibold text-foreground">{children}</h3>,
              p: ({ children }) => <p className="mb-2 text-xs leading-relaxed text-foreground last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 space-y-1 pl-4">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 space-y-1 pl-4 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="text-xs leading-relaxed text-foreground list-disc">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
            }}
          >
            {displayedSummary}
          </ReactMarkdown>
        </div>
      )}
    </>
  );
}
