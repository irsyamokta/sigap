import { createFileRoute, useNavigate, useRouter, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { loginFn, getAuthUserFn } from "@/lib/auth";
import logoBanyumas from "@/assets/logo-banyumas.png";
import illustrationSvg from "@/assets/illustration.svg";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const user = await getAuthUserFn();
    if (user) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginFn({ data: { email, password } });
      await router.invalidate();
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "Gagal login. Silakan periksa kembali kredensial Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* Left panel: Brand Visual & Statistics */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-white p-10">

        {/* Visual wrapper container */}
        <div className="flex flex-col items-center justify-center rounded-3xl bg-cyan-50 w-full h-full p-12 gap-10">

          {/* Centered illustration with overlapping float metrics */}
          <div className="relative w-full max-w-sm flex items-center justify-center">
            <img
              src={illustrationSvg}
              alt="SIGAP Healthcare Illustration"
              className="w-full object-contain drop-shadow-sm"
            />

            {/* Metric: Active Puskesmas count */}
            <div className="absolute top-6 -left-10 bg-white rounded-2xl shadow-lg px-3 py-2.5 flex items-center gap-2.5 min-w-max">
              <div className="h-8 w-8 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 leading-none">Puskesmas</p>
                <p className="text-sm font-bold text-gray-800">39 Unit</p>
              </div>
            </div>

            {/* Metric: Today's patient queue count */}
            <div className="absolute top-16 -right-10 bg-white rounded-2xl shadow-lg px-3 py-2.5 flex items-center gap-2.5 min-w-max">
              <div className="h-8 w-8 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 leading-none">Pasien Hari Ini</p>
                <p className="text-sm font-bold text-gray-800">1.284</p>
              </div>
            </div>

            {/* Metric: Active early warnings / health alerts */}
            <div className="absolute bottom-10 -left-10 bg-white rounded-2xl shadow-lg px-3 py-2.5 flex items-center gap-2.5 min-w-max">
              <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 leading-none">Peringatan Aktif</p>
                <p className="text-sm font-bold text-gray-800">3 Kasus</p>
              </div>
            </div>

            {/* Metric: Overall data verification rate */}
            <div className="absolute bottom-2 -right-10 bg-white rounded-2xl shadow-lg px-3 py-2.5 flex items-center gap-2.5 min-w-max">
              <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 leading-none">Akurasi Data</p>
                <p className="text-sm font-bold text-gray-800">98.5%</p>
              </div>
            </div>
          </div>

          {/* Marketing/tagline copy */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 leading-snug">
              Pantau Data Kesehatan<br />Lebih Mudah & Cepat
            </h2>
            <p className="mt-3 text-base text-gray-600 leading-relaxed max-w-xs">
              Platform infografis terpadu untuk data puskesmas dan peringatan dini kesehatan se-Kabupaten Banyumas.
            </p>
          </div>
        </div>

      </div>

      {/* Right panel: Authenticator Form */}
      <div className="flex-1 flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            {/* Local government district branding */}
            <div className="flex items-center gap-3 mb-8 justify-center lg:justify-start">
              <img
                src={logoBanyumas}
                alt="Logo Kabupaten Banyumas"
                className="h-14 w-14 object-contain"
              />
              <div className="text-left">
                <p className="text-base font-bold text-gray-800 leading-tight">SIGAP</p>
                <p className="text-xs text-gray-500">Sistem Infografis Puskesmas</p>
                <p className="text-xs text-gray-500 font-medium tracking-wide">Kabupaten Banyumas</p>
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Selamat datang kembali
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Masuk ke akun SIGAP Anda untuk mengakses dashboard puskesmas.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Alamat Email
              </label>
              <input
                type="email"
                required
                className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-600/20 sm:text-sm transition-shadow"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@email.com"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Kata Sandi
                </label>
              </div>
              <input
                type="password"
                required
                className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-600/20 sm:text-sm transition-shadow"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="mt-8 text-center lg:text-left">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Universitas Telkom Purwokerto. <br className="lg:hidden" />
              Dilindungi hak cipta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

