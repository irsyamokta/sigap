import { Users, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRatioBadge } from "./nakes-ratio-badge";
import type { NakesRatioItem } from "@/types/workforce";

const nf = new Intl.NumberFormat("id-ID");

interface NakesRatioTableBodyProps {
  paginatedItems: NakesRatioItem[];
  selectedIds: Set<string>;
  allPaginatedSelected: boolean;
  somePaginatedSelected: boolean;
  isDeleting: boolean;
  onToggleAll: () => void;
  onToggleItem: (id: string) => void;
  onDeleteRow: (item: NakesRatioItem) => void;
}

export function NakesRatioTableBody({
  paginatedItems,
  selectedIds,
  allPaginatedSelected,
  somePaginatedSelected,
  isDeleting,
  onToggleAll,
  onToggleItem,
  onDeleteRow,
}: NakesRatioTableBodyProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
          <tr>
            <th className="w-10 px-4 py-3 text-center">
              <Checkbox
                checked={
                  allPaginatedSelected
                    ? true
                    : somePaginatedSelected
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={onToggleAll}
                aria-label="Pilih semua baris pada halaman ini"
              />
            </th>
            <th className="px-4 py-3">Kecamatan</th>
            <th className="px-4 py-3">Fasilitas Kesehatan</th>
            <th className="px-4 py-3">Jenis Nakes</th>
            <th className="px-4 py-3 text-right">Jumlah Kebutuhan</th>
            <th className="px-4 py-3 text-right">Jumlah Penduduk</th>
            <th className="px-4 py-3 text-center">
              Ratio (per 1.000 Penduduk)
            </th>
            <th className="w-12 px-3 py-3 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 font-medium">
          {paginatedItems.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <tr
                key={item.id}
                className={cn(
                  "transition-colors hover:bg-muted/30",
                  isSelected &&
                    "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10",
                )}
              >
                <td className="px-4 py-3 text-center">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleItem(item.id)}
                    aria-label={`Pilih ${item.jenisNakes} ${item.namaKecamatan}`}
                  />
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">
                  {item.namaKecamatan}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.puskesmasNama}
                </td>
                <td className="px-4 py-3 font-semibold text-primary">
                  {item.jenisNakes}
                </td>
                <td className="px-4 py-3 text-right font-bold text-foreground">
                  {nf.format(item.kebutuhan)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3 text-muted-foreground" />
                    {nf.format(item.jumlahPenduduk)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {getRatioBadge(item.ratio)}
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => onDeleteRow(item)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                    title="Hapus baris ini dari database"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}

          {paginatedItems.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="py-12 text-center text-muted-foreground"
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Calculator className="size-8 text-muted-foreground/60" />
                  <p className="text-sm font-semibold">
                    Tidak ada data ditemukan
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
