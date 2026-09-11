import { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import {
  FileSpreadsheet,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Trash2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { puskesmasList, type PuskesmasId } from "@/data/dashboard";
import { submitNakesRequirementFn } from "@/lib/api/workforce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface NakesRequirementInput {
  jenisNakes: string;
  kebutuhan: number;
  puskesmasCode?: string;
  puskesmasNama?: string;
}

function mapToPuskesmasCode(name: string): string | undefined {
  const lower = name.toLowerCase();
  if (lower.includes("barat") || lower.includes("purwokerto")) return "purwokerto_barat";
  if (lower.includes("patikraja")) return "patikraja";
  if (lower.includes("sokaraja")) return "sokaraja_1";
  if (lower.includes("kembaran")) return "kembaran_1";
  return undefined;
}

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
  const [isOpen, setIsOpen] = useState(false);
  const [targetPuskesmasId, setTargetPuskesmasId] = useState<PuskesmasId>(
    selectedPuskesmasId === "all" ? "purwokerto_barat" : selectedPuskesmasId
  );
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<NakesRequirementInput[] | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedPuskesmasId !== "all") {
      setTargetPuskesmasId(selectedPuskesmasId);
    }
  }, [selectedPuskesmasId]);

  const activeTargetPuskesmas =
    userRole === "PUSKESMAS"
      ? selectedPuskesmasId === "all" ? "purwokerto_barat" : selectedPuskesmasId
      : targetPuskesmasId;

  const toggleOpen = () => setIsOpen((prev) => !prev);
  const closeDrawer = () => {
    setIsOpen(false);
    resetUploadState();
  };

  const resetUploadState = () => {
    setFile(null);
    setParsedData(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (selectedFile: File) => {
    setValidationError(null);
    setParsedData(null);

    const validExtensions = [".xlsx", ".xls"];
    const fileName = selectedFile.name.toLowerCase();
    const isValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValidExtension) {
      setValidationError("File harus berformat Excel (.xlsx atau .xls).");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    parseExcelFile(selectedFile);
  };

  const parseExcelFile = (fileToParse: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          setValidationError("File Excel kosong atau tidak memiliki sheet.");
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: "",
        });

        if (!rawJson || rawJson.length === 0) {
          setValidationError("Sheet Excel tidak berisi data.");
          return;
        }

        const firstRow = rawJson[0];
        const keys = Object.keys(firstRow).map((k) => k.trim());

        const jenisNakesKey = Object.keys(firstRow).find(
          (k) =>
            k.toLowerCase().includes("jenis") ||
            k.toLowerCase().includes("nakes") ||
            k.toLowerCase().includes("profesi")
        );

        const kebutuhanKey = Object.keys(firstRow).find(
          (k) =>
            k.toLowerCase().includes("kebutuhan") ||
            k.toLowerCase().includes("jumlah") ||
            k.toLowerCase().includes("target")
        );

        const puskesmasKey = Object.keys(firstRow).find(
          (k) =>
            k.toLowerCase().includes("puskesmas") ||
            k.toLowerCase().includes("kecamatan") ||
            k.toLowerCase().includes("faskes") ||
            k.toLowerCase().includes("lokasi")
        );

        if (!jenisNakesKey || !kebutuhanKey) {
          setValidationError(
            `Struktur kolom tidak sesuai. Wajib memiliki kolom 'Jenis Nakes' dan 'Jumlah Kebutuhan'. Header ditemukan: ${keys.join(", ")}`
          );
          return;
        }

        const parsedRows: NakesRequirementInput[] = [];
        const errors: string[] = [];

        rawJson.forEach((row, index) => {
          const jenisNakes = String(row[jenisNakesKey] ?? "").trim();
          const rawKebutuhan = row[kebutuhanKey];
          const normalizedKebutuhan = String(rawKebutuhan ?? "").trim().replace(",", ".");
          const kebutuhanNum = Number(normalizedKebutuhan);

          let pCode: string | undefined = undefined;
          let pNama: string | undefined = undefined;
          if (puskesmasKey && row[puskesmasKey]) {
            const rawP = String(row[puskesmasKey]).trim();
            pCode = mapToPuskesmasCode(rawP);
            pNama = rawP;
          }

          if (!jenisNakes) return;

          if (rawKebutuhan === "" || rawKebutuhan === undefined || isNaN(kebutuhanNum) || kebutuhanNum < 0) {
            errors.push(
              `Baris ${index + 2}: 'Jumlah Kebutuhan' (${rawKebutuhan}) harus berupa angka valid.`
            );
            return;
          }

          parsedRows.push({
            jenisNakes,
            kebutuhan: Math.round(kebutuhanNum),
            puskesmasCode: pCode,
            puskesmasNama: pNama,
          });
        });

        if (errors.length > 0) {
          setValidationError(errors.slice(0, 3).join("\n"));
          return;
        }

        if (parsedRows.length === 0) {
          setValidationError("Data tidak ditemukan atau semua baris kosong.");
          return;
        }

        setParsedData(parsedRows);
        setValidationError(null);
      } catch (err) {
        setValidationError(
          `Gagal membaca file Excel: ${(err as Error).message || "Format file tidak didukung"}`
        );
      }
    };

    reader.onerror = () => {
      setValidationError("Terjadi kesalahan teknis saat membaca file.");
    };

    reader.readAsArrayBuffer(fileToParse);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
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
          targetPuskesmasCode: activeTargetPuskesmas,
          items: parsedData.map((row) => ({
            jenisNakes: row.jenisNakes,
            kebutuhan: Math.round(row.kebutuhan),
            tersedia: 0,
            puskesmasCode: row.puskesmasCode,
          })),
        },
      });

      const targetName =
        puskesmasList.find((p) => p.id === activeTargetPuskesmas)?.nama ?? activeTargetPuskesmas;
      toast.success(`Berhasil mengajukan kebutuhan nakes (${targetName}). Dashboard diperbarui.`);

      onProcessUpload();
      closeDrawer();
    } catch (err: any) {
      const errMsg = err?.message || String(err) || "Gagal menyimpan pengajuan";
      toast.error(`Gagal menyimpan: ${errMsg}`);
      setValidationError(`Gagal menyimpan: ${errMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      { "Jenis Nakes": "Dokter", "Jumlah Kebutuhan": 12 },
      { "Jenis Nakes": "Dokter Gigi", "Jumlah Kebutuhan": 4 },
      { "Jenis Nakes": "Perawat", "Jumlah Kebutuhan": 30 },
      { "Jenis Nakes": "Bidan", "Jumlah Kebutuhan": 18 },
      { "Jenis Nakes": "Tenaga Kesehatan Masyarakat", "Jumlah Kebutuhan": 6 },
      { "Jenis Nakes": "Tenaga Kesehatan Lingkungan (Sanitarian)", "Jumlah Kebutuhan": 4 },
      { "Jenis Nakes": "Ahli Teknologi Laboratorium Medik (ATLM)", "Jumlah Kebutuhan": 5 },
      { "Jenis Nakes": "Tenaga Gizi (Nutrisionis)", "Jumlah Kebutuhan": 4 },
      { "Jenis Nakes": "Tenaga Kefarmasian", "Jumlah Kebutuhan": 6 },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kebutuhan Nakes");
    XLSX.writeFile(workbook, "Template_Kebutuhan_Nakes.xlsx");
    toast.info("Template Excel berhasil diunduh");
  };

  return (
    <>
      {/* Edge Trigger Button - Icon Only */}
      <button
        onClick={toggleOpen}
        title="Upload Excel Kebutuhan Nakes"
        aria-label="Upload Excel Kebutuhan Nakes"
        className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center justify-center rounded-l-2xl border border-r-0 border-primary/30 bg-primary p-3.5 text-primary-foreground shadow-2xl transition-all duration-200 hover:pl-4.5 hover:brightness-110 active:scale-95 group"
      >
        <FileSpreadsheet className="size-5.5 transition-transform duration-200 group-hover:scale-110" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={closeDrawer}
          className="fixed inset-0 z-50 bg-background/70 backdrop-blur-xs transition-opacity animate-in fade-in-50"
        />
      )}

      {/* Right-Side Drawer Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-2xl transition-transform duration-300 ease-in-out sm:max-w-lg ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header Drawer */}
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Upload Kebutuhan Nakes</h2>
              <p className="text-xs text-muted-foreground">
                Target: <strong className="text-foreground font-semibold">{puskesmasList.find(p => p.id === activeTargetPuskesmas)?.nama ?? activeTargetPuskesmas}</strong>
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 sm:p-5">
          {/* Target Selection for Dinkes Role */}
          {userRole === "DINKES" && (
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Target Puskesmas Pengajuan</label>
              <Select
                value={targetPuskesmasId}
                onValueChange={(val) => setTargetPuskesmasId(val as PuskesmasId)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Target Puskesmas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Puskesmas (Master Upload)</SelectItem>
                  {puskesmasList
                    .filter((p) => p.id !== "all")
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Sebagai Dinkes, Anda dapat memilih Puskesmas spesifik atau meng-upload Master Excel se-kabupaten.
              </p>
            </div>
          )}

          {/* File Upload Dropzone */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">File Excel (.xlsx / .xls)</label>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Download className="size-3.5" />
                Unduh Template
              </button>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : file
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleInputChange}
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{file.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB — Klik untuk mengganti file
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Upload className="size-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Tarik & drop file Excel ke sini, atau <span className="font-semibold text-primary">Pilih File</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Format 2 kolom: <strong>Jenis Nakes</strong> & <strong>Jumlah Kebutuhan</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validation Error Alert */}
          {validationError && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5 animate-in fade-in-50">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="whitespace-pre-line font-medium leading-relaxed">{validationError}</div>
            </div>
          )}

          {/* Preview Table */}
          {parsedData && parsedData.length > 0 && (
            <div className="space-y-2.5 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Pratinjau Data ({parsedData.length} Jenis Nakes)
                  </h3>
                </div>
                <button
                  onClick={resetUploadState}
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
                    {parsedData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/40 transition-colors">
                        <td className="px-3.5 py-2 text-muted-foreground">{idx + 1}</td>
                        <td className="px-3.5 py-2 text-foreground font-medium">{item.jenisNakes}</td>
                        <td className="px-3.5 py-2 text-right font-semibold text-primary">
                          {item.kebutuhan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border p-4 sm:p-5 bg-card">
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleProcessSubmit}
            disabled={!parsedData || parsedData.length === 0 || isProcessing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:brightness-110 disabled:opacity-50 transition-all"
          >
            <CheckCircle2 className="size-4" />
            {isProcessing ? "Memproses..." : "Upload & Proses"}
          </button>
        </div>
      </div>
    </>
  );
}
