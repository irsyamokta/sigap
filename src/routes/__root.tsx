import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import error500Svg from "../assets/500.svg";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-8xl font-extrabold text-primary opacity-20">404</p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <img
        src={error500Svg}
        alt="Ilustrasi error server"
        className="mb-6 w-full max-w-sm opacity-90 [filter:var(--illustration-filter)]"
      />
      <h1 className="text-2xl font-bold text-foreground">Terjadi kesalahan pada server</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Maaf, ada sesuatu yang tidak berjalan dengan baik di sisi kami. Silakan coba lagi atau kembali ke halaman utama.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Coba lagi
        </button>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Kembali ke beranda
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dashboard Sigap" },
      { name: "description", content: "Sigap App" },
      { property: "og:title", content: "Sigap" },
      { property: "og:description", content: "Sigap App" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const themeScript = `(function(){try{var t=localStorage.getItem('dashboard-theme')||'cyan';var m=localStorage.getItem('dashboard-mode');var v=['cyan','sky','mint','coral','lavender'];if(v.indexOf(t)===-1)t='cyan';document.documentElement.classList.add('theme-'+t);if(m==='dark'||(!m&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
          {/* Blocking: apply theme before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
