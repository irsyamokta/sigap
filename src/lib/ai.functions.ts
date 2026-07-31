import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SummaryInput = z.object({
  puskesmas: z.string(),
  periode: z.string(),
  ringkasan: z.string(),
});

export const generateSummary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SummaryInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Anda analis data kesehatan. Buat ringkasan eksekutif dalam Bahasa Indonesia, maksimal 5 poin bullet singkat dan 1 kalimat rekomendasi. Gunakan format markdown sederhana.\n\nBuat ringkasan untuk ${data.puskesmas}, periode ${data.periode}.\n\nData:\n${data.ringkasan}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      },
    );

    if (response.status === 429) {
      return { error: "Terlalu banyak permintaan. Coba lagi beberapa saat lagi." };
    }
    if (response.status === 402) {
      return { error: "Kredit AI habis. Silakan tambahkan kredit di workspace Anda." };
    }
    if (!response.ok) {
      const errBody = await response.text();
      return { error: `Gagal membuat ringkasan (${response.status}): ${errBody}` };
    }

    const json = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return { error: "Ringkasan kosong, coba lagi." };
    return { text };
  });
