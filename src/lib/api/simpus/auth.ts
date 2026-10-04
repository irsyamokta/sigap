import { fetchWithTimeout } from "./utils";

let cachedToken: string | null = null;
let cachedTokenExpiresAt: number = 0;

export async function getSimpusToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  const baseUrl =
    process.env.BASE_URL || "https://simpus.banyumaskab.go.id/api_telkom/v1";
  const clientId = process.env.CLIENT_ID || "";
  const clientSecret = process.env.CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    return "fallback-token";
  }

  try {
    const authRes = await fetchWithTimeout(`${baseUrl}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!authRes.ok) return "fallback-token";

    const authJson = await authRes.json();
    const token = authJson?.response?.access_token;
    if (!token) return "fallback-token";

    const remainingSeconds = authJson?.response?.remaining_seconds ?? 3600;
    cachedToken = token;
    cachedTokenExpiresAt = Date.now() + remainingSeconds * 1000;
    return token;
  } catch {
    return "fallback-token";
  }
}
