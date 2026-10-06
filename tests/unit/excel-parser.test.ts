import { describe, it, expect } from "vitest";
import { mapToPuskesmasCode, parseNakesExcelFile } from "@/lib/excel-parser";
import * as XLSX from "xlsx";

describe("Excel Parser Unit Tests (TC-NAKES-002 & TC-NAKES-003)", () => {
  describe("mapToPuskesmasCode", () => {
    it("should map Purwokerto Barat correctly", () => {
      expect(mapToPuskesmasCode("Puskesmas Purwokerto Barat")).toBe(
        "purwokerto_barat",
      );
      expect(mapToPuskesmasCode("barat")).toBe("purwokerto_barat");
    });

    it("should map Patikraja correctly", () => {
      expect(mapToPuskesmasCode("Puskesmas Patikraja")).toBe("patikraja");
    });

    it("should map Sokaraja correctly", () => {
      expect(mapToPuskesmasCode("Sokaraja 1")).toBe("sokaraja_1");
    });

    it("should map Kembaran correctly", () => {
      expect(mapToPuskesmasCode("Puskesmas Kembaran 1")).toBe("kembaran_1");
    });

    it("should return undefined for unknown puskesmas names", () => {
      expect(mapToPuskesmasCode("Puskesmas Unknown")).toBeUndefined();
    });
  });

  describe("parseNakesExcelFile", () => {
    it("should parse valid Excel file data correctly", async () => {
      const data = [
        {
          "Jenis Nakes": "Dokter Umum",
          "Jumlah Kebutuhan": 4,
          Puskesmas: "Purwokerto Barat",
        },
        {
          "Jenis Nakes": "Perawat",
          "Jumlah Kebutuhan": 8,
          Puskesmas: "Purwokerto Barat",
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const file = new File([excelBuffer], "nakes_valid.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const result = await parseNakesExcelFile(file);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        jenisNakes: "Dokter Umum",
        kebutuhan: 4,
        puskesmasCode: "purwokerto_barat",
        puskesmasNama: "Purwokerto Barat",
      });
      expect(result[1].jenisNakes).toBe("Perawat");
      expect(result[1].kebutuhan).toBe(8);
    });

    it("should reject file with invalid headers", async () => {
      const data = [{ "Header Acak": "Test", Nilai: 123 }];

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const file = new File([excelBuffer], "invalid_header.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      await expect(parseNakesExcelFile(file)).rejects.toThrow(
        /Struktur kolom tidak sesuai/,
      );
    });
  });
});
