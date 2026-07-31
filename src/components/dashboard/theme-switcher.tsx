import { Moon, Settings, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ThemeKey = "sky" | "mint" | "coral" | "lavender";
type Mode = "light" | "dark";

const themes: { key: ThemeKey; label: string; gradient: string }[] = [
  { key: "sky", label: "Biru Langit", gradient: "from-sky-400 to-blue-600" },
  { key: "mint", label: "Hijau Mint", gradient: "from-emerald-400 to-teal-600" },
  { key: "coral", label: "Oranye Coral", gradient: "from-orange-400 to-rose-500" },
  { key: "lavender", label: "Ungu Lavender", gradient: "from-violet-400 to-fuchsia-500" },
];

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeKey>("sky");
  const [mode, setMode] = useState<Mode>("light");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync state from DOM values set by the blocking theme script
    const savedTheme = localStorage.getItem("dashboard-theme") as ThemeKey | null;
    const validTheme = savedTheme && themes.some((t) => t.key === savedTheme) ? savedTheme : "sky";
    setTheme(validTheme);

    const isDark = document.documentElement.classList.contains("dark");
    setMode(isDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function switchTheme(next: ThemeKey) {
    document.documentElement.classList.remove(`theme-${theme}`);
    document.documentElement.classList.add(`theme-${next}`);
    localStorage.setItem("dashboard-theme", next);
    setTheme(next);
  }

  function switchMode(next: Mode) {
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("dashboard-mode", next);
    setMode(next);
  }

  return (
    <div ref={containerRef}>
      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Wrapper: button + sidebar bergerak bersama */}
      <div
        className={`fixed bottom-0 left-0 z-50 transition-transform duration-300 ease-in-out ${
          open ? "translate-y-0" : "translate-y-[calc(100%-42px)]"
        }`}
      >
        {/* Trigger button — menempel di atas sidebar */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Ganti tema warna"
          className="group flex items-center gap-2 rounded-tr-xl border-t border-r border-border bg-card px-3 py-2.5 text-primary shadow-[var(--shadow-soft)] transition-all hover:bg-accent active:scale-95"
        >
          <Settings className={`size-4 shrink-0 transition-transform duration-500 ${open ? "rotate-90" : "rotate-0"}`} />
          <span className="text-xs font-medium text-foreground group-hover:text-accent-foreground">Pengaturan</span>
        </button>

        {/* Sidebar laci */}
        <div className="w-56 rounded-tr-2xl border-t border-r border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Tema</p>
          <div className="space-y-1">
            {themes.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  switchTheme(t.key);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                  theme === t.key
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span className={`size-3.5 shrink-0 rounded-full bg-gradient-to-br ${t.gradient} ring-2 ring-white/60`} />
                {t.label}
              </button>
            ))}
          </div>

          <p className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Mode</p>
          <div
            onClick={() => switchMode(mode === "light" ? "dark" : "light")}
            className="relative flex h-9 w-full cursor-pointer items-center rounded-full border border-border bg-muted p-1"
          >
            <div
              className={`absolute h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-primary shadow transition-all duration-300 ${
                mode === "dark" ? "left-[calc(50%+2px)]" : "left-1"
              }`}
            />
            <div className={`relative z-10 flex flex-1 items-center justify-center transition-colors duration-300 ${mode === "light" ? "text-primary-foreground" : "text-muted-foreground"}`}>
              <Sun className="size-4" />
            </div>
            <div className={`relative z-10 flex flex-1 items-center justify-center transition-colors duration-300 ${mode === "dark" ? "text-primary-foreground" : "text-muted-foreground"}`}>
              <Moon className="size-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
