import { CACHE_TTL_TODAY, CACHE_TTL_PAST } from "./config";

export function getCacheTTL(dateStr: string): number {
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  return dateStr >= todayStr ? CACHE_TTL_TODAY : CACHE_TTL_PAST;
}

export async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let index = 0;

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (index < items.length) {
        const currentIndex = index++;
        results[currentIndex] = await fn(items[currentIndex]);
      }
    },
  );

  await Promise.all(workers);
  return results;
}

export function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 6000,
): Promise<Response> {
  const controller = new AbortController();

  const timeoutPromise = new Promise<never>((_, reject) => {
    const t = setTimeout(() => {
      controller.abort();
      reject(new Error(`Timeout ${timeoutMs}ms Exceeded: ${url}`));
    }, timeoutMs);
    if (t && typeof t === "object" && "unref" in t) {
      (t as unknown as { unref: () => void }).unref();
    }
  });

  return Promise.race([
    fetch(url, { ...options, signal: controller.signal }),
    timeoutPromise,
  ]);
}
