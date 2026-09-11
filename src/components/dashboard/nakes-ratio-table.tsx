import { useMemo, useState, useEffect } from "react";
import {
  Users,
  Filter,
  Calculator,
  Info,
  CheckCircle,
  AlertTriangle,
  Search,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ListFilter,
} from "lucide-react";
import { toast } from "sonner";
import type { NakesRatioItem } from "@/lib/api/population";
import { deleteNakesItemsFn } from "@/lib/api/workforce";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NakesRatioTableProps {
  items: NakesRatioItem[];
  lastUpdated?: Date;
  onReset?: () => void;
  onDeleteItems?: (itemsToDelete: NakesRatioItem[]) => Promise<void>;
}

export function NakesRatioTable({ items, lastUpdated, onDeleteItems }: NakesRatioTableProps) {
  const [localItems, setLocalItems] = useState<NakesRatioItem[]>(items);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination State (Default 10 items per page)
  const [pageSize, setPageSize] = useState<string>("10");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const nf = new Intl.NumberFormat("id-ID");

  // Keep localItems synced when items prop updates
  useEffect(() => {
    setLocalItems(items);
    setSelectedIds(new Set());
  }, [items]);

  // Reset to page 1 when filter, search, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedKecamatan, searchQuery, pageSize]);

  const uniqueKecamatan = useMemo(() => {
    const set = new Set<string>();
    localItems.forEach((item) => set.add(item.namaKecamatan));
    return Array.from(set);
  }, [localItems]);

  const filteredItems = useMemo(() => {
    return localItems.filter((item) => {
      const matchKec = selectedKecamatan === "all" || item.namaKecamatan === selectedKecamatan;
      const matchQuery =
        !searchQuery ||
        item.jenisNakes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.namaKecamatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.puskesmasNama.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKec && matchQuery;
    });
  }, [localItems, selectedKecamatan, searchQuery]);

  // Pagination calculation
  const totalItems = filteredItems.length;
  const numericPageSize = pageSize === "all" ? totalItems : Math.max(1, Number(pageSize));
  const totalPages = pageSize === "all" ? 1 : Math.ceil(totalItems / numericPageSize);

  const paginatedItems = useMemo(() => {
    if (pageSize === "all") return filteredItems;
    const start = (currentPage - 1) * numericPageSize;
    return filteredItems.slice(start, start + numericPageSize);
  }, [filteredItems, currentPage, pageSize, numericPageSize]);

  // Checkbox helpers for current paginated view
  const allPaginatedSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((item) => selectedIds.has(item.id));

  const somePaginatedSelected =
    paginatedItems.some((item) => selectedIds.has(item.id)) && !allPaginatedSelected;

  const toggleSelectAll = () => {
    if (allPaginatedSelected) {
      const next = new Set(selectedIds);
      paginatedItems.forEach((item) => next.delete(item.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginatedItems.forEach((item) => next.add(item.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Delete Handlers with Database Synchronization
  const handleDeleteSelected = async () => {
    const selectedItems = localItems.filter((item) => selectedIds.has(item.id));
    const count = selectedItems.length;
    if (count === 0) return;

    setIsDeleting(true);
    // Instant UI feedback
    setLocalItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
    setConfirmDialogOpen(false);

    try {
      if (onDeleteItems) {
        await onDeleteItems(selectedItems);
      } else {
        const itemIds = selectedItems.map((i) => i.submissionItemId || i.id).filter(Boolean);
        const targets = selectedItems
          .filter((i) => i.puskesmasCode && i.jenisNakes)
          .map((i) => ({ puskesmasCode: i.puskesmasCode!, jenisNakes: i.jenisNakes }));

        await deleteNakesItemsFn({ data: { itemIds, targets } });
      }
      toast.success(`Berhasil menghapus ${count} data terpilih dari database`);
    } catch (err: any) {
      toast.error(`Gagal menghapus data dari database: ${err?.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteRow = async (item: NakesRatioItem) => {
    setIsDeleting(true);
    setLocalItems((prev) => prev.filter((i) => i.id !== item.id));
    const next = new Set(selectedIds);
    next.delete(item.id);
    setSelectedIds(next);

    try {
      if (onDeleteItems) {
        await onDeleteItems([item]);
      } else {
        const itemIds = item.submissionItemId ? [item.submissionItemId] : [item.id];
        const targets =
          item.puskesmasCode && item.jenisNakes
            ? [{ puskesmasCode: item.puskesmasCode, jenisNakes: item.jenisNakes }]
            : [];
        await deleteNakesItemsFn({ data: { itemIds, targets } });
      }
      toast.success(`Data ${item.jenisNakes} (${item.namaKecamatan}) dihapus dari database`);
    } catch (err: any) {
      toast.error(`Gagal menghapus data: ${err?.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRatioBadge = (ratio: number) => {
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
  };

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Calculator className="size-6" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-foreground">Belum Ada Pengajuan Kebutuhan Nakes</h3>
        <p className="mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
          Belum ada usulan kebutuhan nakes yang diajukan oleh Puskesmas. Klik tombol <strong>ikon Excel</strong> di sisi kanan layar untuk melakukan pengajuan usulan kebutuhan nakes via Excel.
        </p>
      </div>
    );
  }

  const startItemIndex = totalItems === 0 ? 0 : pageSize === "all" ? 1 : (currentPage - 1) * numericPageSize + 1;
  const endItemIndex = pageSize === "all" ? totalItems : Math.min(currentPage * numericPageSize, totalItems);

  return (
    <div className="space-y-4">
      {/* Header Info & Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Hasil Kalkulasi Ratio Nakes per 1.000 Penduduk</h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {totalItems} Data
            </span>
            {selectedIds.size > 0 && (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 animate-in fade-in-50">
                {selectedIds.size} Terpilih
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rumus: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">Ratio = (Kebutuhan Nakes / Jumlah Penduduk) × 1.000</code>
            {lastUpdated && (
              <span className="ml-2 font-medium">
                • Diperbarui: {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>

        {/* Filter Controls & Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hapus Terpilih Button */}
          {selectedIds.size > 0 && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setConfirmDialogOpen(true)}
              className="inline-flex items-center gap-1.5 h-9.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-3 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
              Hapus Terpilih ({selectedIds.size})
            </button>
          )}

          {/* Page Size Select */}
          <div className="w-36 shrink-0">
            <Select value={pageSize} onValueChange={setPageSize}>
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

          {/* Select Kecamatan Filter */}
          <div className="w-full sm:w-48 shrink-0">
            <Select value={selectedKecamatan} onValueChange={setSelectedKecamatan}>
              <SelectTrigger className="h-9.5 w-full rounded-xl border border-input bg-card px-3 text-xs font-semibold shadow-xs transition-all hover:bg-accent/30 focus:ring-2 focus:ring-primary/30">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="size-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Pilih Kecamatan" className="truncate" />
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

          {/* Search Input */}
          <div className="relative flex items-center h-9.5 w-full sm:w-56 min-w-[170px] rounded-xl border border-input bg-card px-3 text-xs font-semibold shadow-xs transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 hover:bg-accent/30">
            <Search className="size-3.5 text-muted-foreground shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Cari jenis nakes / kecamatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-foreground placeholder:text-muted-foreground placeholder:font-normal outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded-md shrink-0 ml-1 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Ratio Results Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
            <tr>
              <th className="w-10 px-4 py-3 text-center">
                <Checkbox
                  checked={allPaginatedSelected ? true : somePaginatedSelected ? "indeterminate" : false}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Pilih semua baris pada halaman ini"
                />
              </th>
              <th className="px-4 py-3">Kecamatan</th>
              <th className="px-4 py-3">Fasilitas Kesehatan</th>
              <th className="px-4 py-3">Jenis Nakes</th>
              <th className="px-4 py-3 text-right">Jumlah Kebutuhan</th>
              <th className="px-4 py-3 text-right">Jumlah Penduduk</th>
              <th className="px-4 py-3 text-center">Ratio (per 1.000 Penduduk)</th>
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
                    isSelected && "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10"
                  )}
                >
                  <td className="px-4 py-3 text-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectItem(item.id)}
                      aria-label={`Pilih ${item.jenisNakes} ${item.namaKecamatan}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{item.namaKecamatan}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.puskesmasNama}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{item.jenisNakes}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">
                    {nf.format(item.kebutuhan)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3 text-muted-foreground" />
                      {nf.format(item.jumlahPenduduk)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{getRatioBadge(item.ratio)}</td>
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDeleteRow(item)}
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
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Calculator className="size-8 text-muted-foreground/60" />
                    <p className="text-sm font-semibold">Tidak ada data ditemukan</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 px-1">
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
            <span>
              Menampilkan{" "}
              <strong className="font-semibold text-foreground">{startItemIndex}</strong> –{" "}
              <strong className="font-semibold text-foreground">{endItemIndex}</strong> dari{" "}
              <strong className="font-semibold text-foreground">{totalItems}</strong> data
            </span>
          </div>

          {pageSize !== "all" && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="inline-flex items-center justify-center size-8 rounded-xl border border-input bg-card text-foreground hover:bg-accent/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Halaman sebelumnya"
              >
                <ChevronLeft className="size-4" />
              </button>

              <span className="px-2 text-xs font-semibold text-foreground">
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="inline-flex items-center justify-center size-8 rounded-xl border border-input bg-card text-foreground hover:bg-accent/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Halaman berikutnya"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Alert Dialog - Pops up cleanly in center */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="size-5" />
              Hapus Data Terpilih?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Apakah Anda yakin ingin menghapus {selectedIds.size} data terpilih dari database? Data yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl text-xs font-semibold cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold cursor-pointer"
            >
              Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
