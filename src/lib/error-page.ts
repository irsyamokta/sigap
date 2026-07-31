export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <title>Terjadi Kesalahan — SIGAP</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: system-ui, -apple-system, sans-serif;
        background: #f3f4f6;
        color: #111827;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 1.5rem;
        text-align: center;
      }
      .illustration {
        width: 100%;
        max-width: 320px;
        margin-bottom: 1.75rem;
        opacity: 0.9;
      }
      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 0.5rem;
      }
      p {
        font-size: 0.875rem;
        color: #6b7280;
        max-width: 26rem;
        line-height: 1.6;
        margin-bottom: 1.75rem;
      }
      .actions {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      a, button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        border-radius: 0.5rem;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        border: 1px solid transparent;
        transition: opacity 0.15s;
      }
      a:hover, button:hover { opacity: 0.85; }
      .primary { background: #0ea5e9; color: #fff; }
      .secondary { background: #fff; color: #374151; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <img src="/src/assets/500.svg" alt="Ilustrasi error server" class="illustration" />
    <h1>Terjadi kesalahan pada server</h1>
    <p>Maaf, ada sesuatu yang tidak berjalan dengan baik di sisi kami. Silakan coba lagi atau kembali ke halaman utama.</p>
    <div class="actions">
      <button class="primary" onclick="location.reload()">Coba lagi</button>
      <a class="secondary" href="/">Kembali ke beranda</a>
    </div>
  </body>
</html>`;
}
