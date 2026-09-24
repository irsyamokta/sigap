import { useState, FormEvent } from "react";
import {
  Lock,
  Mail,
  AlertCircle,
  Building2,
  Stethoscope,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { loginFn } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Silakan isi email dan password.");
      return;
    }

    setLoading(true);

    try {
      await loginFn({ data: { email, password } });
      await router.invalidate();
      window.location.href = "/";
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal login. Silakan periksa kembali kredensial Anda.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const setPresetCredentials = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword("rahasia123");
    setErrorMessage(null);
  };

  return (
    <div className="w-full space-y-6">
      <div className="mb-6 space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Masuk Akun
        </h2>
        <p className="text-xs text-muted-foreground">
          Gunakan kredensial terdaftar untuk mengakses dashboard SIGAP.
        </p>
      </div>

      {/* Preset Credential Buttons */}
      <div className="mb-6 space-y-2">
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Pilih Akun Demo (Uji Coba):
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPresetCredentials("dinkes@banyumaskab.go.id")}
            className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-left text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <div className="truncate">
              <p className="font-bold">Dinkes Banyumas</p>
              <p className="text-[10px] opacity-75">Akses Semua Faskes</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() =>
              setPresetCredentials("purwokertobarat@banyumaskab.go.id")
            }
            className="flex items-center gap-2 rounded-xl border border-accent bg-accent/30 p-2.5 text-left text-xs font-medium text-foreground hover:bg-accent/60 transition-colors"
          >
            <Stethoscope className="h-4 w-4 shrink-0 text-primary" />
            <div className="truncate">
              <p className="font-bold">Puskesmas Barat</p>
              <p className="text-[10px] text-muted-foreground">
                Akses Faskes Lokal
              </p>
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@banyumaskab.go.id"
              required
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-md hover:brightness-110 disabled:opacity-50 transition-all"
        >
          {loading ? (
            <span className="animate-pulse">Memverifikasi...</span>
          ) : (
            <>
              <span>Masuk Sistem</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
