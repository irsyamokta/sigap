import { Filter, Search, X, ListFilter, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NakesRatioToolbarProps {
  totalItems: number;
  selectedCount: number;
  pageSize: string;
  onPageSizeChange: (val: string) => void;
  selectedKecamatan: string;
  uniqueKecamatan: string[];
  onKecamatanChange: (val: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  isDeleting: boolean;
  onDeleteSelected: () => void;
  lastUpdated?: Date;
}

export function NakesRatioToolbar({
  totalItems,
  selectedCount,
  pageSize,
  onPageSizeChange,
  selectedKecamatan,
  uniqueKecamatan,
  onKecamatanChange,
  searchQuery,
  onSearchChange,
  isDeleting,
  onDeleteSelected,
  lastUpdated,
}: NakesRatioToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">
            Hasil Kalkulasi Ratio Nakes per 1.000 Penduduk
          </h3>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {totalItems} Data
          </span>
          {selectedCount > 0 && (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 animate-in fade-in-50">
              {selectedCount} Terpilih
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Rumus:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
            Ratio = (Kebutuhan Nakes / Jumlah Penduduk) × 1.000
          </code>
          {lastUpdated && (
            <span className="ml-2 font-medium">
              • Diperbarui:{" "}
              {lastUpdated.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {selectedCount > 0 && (
          <button
            type="button"
            disabled={isDeleting}
            onClick={onDeleteSelected}
            className="inline-flex items-center gap-1.5 h-9.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-3 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            Hapus Terpilih ({selectedCount})
          </button>
        )}

        <div className="w-36 shrink-0">
          <Select value={pageSize} onValueChange={onPageSizeChange}>
            <SelectTrigger className="h-9.5 w-full rounded-xl border border-input bg-card px-3 text-xs font-semibold shadow-xs transition-all hover:bg-accent/30 focus:ring-2 focus:ring-primary/30">
              <div className="flex items-center gap-1.5 truncate">
                <ListFilter className="size-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Tampilkan" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Tampilkan 5</SelectItem>
              <SelectItem value="10">Tampilkan 10</SelectItem>
              <SelectItem value="25">Tampilkan 25</SelectItem>
              <SelectItem value="50">Tampilkan 50</SelectItem>
              <SelectItem value="all">Tampilkan Semua</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-48 shrink-0">
          <Select value={selectedKecamatan} onValueChange={onKecamatanChange}>
            <SelectTrigger className="h-9.5 w-full rounded-xl border border-input bg-card px-3 text-xs font-semibold shadow-xs transition-all hover:bg-accent/30 focus:ring-2 focus:ring-primary/30">
              <div className="flex items-center gap-2 truncate">
                <Filter className="size-3.5 text-muted-foreground shrink-0" />
                <SelectValue
                  placeholder="Pilih Kecamatan"
                  className="truncate"
                />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kecamatan</SelectItem>
              {uniqueKecamatan.map((kec) => (
                <SelectItem key={kec} value={kec}>
                  {kec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex items-center h-9.5 w-full sm:w-56 min-w-[170px] rounded-xl border border-input bg-card px-3 text-xs font-semibold shadow-xs transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 hover:bg-accent/30">
          <Search className="size-3.5 text-muted-foreground shrink-0 mr-2" />
          <input
            type="text"
            placeholder="Cari jenis nakes / kecamatan..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-foreground placeholder:text-muted-foreground placeholder:font-normal outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded-md shrink-0 ml-1 cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
