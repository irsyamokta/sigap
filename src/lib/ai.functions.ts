import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SummaryInput = z.object({
  puskesmas: z.string(),
  periode: z.string(),
  ringkasan: z.string(),
});

export const generateSummary = createServerFn({ method: "POST" })
  .validator((input: unknown) => SummaryInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY");

    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"];
    let lastError = "";

    const promptText = `Anda adalah Analis Data Ketenagakerjaan Kesehatan Senior di Dinas Kesehatan.
Tugas Anda adalah membuat Laporan Evaluasi Tenaga Kesehatan & Action Plan yang KONSISTEN, BAKU, KETAT DATA, dan MENGGUNAKAN TABEL MARKDOWN.

PETUNJUK KONSISTENSI & STABILITAS RESPONSE:
- Gunakan pola kalimat yang BAKU dan STABIL. DILARANG mengubah pola kalimat, header, nama kolom tabel, maupun struktur antar-generate.
- DILARANG MEMBUAT BAHASAN TENTANG: Kunjungan Pasien, Tren Penyakit, Penyakit Teratas, Alert EWS, maupun Okupansi Perawatan.
- TULIS HANYA 2 SEKSI UTAMA DENGAN STRUKTUR BERIKUT:

## 1. Evaluasi Tenaga Kesehatan & Prioritas Kebutuhan
Sebutkan informasi Puskesmas Paling Membutuhkan dengan kalimat baku persis seperti berikut:
**Puskesmas Paling Membutuhkan Penambahan Nakes:** [Nama Puskesmas & Keterangan Defisit]
 
| Jenis Nakes / Profesi | Kebutuhan | Tersedia | Selisih (Defisit) | Status Kecukupan | Prioritas Penambahan |
| :--- | :---: | :---: | :---: | :---: | :--- |

Sertakan ringkasan total ketersediaan vs kebutuhan dan persentase rasio kecukupan di bagian bawah tabel.

## 2. Rekomendasi Strategis & Action Plan

| No | Fokus / Profesi Target | Rekomendasi Strategis & Action Plan | Urgensi / Prioritas Execution |
| :---: | :--- | :--- | :---: |

ATURAN FORMAT MUTLAK:
- DILARANG menulis kata pembuka/sambutan. LANGSUNG mulai dari "## 1. Evaluasi Tenaga Kesehatan & Prioritas Kebutuhan".
- Sajikan seluruh evaluasi dan action plan dalam tabel markdown agar langsung dimengerti tanpa asumsi analisa tambahan.

Analisis Ketenagakerjaan Untuk: ${data.puskesmas}
Periode: ${data.periode}

Data Mentah Ketenagakerjaan:
${data.ringkasan}`;

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: {
                temperature: 0.0,
                maxOutputTokens: 4096,
              },
            }),
          },
        );

        if (response.status === 429) {
          lastError =
            "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.";
          continue;
        }
        if (response.status === 402) {
          return {
            error:
              "Kredit AI habis. Silakan tambahkan kredit di workspace Anda.",
          };
        }
        if (!response.ok) {
          const errBody = await response.text();
          lastError = `Model ${model} error (${response.status}): ${errBody}`;
          continue;
        }

        const json = (await response.json()) as {
          candidates?: {
            content?: { parts?: { text?: string }[] };
            finishReason?: string;
          }[];
        };

        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return { text };
        }
      } catch (e) {
        lastError = (e as Error).message;
      }
    }

    return {
      error: lastError || "Gagal membuat ringkasan, silakan coba lagi.",
    };
  });
