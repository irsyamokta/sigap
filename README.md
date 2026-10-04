# SIGAP — Sistem Infografis Puskesmas

Dashboard analitik data kesehatan puskesmas berbasis web. Menampilkan ringkasan data pasien, tren perawatan, distribusi penyakit, Early Warning System (EWS) peta interaktif, manajemen & kecukupan tenaga kesehatan (Nakes), serta ringkasan eksekutif berbasis AI (Google Gemini).

---

## Tech Stack

| Kategori                | Teknologi                                                               |
| ----------------------- | ----------------------------------------------------------------------- |
| **Framework Web**       | [TanStack Start](https://tanstack.com/start) (SSR + file-based routing) |
| **Frontend UI**         | React 19, Tailwind CSS v4, shadcn/ui, Sonner (Toast)                    |
| **State & Fetching**    | TanStack React Query, TanStack Router                                   |
| **Database & ORM**      | PostgreSQL, Prisma ORM (`@prisma/client`)                               |
| **Server / Runtime**    | Hono (`@hono/node-server`), Node.js 22                                  |
| **Peta & GIS**          | Leaflet, React-Leaflet                                                  |
| **Chart & Visualisasi** | Recharts                                                                |
| **AI Integration**      | Google Gemini API (`gemini-2.5-flash`)                                  |
| **File Parser**         | SheetJS (xlsx) untuk pengolahan file Excel data nakes                   |
| **Autentikasi**         | Custom Session Auth + bcryptjs + Math Captcha                           |
| **Form & Validasi**     | React Hook Form, Zod                                                    |
| **Date & Utilities**    | date-fns, react-day-picker v9                                           |
| **Containerization**    | Docker & Docker Compose                                                 |
| **Bundler & Tooling**   | Vite 8, TypeScript, ESLint, Prettier                                    |

---

## Prasyarat

- **Node.js** v18 atau v22 — cek dengan `node -v`
- **npm** v9 atau lebih baru — cek dengan `npm -v`
- **PostgreSQL** — database server aktif
- **Google Gemini API Key** — dapatkan di [Google AI Studio](https://aistudio.google.com/apikey)
- _(Opsional)_ **Docker & Docker Compose** untuk kemudahan deployment

---

## Cara Menjalankan (Local Development)

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

Salin file `.env.example` ke `.env`:

```sh
cp .env.example .env
```

Sesuaikan variabel di file `.env`:

```env
# Database URL
DATABASE_URL="postgresql://user:password@localhost:5432/sigap?schema=public"

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# SIMPUS Telkom API Credentials
BASE_URL="https://simpus.banyumaskab.go.id/api_telkom/v1"
CLIENT_ID="your_simpus_client_id_here"
CLIENT_SECRET="your_simpus_client_secret_here"
```

### 4. Setup Database & Seed Data

Jalankan Prisma migration / db push dan seed awal database:

```sh
# Push schema ke database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed data awal (akun default & data nakes)
npm run db:seed
```

### 5. Jalankan development server

```sh
npm run dev
```

Buka browser di `http://localhost:8080`.

---

## Cara Menjalankan dengan Docker

Untuk menjalankan aplikasi secara containerized menggunakan Docker Compose:

```sh
# Build dan jalankan container
docker-compose up -d --build
```

Aplikasi akan berjalan di port `3006` (atau sesuai konfigurasi di `docker-compose.yml`).

---

## Scripts

| Command             | Deskripsi                                                 |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Jalankan development server                               |
| `npm run build`     | Build production untuk TanStack Start & Vite              |
| `npm run build:dev` | Build dengan mode development                             |
| `npm run preview`   | Preview hasil build production                            |
| `npm run db:seed`   | Populasi data awal/seed ke database PostgreSQL via Prisma |
| `npm run lint`      | Jalankan ESLint untuk pengecekan kualitas kode            |
| `npm run format`    | Format seluruh file kode dengan Prettier                  |

---

## Struktur Direktori

```
sigap/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD Workflow deployment GitHub Actions
├── prisma/                         # Konfigurasi & Skema Prisma ORM
│   ├── migrations/                 # Riwayat migrasi database PostgreSQL
│   ├── schema.prisma               # Schema data model (User, Session, NakesSubmission, dll)
│   └── seed.ts                     # Script seeder data awal (user admin & data nakes)
├── public/                         # Static assets publik
│   ├── data/
│   │   └── banyumas.geojson        # Data spasial boundary peta kabupaten Banyumas
│   ├── favicon.png                 # Icon favicon aplikasi
│   ├── login-illustration.jpg      # Gambar ilustrasi halaman login
│   └── robots.txt                  # Instruksi crawler search engine
├── src/
│   ├── assets/                     # Asset statis internal (SVG & logo)
│   │   ├── 500.svg                 # Ilustrasi halaman error 500
│   │   ├── illustration.svg        # Ilustrasi umum
│   │   └── logo-banyumas.png       # Logo Pemkab Banyumas
│   ├── components/
│   │   ├── dashboard/              # Komponen utama UI dashboard
│   │   │   ├── charts/             # Komponen grafik & visualisasi Recharts
│   │   │   │   ├── stat-charts.tsx      # Grafik tren kunjungan & pasien
│   │   │   │   └── workforce-charts.tsx # Grafik rasio & distribusi nakes
│   │   │   ├── ai-summary.tsx      # Panel ringkasan AI dengan efek typewriter
│   │   │   ├── charts.tsx          # Wrapper re-export komponen charts
│   │   │   ├── dashboard-sections.tsx # Section kontainer utama dashboard
│   │   │   ├── delete-confirm-dialog.tsx # Dialog konfirmasi hapus data
│   │   │   ├── ews-map-client.tsx  # Komponen client-rendered peta Leaflet EWS
│   │   │   ├── ews-map.tsx         # SSR wrapper komponen peta EWS
│   │   │   ├── ews.tsx             # Panel indikator Early Warning System
│   │   │   ├── file-drop-zone.tsx  # Komponen drag-and-drop upload file
│   │   │   ├── nakes-ratio-badge.tsx    # Badge status rasio nakes
│   │   │   ├── nakes-ratio-table-body.tsx # Isi tabel data rasio nakes
│   │   │   ├── nakes-ratio-table.tsx    # Tabel utama rasio nakes
│   │   │   ├── nakes-ratio-toolbar.tsx  # Toolbar filter & pencarian nakes
│   │   │   ├── nakes-upload-drawer.tsx  # Drawer form & upload Excel data nakes
│   │   │   ├── nakes-upload-preview.tsx # Preview data hasil upload Excel
│   │   │   ├── navbar.tsx          # Header navbar, filter puskesmas, & user menu
│   │   │   ├── section.tsx         # Layout primitive (Section & Panel)
│   │   │   ├── stat-card.tsx       # Card statistik kuis/ringkas
│   │   │   └── theme-switcher.tsx  # Sidebar pengaturan tema & dark mode
│   │   ├── login/
│   │   │   └── login-form.tsx      # Form login user + Math CAPTCHA
│   │   └── ui/                     # Primitives UI (shadcn/ui & Radix UI)
│   │       ├── alert-dialog.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── carousel.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── command.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── pagination.tsx
│   │       ├── popover.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       └── tooltip.tsx
│   ├── data/
│   │   └── dashboard.ts            # Mock fallback data dashboard & puskesmas
│   ├── generated/                  # Output Prisma Client hasil `npx prisma generate`
│   │   └── prisma/
│   ├── hooks/
│   │   └── use-mobile.tsx          # Custom hook deteksi tampilan viewport mobile
│   ├── lib/
│   │   ├── api/                    # Klien & servis integrasi API eksternal/internal
│   │   │   ├── simpus/             # Modul integrasi SIMPUS Telkom API
│   │   │   │   ├── services/
│   │   │   │   │   ├── daily-data.service.ts   # Servis data harian pasien
│   │   │   │   │   └── static-info.service.ts  # Servis info puskesmas & ref
│   │   │   │   ├── auth.ts         # Otentikasi token API SIMPUS
│   │   │   │   ├── cache.ts        # Caching response SIMPUS
│   │   │   │   ├── config.ts       # Endpoint & konfigurasi SIMPUS
│   │   │   │   ├── fallback.ts     # Data fallback SIMPUS
│   │   │   │   ├── index.ts        # Entry point modul SIMPUS API
│   │   │   │   └── utils.ts        # Helper fungsi transformasi data SIMPUS
│   │   │   ├── population.ts       # Utility data populasi penduduk per wilayah
│   │   │   ├── simpus.ts           # Export modul SIMPUS
│   │   │   ├── workforce-baseline.ts # Data acuan standar kebutuhan nakes (Permenkes)
│   │   │   └── workforce.ts        # API fetcher data pengajuan nakes dari DB
│   │   ├── dashboard/              # Aggregator data & kalkulator EWS / Nakes
│   │   │   ├── data-aggregator.ts  # Menggabungkan data SIMPUS, DB & EWS
│   │   │   ├── ews-calculator.ts   # Logika perhitungan skor kewaspadaan EWS
│   │   │   └── workforce-calculator.ts # Logika kalkulasi rasio nakes vs Permenkes
│   │   ├── ai.functions.ts         # Server function panggilan Google Gemini API
│   │   ├── auth.ts                 # Handler session authentication & cookie
│   │   ├── captcha.ts              # Generator & verifikator Math CAPTCHA
│   │   ├── error-capture.ts        # Error handler & logger SSR
│   │   ├── error-page.ts           # Template HTML fallback error 500
│   │   ├── excel-parser.ts         # Parser file spreadsheet Excel data nakes
│   │   ├── prisma.ts               # Instance singleton Prisma Client
│   │   ├── summary-formatter.ts    # Formatter ringkasan AI ke Markdown
│   │   └── utils.ts                # Utility helper (`cn` untuk Tailwind classes)
│   ├── routes/                     # File-based routes TanStack Start / Router
│   │   ├── __root.tsx              # Root HTML layout, theme script, & Sonner provider
│   │   ├── index.tsx               # Halaman utama dashboard (`/`)
│   │   └── login.tsx               # Halaman login (`/login`)
│   ├── types/                      # Definisi tipe TypeScript
│   │   ├── aggregator.ts           # Types untuk data aggregator
│   │   ├── auth.ts                 # Types untuk user session & auth
│   │   ├── dashboard.ts            # Types untuk komponen dashboard
│   │   ├── population.ts           # Types untuk data populasi
│   │   ├── simpus.ts               # Types untuk response API SIMPUS
│   │   └── workforce.ts            # Types untuk data nakes
│   ├── routeTree.gen.ts            # Route tree ter-generate otomatis (TanStack Router)
│   ├── router.tsx                  # Konfigurasi TanStack Router
│   ├── server.ts                   # Custom server entry handler SSR
│   ├── start.ts                    # Entry point aplikasi TanStack Start
│   └── styles.css                  # Global CSS, Tailwind v4, & design tokens OKLCH
├── .dockerignore                   # File/folder yang dikecualikan dari Docker build
├── .env.example                    # Template variabel lingkungan
├── components.json                 # Konfigurasi komponen shadcn/ui
├── docker-compose.yml              # Konfigurasi container Docker Compose
├── Dockerfile                      # Multi-stage build Dockerfile (Node 22)
├── eslint.config.js                # Konfigurasi linter ESLint v9
├── package.json                    # Manifes proyek & dependencies npm
├── prettierrc                      # Konfigurasi formatter Prettier
├── prettierignore                  # Pengecualian file untuk Prettier
├── prisma.config.ts                # Konfigurasi Prisma
├── README.md                       # Dokumentasi proyek
├── serve.mjs                       # Production Hono server entry point
├── tsconfig.json                   # Konfigurasi kompilator TypeScript
└── vite.config.ts                  # Konfigurasi bundler Vite 8 & plugin
```

---

## Fitur Utama

- **Autentikasi & RBAC**: Login dengan email, password, captcha matematika, serta sistem peran pengguna (`DINKES` dan `PUSKESMAS`).
- **Dashboard Multi-Puskesmas**: Filter data secara global per puskesmas atau lihat keseluruhan wilayah.
- **Early Warning System (EWS) Map**: Peta interaktif berbasis Leaflet yang memetakan status kewaspadaan dini & distribusi kesehatan di setiap puskesmas.
- **Manajemen Kecukupan Nakes**: Analisis rasio kecukupan Tenaga Kesehatan (Dokter, Perawat, Bidan, dll.) sesuai Permenkes.
- **Upload & Submission Data Nakes**: Pengajuan data kebutuhan nakes dari puskesmas via upload spreadsheet Excel atau input manual, tersimpan riwayatnya di PostgreSQL via Prisma.
- **Integrasi SIMPUS Telkom**: Penarikan data real-time / API pasien, penyakit, dan tren kunjungan puskesmas.
- **Ringkasan Eksekutif berbasis AI**: Pembuatan ringkasan otomatis menggunakan Google Gemini API (`gemini-2.5-flash`) lengkap dengan tampilan typewriter effect.
- **Tema Dinamis & Dark Mode**: 4 pilihan tema warna (Biru Langit, Hijau Mint, Oranye Coral, Ungu Lavender) & persisten dark mode tanpa _flash of unstyled content_.
- **Docker & Production Ready**: Mendukung deployment containerized berbasis Docker & server Hono.

---

## Environment Variables

| Variable         | Deskripsi                                      | Wajib |
| ---------------- | ---------------------------------------------- | ----- |
| `DATABASE_URL`   | Connection URL ke database PostgreSQL          | Ya    |
| `GEMINI_API_KEY` | API key Google Gemini untuk fitur ringkasan AI | Ya    |
| `BASE_URL`       | Endpoint Base URL API SIMPUS Telkom            | Ya    |
| `CLIENT_ID`      | Client ID otentikasi API SIMPUS Telkom         | Ya    |
| `CLIENT_SECRET`  | Client Secret otentikasi API SIMPUS Telkom     | Ya    |

---

## Catatan Pengembangan

- **Prisma Client**: Lokasi ter-generate berada di `src/generated/prisma`. Setiap melakukan perubahan pada `prisma/schema.prisma`, jalankan `npx prisma generate`.
- **Route Tree**: File `routeTree.gen.ts` di-generate otomatis oleh TanStack Router saat `npm run dev`. Jangan mengedit file ini secara manual.
- **Sistem Warna**: Menggunakan format **oklch** di `src/styles.css` yang diinjeksi via script di `__root.tsx` untuk mencegah _FOUC (Flash of Unstyled Content)_ saat peralihan tema/dark mode.
