# SIGAP — Sistem Infografis Puskesmas

Dashboard analitik data kesehatan puskesmas berbasis web. Menampilkan ringkasan data pasien, tren perawatan, distribusi penyakit, kecukupan tenaga kesehatan, serta ringkasan eksekutif berbasis AI (Google Gemini).

---

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (SSR + file-based routing) |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Chart | Recharts |
| AI | Google Gemini API (`gemini-2.5-flash`) |
| Date | date-fns, react-day-picker v9 |
| Bundler | Vite 8 |
| Language | TypeScript |

---

## Prasyarat

- **Node.js** v18 atau lebih baru — cek dengan `node -v`
- **npm** v9 atau lebih baru — cek dengan `npm -v`
- **Google Gemini API Key** — dapatkan di [Google AI Studio](https://aistudio.google.com/apikey)

---

## Cara Menjalankan

### 1. Clone repository

```sh
git clone <url-repository>
cd sigap
```

### 2. Install dependencies

```sh
npm install
```

### 3. Buat file environment

Buat file `.env` di root project:

```sh
cp .env.example .env
```

Atau buat manual, isi dengan API key Gemini:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Jalankan development server

```sh
npm run dev
```

Buka browser di `http://localhost:8080`.

---

## Scripts

| Command | Deskripsi |
|---|---|
| `npm run dev` | Jalankan development server di port 8080 |
| `npm run build` | Build production |
| `npm run build:dev` | Build dengan mode development |
| `npm run preview` | Preview hasil build |
| `npm run lint` | Jalankan ESLint |
| `npm run format` | Format kode dengan Prettier |

---

## Struktur Direktori

```
sigap/
├── public/                     # Static assets (favicon, robots.txt)
├── src/
│   ├── components/
│   │   ├── dashboard/          # Komponen spesifik dashboard
│   │   │   ├── ai-summary.tsx  # Panel ringkasan AI + typewriter effect
│   │   │   ├── charts.tsx      # Semua chart Recharts (area, bar, line, donut)
│   │   │   ├── navbar.tsx      # Header + filter periode + filter puskesmas
│   │   │   ├── section.tsx     # Layout primitives: Section dan Panel
│   │   │   ├── stat-card.tsx   # Card statistik ringkas
│   │   │   └── theme-switcher.tsx  # Sidebar pengaturan tema & dark mode
│   │   └── ui/                 # Komponen shadcn/ui
│   │       ├── button.tsx
│   │       ├── calendar.tsx    # DayPicker v9 dengan custom nav
│   │       ├── popover.tsx
│   │       └── ...
│   ├── data/
│   │   └── dashboard.ts        # Data dummy dashboard + fungsi getDashboardData()
│   ├── hooks/
│   │   └── use-mobile.tsx      # Hook deteksi layar mobile
│   ├── lib/
│   │   ├── ai.functions.ts     # Server function pemanggilan Gemini API
│   │   ├── error-capture.ts    # Error capture untuk SSR error handling
│   │   ├── error-page.ts       # HTML fallback halaman error 500
│   │   └── utils.ts            # Utility: cn() untuk Tailwind class merging
│   ├── routes/
│   │   ├── __root.tsx          # Root layout: HTML shell + theme injection script
│   │   └── index.tsx           # Halaman utama dashboard
│   ├── router.tsx              # Konfigurasi TanStack Router
│   ├── routeTree.gen.ts        # Auto-generated route tree (jangan diedit manual)
│   ├── server.ts               # Custom server entry untuk SSR error handling
│   ├── start.ts                # Entry point aplikasi
│   └── styles.css              # Global styles + design tokens (oklch color system)
├── .env                        # Environment variables (tidak di-commit)
├── .env.example                # Template environment variables
├── components.json             # Konfigurasi shadcn/ui
├── tsconfig.json               # Konfigurasi TypeScript
└── vite.config.ts              # Konfigurasi Vite + TanStack Start
```

---

## Fitur

- **Dashboard multi-puskesmas** — filter data per puskesmas atau tampilkan semua
- **Filter periode** — pilih rentang tanggal dengan date range picker
- **Ringkasan AI** — generate ringkasan eksekutif otomatis via Gemini API dengan efek typewriter
- **Tema dinamis** — 4 tema warna (Biru Langit, Hijau Mint, Oranye Coral, Ungu Lavender)
- **Dark mode** — toggle light/dark dengan persisted preference
- **Responsive** — layout mobile dengan hamburger menu
- **SSR** — server-side rendering via TanStack Start

---

## Environment Variables

| Variable | Deskripsi | Wajib |
|---|---|---|
| `GEMINI_API_KEY` | API key Google Gemini untuk fitur ringkasan AI | Ya |

---

## Catatan Pengembangan

- Route tree (`routeTree.gen.ts`) di-generate otomatis oleh TanStack Router saat `npm run dev`. Jangan edit manual.
- Warna tema menggunakan format **oklch** dan didefinisikan sebagai CSS custom properties di `src/styles.css`.
- Theme dan dark mode disimpan di `localStorage` dengan key `dashboard-theme` dan `dashboard-mode`.
- Blocking script di `__root.tsx` memastikan tema ter-apply sebelum browser render pertama (mencegah flash of unstyled theme).
