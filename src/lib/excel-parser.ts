import * as XLSX from "xlsx";
import type { NakesRequirementInput } from "@/types/workforce";

export function mapToPuskesmasCode(name: string): string | undefined {
  const lower = name.toLowerCase();
  if (lower.includes("barat") || lower.includes("purwokerto"))
    return "purwokerto_barat";
  if (lower.includes("patikraja")) return "patikraja";
  if (lower.includes("sokaraja")) return "sokaraja_1";
  if (lower.includes("kembaran")) return "kembaran_1";
  return undefined;
}

export function parseNakesExcelFile(
  fileToParse: File,
): Promise<NakesRequirementInput[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error("File Excel kosong atau tidak memiliki sheet."));
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          worksheet,
          { defval: "" },
        );

        if (!rawJson || rawJson.length === 0) {
          reject(new Error("Sheet Excel tidak berisi data."));
          return;
        }

        const firstRow = rawJson[0];
        const keys = Object.keys(firstRow).map((k) => k.trim());

        const jenisNakesKey = Object.keys(firstRow).find(
          (k) =>
            k.toLowerCase().includes("jenis") ||
            k.toLowerCase().includes("nakes") ||
            k.toLowerCase().includes("profesi"),
        );

        const kebutuhanKey = Object.keys(firstRow).find(
          (k) =>
            k.toLowerCase().includes("kebutuhan") ||
            k.toLowerCase().includes("jumlah") ||
            k.toLowerCase().includes("target"),
        );

        const puskesmasKey = Object.keys(firstRow).find(
          (k) =>
            k.toLowerCase().includes("puskesmas") ||
            k.toLowerCase().includes("kecamatan") ||
            k.toLowerCase().includes("faskes") ||
            k.toLowerCase().includes("lokasi"),
        );

        if (!jenisNakesKey || !kebutuhanKey) {
          reject(
            new Error(
              `Struktur kolom tidak sesuai. Wajib memiliki kolom 'Jenis Nakes' dan 'Jumlah Kebutuhan'. Header ditemukan: ${keys.join(", ")}`,
            ),
          );
          return;
        }

        const parsedRows: NakesRequirementInput[] = [];
        const errors: string[] = [];

        rawJson.forEach((row, index) => {
          const jenisNakes = String(row[jenisNakesKey] ?? "").trim();
          const rawKebutuhan = row[kebutuhanKey];
          const normalizedKebutuhan = String(rawKebutuhan ?? "")
            .trim()
            .replace(",", ".");
          const kebutuhanNum = Number(normalizedKebutuhan);

          let pCode: string | undefined = undefined;
          let pNama: string | undefined = undefined;
          if (puskesmasKey && row[puskesmasKey]) {
            const rawP = String(row[puskesmasKey]).trim();
            pCode = mapToPuskesmasCode(rawP);
            pNama = rawP;
          }

          if (!jenisNakes) return;

          if (
            rawKebutuhan === "" ||
            rawKebutuhan === undefined ||
            isNaN(kebutuhanNum) ||
            kebutuhanNum < 0
          ) {
            errors.push(
              `Baris ${index + 2}: 'Jumlah Kebutuhan' (${rawKebutuhan}) harus berupa angka valid.`,
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
          reject(new Error(errors.slice(0, 3).join("\n")));
          return;
        }

        if (parsedRows.length === 0) {
          reject(new Error("Data tidak ditemukan atau semua baris kosong."));
          return;
        }

        resolve(parsedRows);
      } catch (err) {
        reject(
          new Error(
            `Gagal membaca file Excel: ${(err as Error).message || "Format file tidak didukung"}`,
          ),
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Terjadi kesalahan teknis saat membaca file."));
    };

    reader.readAsArrayBuffer(fileToParse);
  });
}
