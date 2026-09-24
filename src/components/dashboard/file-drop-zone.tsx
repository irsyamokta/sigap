import { Upload, CheckCircle2 } from "lucide-react";
import type { DragEvent } from "react";

interface FileDropZoneProps {
  file: File | null;
  isDragging: boolean;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onClick: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
}

export function FileDropZone({
  file,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  inputRef,
  onInputChange,
  onDownloadTemplate,
}: FileDropZoneProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">
          File Excel (.xlsx / .xls)
        </label>
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Upload className="size-3.5" /> Unduh Template
        </button>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : file
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx, .xls"
          onChange={onInputChange}
          className="hidden"
        />
        {file ? (
          <div className="flex flex-col items-center space-y-2">
            <CheckCircle2 className="size-6 text-emerald-600" />
            <p className="text-xs font-semibold text-foreground">{file.name}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Upload className="size-6 text-primary" />
            <p className="text-xs font-medium text-foreground">
              Pilih File Excel Kebutuhan Nakes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
