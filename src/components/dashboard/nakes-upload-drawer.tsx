import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { FileSpreadsheet, X, AlertCircle, Calendar } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { puskesmasList } from "@/data/dashboard";
import type { PuskesmasId } from "@/types/dashboard";
import type { NakesRequirementInput } from "@/types/workforce";
import { submitNakesRequirementFn } from "@/lib/api/workforce";
import { parseNakesExcelFile } from "@/lib/excel-parser";
import { NakesUploadPreview } from "./nakes-upload-preview";
import { FileDropZone } from "./file-drop-zone";

interface NakesUploadDrawerProps {
  userRole?: "DINKES" | "PUSKESMAS";
  selectedPuskesmasId?: PuskesmasId;
  onProcessUpload: () => void;
}

export function NakesUploadDrawer({
  userRole = "PUSKESMAS",
  selectedPuskesmasId = "purwokerto_barat",
  onProcessUpload,
}: NakesUploadDrawerProps) {
  const isDinkesRole = userRole === "DINKES";

  const [isOpen, setIsOpen] = useState(false);
  const [targetPuskesmasId, setTargetPuskesmasId] = useState<PuskesmasId>(
    selectedPuskesmasId === "all" ? "purwokerto_barat" : selectedPuskesmasId,
  );
  const [tanggalPengajuan, setTanggalPengajuan] = useState<string>(() =>
    new Date().toISOString().split("T")[0],
  );
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<NakesRequirementInput[] | null>(
    null,
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedPuskesmasId !== "all") {
      setTargetPuskesmasId(selectedPuskesmasId);
    }
  }, [selectedPuskesmasId]);

  if (isDinkesRole) return null;

  const activeTarget =
    selectedPuskesmasId === "all" ? "purwokerto_barat" : selectedPuskesmasId;

  const resetUploadState = () => {
    setFile(null);
    setParsedData(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeDrawer = () => {
    setIsOpen(false);
    resetUploadState();
  };

  const handleFileSelect = async (selectedFile: File) => {
    setValidationError(null);
    setParsedData(null);
    const validExtensions = [".xlsx", ".xls"];
    if (
      !validExtensions.some((ext) =>
        selectedFile.name.toLowerCase().endsWith(ext),
      )
    ) {
      setValidationError("File harus berformat Excel (.xlsx atau .xls).");
      setFile(null);
      return;
    }
    setFile(selectedFile);
    try {
      const rows = await parseNakesExcelFile(selectedFile);
      setParsedData(rows);
      setValidationError(null);
    } catch (err: unknown) {
      setValidationError(
        (err as Error).message || "Gagal memproses file Excel.",
      );
    }
  };

  const handleProcessSubmit = async () => {
    if (!parsedData || parsedData.length === 0) {
      toast.error("Tidak ada data valid untuk diproses");
      return;
    }
    setIsProcessing(true);
    try {
      await submitNakesRequirementFn({
        data: {
          targetPuskesmasCode: activeTarget,
          tanggalPengajuan: tanggalPengajuan,
          items: parsedData.map((row) => ({
            jenisNakes: row.jenisNakes,
            kebutuhan: Math.round(row.kebutuhan),
            tersedia: 0,
            puskesmasCode: row.puskesmasCode,
          })),
        },
      });
      const targetName =
        puskesmasList.find((p) => p.id === activeTarget)?.nama ?? activeTarget;
      toast.success(
        `Berhasil mengajukan kebutuhan nakes (${targetName}). Dashboard diperbarui.`,
      );
      onProcessUpload();
      closeDrawer();
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : String(err) || "Gagal menyimpan pengajuan";
      toast.error(`Gagal menyimpan: ${errMsg}`);
      setValidationError(`Gagal menyimpan: ${errMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      { "Jenis Nakes": "Dokter", "Jumlah Kebutuhan": 12 },
      { "Jenis Nakes": "Dr. Gigi", "Jumlah Kebutuhan": 4 },
      { "Jenis Nakes": "Perawat", "Jumlah Kebutuhan": 30 },
      { "Jenis Nakes": "Bidan", "Jumlah Kebutuhan": 18 },
      { "Jenis Nakes": "Farmasi", "Jumlah Kebutuhan": 5 },
      { "Jenis Nakes": "Kesmas", "Jumlah Kebutuhan": 6 },
      { "Jenis Nakes": "Kesling", "Jumlah Kebutuhan": 4 },
      { "Jenis Nakes": "Gizi", "Jumlah Kebutuhan": 4 },
      { "Jenis Nakes": "Teklabmed", "Jumlah Kebutuhan": 4 },
    ];
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kebutuhan Nakes");
    XLSX.writeFile(workbook, "Template_Kebutuhan_Nakes.xlsx");
    toast.info("Template Excel berhasil diunduh");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title="Upload Excel Kebutuhan Nakes"
        aria-label="Upload Excel Kebutuhan Nakes"
        className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center justify-center rounded-l-2xl border border-r-0 border-primary/30 bg-primary p-3.5 text-primary-foreground shadow-2xl transition-all duration-200 hover:pl-4.5 hover:brightness-110 active:scale-95 group"
      >
        <FileSpreadsheet className="size-5.5 transition-transform duration-200 group-hover:scale-110" />
      </button>

      {isOpen && (
        <div
          onClick={closeDrawer}
          className="fixed inset-0 z-50 bg-background/70 backdrop-blur-xs transition-opacity animate-in fade-in-50"
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-2xl transition-transform duration-300 ease-in-out sm:max-w-lg ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Upload Kebutuhan Nakes
              </h2>
              <p className="text-xs text-muted-foreground">
                Target:{" "}
                <strong className="text-foreground font-semibold">
                  {puskesmasList.find((p) => p.id === activeTarget)?.nama ??
                    activeTarget}
                </strong>
              </p>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 sm:p-5">
          <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5 text-muted-foreground" />
              Tanggal Pengajuan
            </label>
            <input
              type="date"
              value={tanggalPengajuan}
              onChange={(e) => setTanggalPengajuan(e.target.value)}
              className="h-9.5 w-full rounded-xl border border-input bg-card px-3 text-xs font-semibold shadow-xs transition-all outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <FileDropZone
            file={file}
            isDragging={isDragging}
            onDragOver={(e: DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e: DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.length)
                handleFileSelect(e.dataTransfer.files[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            inputRef={fileInputRef}
            onInputChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files?.length) handleFileSelect(e.target.files[0]);
            }}
            onDownloadTemplate={downloadSampleTemplate}
          />

          {validationError && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="whitespace-pre-line font-medium leading-relaxed">
                {validationError}
              </div>
            </div>
          )}

          <NakesUploadPreview
            data={parsedData || []}
            onReset={resetUploadState}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border p-4 sm:p-5 bg-card">
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleProcessSubmit}
            disabled={!parsedData || parsedData.length === 0 || isProcessing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:brightness-110 disabled:opacity-50"
          >
            {isProcessing ? "Memproses..." : "Upload & Proses"}
          </button>
        </div>
      </div>
    </>
  );
}
