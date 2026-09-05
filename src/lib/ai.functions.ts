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

    const promptText = `Anda adalah Analis Data Sistem Informasi Kesehatan Senior di Dinas Kesehatan.
Buat Laporan Ringkasan Eksekutif & Analisis Situasi Kesehatan yang RINGKAS, PADAT, SPESIFIK, dan BERDASARKAN DATA ANGKA.

PETUNJUK UTAMA:
- Tuliskan laporan secara padat, lugas, tajam (maksimal 350-400 kata total).
- JANGAN menulis kalimat pembuka atau kata sambutan umum seperti "Berikut adalah...". LANGSUNG mulai dari judul "## 1. Ringkasan Kinerja & Beban Kunjungan".
- JANGAN membuat kalimat penutup umum. PASTI KAN SELURUH 5 SECTION SELESAI DITULIS HINGGA POIN REKOMENDASI TERAKHIR TANPA TERPOTONG.

Gunakan struktur 5 section berikut:
## 1. Ringkasan Kinerja & Beban Kunjungan
- Total kunjungan pasien & Puskesmas dengan kunjungan tertinggi beserta angkanya.
- Pasien sakit, pasien sembuh, dan tren penyakit (dengan % perbandingan periode sebelumnya).

## 2. Analisis Penyakit Teratas & Alert EWS (Early Warning System)
- Rincian penyakit terbanyak beserta persentasenya.
- Status EWS spesifik: Sebutkan penyakit yang berstatus SIAGA atau WASPADA, jumlah kasus vs threshold/batas aman, dan nama puskesmas terkait.

## 3. Evaluasi Tenaga Kesehatan & Prioritas Kebutuhan
- Rasio ketersediaan vs kebutuhan nakes saat ini.
- Puskesmas atau Profesi yang menjadi **Prioritas Utama** penambahan nakes.
- Rincian profesi nakes yang mengalami defisit personel.

## 4. Kapasitas & Okupansi Perawatan
- Tingkat okupansi ruang perawatan dan tren bulanan.

## 5. Rekomendasi Strategis & Action Plan
- 3-4 langkah konkret, realistis, dan berorientasi solusi berdasarkan EWS & defisit nakes di atas.

Analisis untuk: ${data.puskesmas}
Periode: ${data.periode}

Data Mentah:
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
                temperature: 0.3,
                maxOutputTokens: 4096,
              },
            }),
          }
        );

        if (response.status === 429) {
          lastError = "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.";
          continue;
        }
        if (response.status === 402) {
          return { error: "Kredit AI habis. Silakan tambahkan kredit di workspace Anda." };
        }
        if (!response.ok) {
          const errBody = await response.text();
          lastError = `Model ${model} error (${response.status}): ${errBody}`;
          continue;
        }

        const json = (await response.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
        };

        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return { text };
        }
      } catch (e) {
        lastError = (e as Error).message;
      }
    }

    return { error: lastError || "Gagal membuat ringkasan, silakan coba lagi." };
  });
