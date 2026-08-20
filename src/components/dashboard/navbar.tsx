import { CalendarDays, Filter, Menu, X, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { puskesmasList, type PuskesmasId } from "@/data/dashboard";
import { id } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { logoutFn } from "@/lib/auth";

interface FilterDropdownProps {
  puskesmas: PuskesmasId;
  onPuskesmasChange: (id: PuskesmasId) => void;
}

function FilterDropdown({ puskesmas, onPuskesmasChange }: FilterDropdownProps) {
  return (
    <div className="space-y-1">
      {puskesmasList.map((p) => (
        <button
          key={p.id}
          onClick={() => onPuskesmasChange(p.id)}
          className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
            puskesmas === p.id
              ? "text-primary-foreground [background:var(--gradient-primary)]"
              : "text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          {p.nama}
        </button>
      ))}
    </div>
  );
}

interface NavbarProps {
  user: any;
  scrolled: boolean;
  periodeLabel: string;
  range: DateRange | undefined;
  onRangeChange: (range: DateRange | undefined) => void;
  puskesmas: PuskesmasId;
  onPuskesmasChange: (id: PuskesmasId) => void;
  defaultRange: DateRange;
}

export function Navbar({
  user,
  scrolled,
  periodeLabel,
  range,
  onRangeChange,
  puskesmas,
  onPuskesmasChange,
  defaultRange,
}: NavbarProps) {
  const router = useRouter();
  const [openFilter, setOpenFilter] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logoutFn();
    router.invalidate();
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setOpenFilter(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setOpenMobileMenu(false);
      }
    }
    if (openFilter || openMobileMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openFilter, openMobileMenu]);

  function handleReset() {
    onPuskesmasChange("all");
    onRangeChange(defaultRange);
  }

  return (
    <header
      className={`sticky top-0 z-20 border-b transition-all duration-300 ${
        scrolled
          ? "border-border/50 bg-white/70 backdrop-blur-md dark:bg-background/70"
          : "border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4">
        {/* Logo */}
        <p className="text-4xl font-extrabold tracking-tight leading-tight">
          <span className="bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">Si</span>
          <span className="text-slate-600 dark:text-slate-400">gap</span>
        </p>

        {/* Desktop controls */}
        <div ref={filterRef} className="relative hidden items-center gap-2 md:flex">
          <Popover>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <CalendarDays className="size-4 text-primary" />
                {periodeLabel}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={range}
                onSelect={onRangeChange}
                numberOfMonths={2}
                defaultMonth={range?.from}
                locale={id}
                initialFocus
                className="pointer-events-auto p-3"
              />
            </PopoverContent>
          </Popover>

          {user.role === "DINKES" && (
            <>
              <button
                onClick={() => setOpenFilter((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                  openFilter || puskesmas !== "all"
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Filter className="size-4 text-primary" />
                Filter
              </button>

              {openFilter && (
                <div className="absolute top-12 right-0 z-30 w-72 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
                  <p className="mb-2 text-xs font-semibold text-foreground">Puskesmas</p>
                  <FilterDropdown puskesmas={puskesmas} onPuskesmasChange={onPuskesmasChange} />
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={handleReset}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setOpenFilter(false)}
                      className="flex-1 rounded-lg px-3 py-2 text-xs text-primary-foreground [background:var(--gradient-primary)]"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Logout Button Desktop */}
          <button
            onClick={handleLogout}
            title="Keluar"
            className="flex items-center gap-2 rounded-lg border border-border bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 hover:border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Mobile hamburger */}
        <div ref={mobileMenuRef} className="relative md:hidden">
          <button
            onClick={() => setOpenMobileMenu((v) => !v)}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 text-foreground transition-colors hover:bg-accent"
          >
            {openMobileMenu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          {openMobileMenu && (
            <div className="absolute top-12 right-0 z-30 w-80 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
              <p className="mb-2 text-xs font-semibold text-foreground">Periode</p>
              <Calendar
                mode="range"
                selected={range}
                onSelect={onRangeChange}
                numberOfMonths={1}
                defaultMonth={range?.from}
                locale={id}
                initialFocus
                className="pointer-events-auto"
              />
              {user.role === "DINKES" && (
                <>
                  <p className="mt-4 mb-2 text-xs font-semibold text-foreground">Puskesmas</p>
                  <FilterDropdown puskesmas={puskesmas} onPuskesmasChange={onPuskesmasChange} />
                </>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Reset
                </button>
                <button
                  onClick={() => setOpenMobileMenu(false)}
                  className="flex-1 rounded-lg px-3 py-2 text-xs text-primary-foreground [background:var(--gradient-primary)]"
                >
                  Terapkan
                </button>
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
