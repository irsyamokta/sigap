import { FileText, Trash2 } from "lucide-react";
import type { NakesRequirementInput } from "@/types/workforce";

interface NakesUploadPreviewProps {
  data: NakesRequirementInput[];
  onReset: () => void;
}

export function NakesUploadPreview({ data, onReset }: NakesUploadPreviewProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-2.5 animate-in fade-in-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Pratinjau Data ({data.length} Jenis Nakes)
          </h3>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive hover:underline"
        >
          <Trash2 className="size-3" />
          Hapus File
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-background">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-muted text-muted-foreground font-semibold border-b border-border">
            <tr>
              <th className="px-3.5 py-2.5">No</th>
              <th className="px-3.5 py-2.5">Jenis Tenaga Kesehatan</th>
              <th className="px-3.5 py-2.5 text-right">Jumlah Kebutuhan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-medium">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-muted/40 transition-colors">
                <td className="px-3.5 py-2 text-muted-foreground">{idx + 1}</td>
                <td className="px-3.5 py-2 text-foreground font-medium">
                  {item.jenisNakes}
                </td>
                <td className="px-3.5 py-2 text-right font-semibold text-primary">
                  {item.kebutuhan}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
