import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
          <p className="text-sm font-semibold text-foreground">
            Buat Laporan Evaluasi Tenaga Kesehatan & Action Plan ({puskesmasNama})
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            AI akan menyajikan tabel evaluasi kecukupan tenaga kesehatan dan rekomendasi action plan yang mudah dipahami.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-primary-foreground [background:var(--gradient-primary)] disabled:opacity-60 cursor-pointer shadow-xs transition-all hover:opacity-90"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {loading ? "Membuat Ringkasan..." : "Generate Summary"}
        </button>
      </div>

      {summaryError && (
        <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
          {summaryError}
        </p>
      )}

      {summary && (
        <div className="mt-4 rounded-2xl border border-border bg-card/80 p-5 transition-all duration-300 animate-in fade-in-50 shadow-xs">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-3 text-sm font-bold text-foreground">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mt-5 mb-3 text-xs font-bold uppercase tracking-wider text-primary border-b border-border/40 pb-1.5 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-3 mb-2 text-xs font-bold text-foreground">
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
              table: ({ children }) => (
                <div className="my-3 overflow-x-auto rounded-xl border border-border bg-background/50 shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="border-b border-border bg-muted/60 text-muted-foreground font-semibold">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-border/50 font-medium">
                  {children}
                </tbody>
              ),
              tr: ({ children }) => (
                <tr className="transition-colors hover:bg-muted/30">
                  {children}
                </tr>
              ),
              th: ({ children }) => (
                <th className="px-3.5 py-2.5 text-xs font-semibold text-foreground whitespace-nowrap">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-3.5 py-2.5 text-xs text-foreground/90">
                  {children}
                </td>
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
