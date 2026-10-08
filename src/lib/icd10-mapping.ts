
export type EwsDisease = "DBD" | "Diare" | "ISPA";

const ICD10_MAP: Record<string, EwsDisease> = {
  // DBD
  A90: "DBD", // Dengue fever (Demam Dengue)
  A91: "DBD", // Dengue haemorrhagic fever (DBD berat)

  // Diare
  A00: "Diare", // Kolera
  A01: "Diare", // Demam tifoid dan paratifoid
  A02: "Diare", // Infeksi Salmonella lain
  A03: "Diare", // Shigellosis (Disentri basiler)
  A04: "Diare", // Infeksi bakteri usus lain (E. coli, dll.)
  A05: "Diare", // Keracunan makanan bakteri lain
  A06: "Diare", // Amoebiasis
  A07: "Diare", // Penyakit usus protozoal lain
  A08: "Diare", // Infeksi usus virus (Rotavirus, Norovirus, dll.)
  A09: "Diare", // Gastroenteritis & kolitis tidak spesifik
  K52: "Diare", // Gastroenteritis & kolitis non-infeksi lain

  // ISPA
  J00: "ISPA", // Nasofaringitis akut (pilek biasa)
  J01: "ISPA", // Sinusitis akut
  J02: "ISPA", // Faringitis akut
  J03: "ISPA", // Tonsilitis akut
  J04: "ISPA", // Laringitis dan trakeitis akut
  J05: "ISPA", // Laringitis obstruktif akut & epiglottitis
  J06: "ISPA", // Infeksi saluran napas atas akut multipel/tidak spesifik
  J09: "ISPA", // Influenza virus tertentu (H1N1, H5N1, dll.)
  J10: "ISPA", // Influenza virus teridentifikasi lain
  J11: "ISPA", // Influenza, virus tidak teridentifikasi
  J12: "ISPA", // Pneumonia viral
  J13: "ISPA", // Pneumonia Streptococcus pneumoniae
  J14: "ISPA", // Pneumonia Haemophilus influenzae
  J15: "ISPA", // Pneumonia bakterial lain
  J16: "ISPA", // Pneumonia mikroorganisme infeksius lain
  J17: "ISPA", // Pneumonia pada penyakit lain
  J18: "ISPA", // Pneumonia tidak spesifik
  J20: "ISPA", // Bronkitis akut
  J21: "ISPA", // Bronkiolitis akut
  J22: "ISPA", // Infeksi saluran napas bawah akut tidak spesifik
};

/**
 * Klasifikasi berdasarkan kode ICD-10.
 * Menggunakan 3 karakter pertama (mis. "A90.0" → "A90").
 */
export function classifyByIcd10(kode: string): EwsDisease | null {
  if (!kode) return null;
  const prefix = kode.trim().toUpperCase().substring(0, 3);
  return ICD10_MAP[prefix] ?? null;
}

/**
 * Fallback: klasifikasi berdasarkan nama penyakit (keyword matching).
 * Digunakan ketika kode ICD-10 tidak tersedia di API.
 */
export function classifyByName(nama: string): EwsDisease | null {
  if (!nama) return null;
  const lower = nama.toLowerCase().trim();

  // Eksklusi TBC agar tidak tertukar dengan ISPA
  if (lower.includes("tubercul") || /\btb\b/.test(lower) || lower.includes("tbc")) {
    return null;
  }

  // DBD
  if (
    lower.includes("dbd") ||
    lower.includes("dengue") ||
    lower.includes("berdarah") ||
    lower.includes("haemorrhagic") ||
    lower.includes("hemorrhagic")
  ) {
    return "DBD";
  }

  // Diare
  if (
    lower.includes("diare") ||
    lower.includes("diarrh") ||
    lower.includes("gastroenteritis") ||
    lower.includes("disentri") ||
    lower.includes("kolera") ||
    lower.includes("cholera") ||
    lower.includes("shigella") ||
    lower.includes("salmonella") ||
    lower.includes("rotavirus")
  ) {
    return "Diare";
  }

  // ISPA
  if (
    lower.includes("ispa") ||
    lower.includes("pharyngitis") ||
    lower.includes("faringitis") ||
    lower.includes("rhinitis") ||
    lower.includes("influenza") ||
    /\bflu\b/.test(lower) ||
    lower.includes("tonsil") ||
    lower.includes("laringitis") ||
    lower.includes("laryngitis") ||
    lower.includes("sinusitis") ||
    lower.includes("pneumonia") ||
    lower.includes("bronch") ||
    lower.includes("bronkit") ||
    lower.includes("batuk pilek") ||
    lower.includes("common cold") ||
    lower.includes("saluran napas")
  ) {
    return "ISPA";
  }

  return null;
}

export function classifyDisease(
  kodeDiagnosa: string,
  namaDiagnosa: string,
): EwsDisease | null {
  return classifyByIcd10(kodeDiagnosa) ?? classifyByName(namaDiagnosa);
}
