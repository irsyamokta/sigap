import { useMemo, useState, useEffect } from "react";
import { Calculator, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { NakesRatioItem } from "@/types/workforce";
import { deleteNakesItemsFn } from "@/lib/api/workforce";
import { NakesRatioToolbar } from "./nakes-ratio-toolbar";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { NakesRatioTableBody } from "./nakes-ratio-table-body";

interface NakesRatioTableProps {
  items: NakesRatioItem[];
  lastUpdated?: Date;
  onReset?: () => void;
  onDeleteItems?: (itemsToDelete: NakesRatioItem[]) => Promise<void>;
}

export function NakesRatioTable({
  items,
  lastUpdated,
  onDeleteItems,
}: NakesRatioTableProps) {
  const [localItems, setLocalItems] = useState<NakesRatioItem[]>(items);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pageSize, setPageSize] = useState<string>("10");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    setLocalItems(items);
    setSelectedIds(new Set());
  }, [items]);

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
      const matchKec =
        selectedKecamatan === "all" || item.namaKecamatan === selectedKecamatan;
      const matchQuery =
        !searchQuery ||
        item.jenisNakes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.namaKecamatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.puskesmasNama.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKec && matchQuery;
    });
  }, [localItems, selectedKecamatan, searchQuery]);

  const totalItems = filteredItems.length;
  const numericPageSize =
    pageSize === "all" ? totalItems : Math.max(1, Number(pageSize));
  const totalPages =
    pageSize === "all" ? 1 : Math.ceil(totalItems / numericPageSize);

  const paginatedItems = useMemo(() => {
    if (pageSize === "all") return filteredItems;
    const start = (currentPage - 1) * numericPageSize;
    return filteredItems.slice(start, start + numericPageSize);
  }, [filteredItems, currentPage, pageSize, numericPageSize]);

  const allPaginatedSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((item) => selectedIds.has(item.id));
  const somePaginatedSelected =
    paginatedItems.some((item) => selectedIds.has(item.id)) &&
    !allPaginatedSelected;

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allPaginatedSelected) {
      paginatedItems.forEach((item) => next.delete(item.id));
    } else {
      paginatedItems.forEach((item) => next.add(item.id));
    }
    setSelectedIds(next);
  };

  const toggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const performDelete = async (selectedItems: NakesRatioItem[]) => {
    if (onDeleteItems) {
      await onDeleteItems(selectedItems);
      return;
    }
    const itemIds = selectedItems
      .map((i) => i.submissionItemId || i.id)
      .filter(Boolean);
    const targets = selectedItems
      .filter((i) => i.puskesmasCode && i.jenisNakes)
      .map((i) => ({
        puskesmasCode: i.puskesmasCode!,
        jenisNakes: i.jenisNakes,
      }));
    await deleteNakesItemsFn({ data: { itemIds, targets } });
  };

  const handleDeleteSelected = async () => {
    const selectedItems = localItems.filter((item) => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    setLocalItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
    setConfirmDialogOpen(false);
    try {
      await performDelete(selectedItems);
      toast.success(
        `Berhasil menghapus ${selectedItems.length} data terpilih dari database`,
      );
    } catch (err: unknown) {
      toast.error(
        `Gagal menghapus data dari database: ${(err as Error)?.message || String(err)}`,
      );
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
      await performDelete([item]);
      toast.success(
        `Data ${item.jenisNakes} (${item.namaKecamatan}) dihapus dari database`,
      );
    } catch (err: unknown) {
      toast.error(
        `Gagal menghapus data: ${(err as Error)?.message || String(err)}`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Calculator className="size-6" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-foreground">
          Belum Ada Pengajuan Kebutuhan Nakes
        </h3>
        <p className="mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
          Belum ada usulan kebutuhan nakes yang diajukan oleh Puskesmas. Klik
          tombol <strong>ikon Excel</strong> di sisi kanan layar untuk melakukan
          pengajuan usulan kebutuhan nakes via Excel.
        </p>
      </div>
    );
  }

  const startItemIndex =
    totalItems === 0
      ? 0
      : pageSize === "all"
        ? 1
        : (currentPage - 1) * numericPageSize + 1;
  const endItemIndex =
    pageSize === "all"
      ? totalItems
      : Math.min(currentPage * numericPageSize, totalItems);

  return (
    <div className="space-y-4">
      <NakesRatioToolbar
        totalItems={totalItems}
        selectedCount={selectedIds.size}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        selectedKecamatan={selectedKecamatan}
        uniqueKecamatan={uniqueKecamatan}
        onKecamatanChange={setSelectedKecamatan}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isDeleting={isDeleting}
        onDeleteSelected={() => setConfirmDialogOpen(true)}
        lastUpdated={lastUpdated}
      />

      <NakesRatioTableBody
        paginatedItems={paginatedItems}
        selectedIds={selectedIds}
        allPaginatedSelected={allPaginatedSelected}
        somePaginatedSelected={somePaginatedSelected}
        isDeleting={isDeleting}
        onToggleAll={toggleSelectAll}
        onToggleItem={toggleSelectItem}
        onDeleteRow={handleDeleteRow}
      />

      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 px-1">
          <span className="text-xs text-muted-foreground font-medium">
            Menampilkan{" "}
            <strong className="font-semibold text-foreground">
              {startItemIndex}
            </strong>{" "}
            –{" "}
            <strong className="font-semibold text-foreground">
              {endItemIndex}
            </strong>{" "}
            dari{" "}
            <strong className="font-semibold text-foreground">
              {totalItems}
            </strong>{" "}
            data
          </span>

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
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                className="inline-flex items-center justify-center size-8 rounded-xl border border-input bg-card text-foreground hover:bg-accent/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Halaman berikutnya"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <DeleteConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        selectedCount={selectedIds.size}
        onConfirm={handleDeleteSelected}
      />
    </div>
  );
}
