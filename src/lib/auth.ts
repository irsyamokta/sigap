import { createServerFn } from "@tanstack/react-start";
import {
  setCookie,
  getCookie,
  deleteCookie,
} from "@tanstack/react-start/server";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "sigap_session";
const SESSION_EXPIRATION_DAYS = 7;

interface RateLimitEntry {
  count: number;
  windowStart: number;
  lockedUntil: number;
}

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_LOCKOUT_MS = 5 * 60 * 1000;

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): void {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  if (!entry) {
    entry = { count: 0, windowStart: now, lockedUntil: 0 };
    rateLimitStore.set(ip, entry);
  }

  if (entry.lockedUntil > now) {
    const remainingSec = Math.ceil((entry.lockedUntil - now) / 1000);
    throw new Error(
      `Terlalu banyak percobaan login. Coba lagi dalam ${remainingSec} detik.`,
    );
  }

  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
    entry.lockedUntil = 0;
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX_ATTEMPTS) {
    entry.lockedUntil = now + RATE_LIMIT_LOCKOUT_MS;
    const remainingSec = Math.ceil(RATE_LIMIT_LOCKOUT_MS / 1000);
    throw new Error(
      `Terlalu banyak percobaan login. Coba lagi dalam ${remainingSec} detik.`,
    );
  }
}

function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
}

const CAPTCHA_TTL_MS = 5 * 60 * 1000;

interface CaptchaEntry {
  code: string;
  expiresAt: number;
}

const captchaStore = new Map<string, CaptchaEntry>();

function generateCaptchaCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateCaptchaToken(): string {
  const array = new Uint8Array(16);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require("crypto") as typeof import("crypto");
    nodeCrypto.randomFillSync(array);
  } catch {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const issueCaptchaFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const now = Date.now();
    for (const [t, entry] of captchaStore) {
      if (entry.expiresAt < now) captchaStore.delete(t);
    }

    const token = generateCaptchaToken();
    const code = generateCaptchaCode();
    captchaStore.set(token, { code, expiresAt: now + CAPTCHA_TTL_MS });

    return { token, code };
  },
);

export const loginFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email("Format email tidak valid"),
      password: z.string().min(1, "Password tidak boleh kosong"),
      captchaToken: z.string().min(1, "Token CAPTCHA wajib diisi"),
      captchaAnswer: z.string().min(1, "Jawaban CAPTCHA wajib diisi"),
    }),
  )
  .handler(async ({ data }) => {
    let ip = "unknown";
    try {
      const req = getWebRequest();
      ip = getClientIp(req);
    } catch {
      // ignore outside request context
    }

    checkRateLimit(ip);

    const captchaEntry = captchaStore.get(data.captchaToken);
    if (captchaEntry) captchaStore.delete(data.captchaToken);

    if (!captchaEntry || captchaEntry.expiresAt < Date.now()) {
      throw new Error(
        "Sesi CAPTCHA tidak valid atau sudah kedaluwarsa. Silakan muat ulang CAPTCHA.",
      );
    }

    if (
      data.captchaAnswer.toUpperCase().trim() !==
      captchaEntry.code.toUpperCase()
    ) {
      throw new Error("Kode CAPTCHA tidak sesuai. Silakan coba lagi.");
    }

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("Email atau password salah");
    }

    const isValidPassword = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );
    if (!isValidPassword) {
      throw new Error("Email atau password salah");
    }

    resetRateLimit(ip);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRATION_DAYS);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt,
      },
    });

    const isProduction = process.env.NODE_ENV === "production";
    setCookie(SESSION_COOKIE_NAME, session.id, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: SESSION_EXPIRATION_DAYS * 24 * 60 * 60,
    });

    return { success: true };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const sessionId = getCookie(SESSION_COOKIE_NAME);

  if (sessionId) {
    await prisma.session.deleteMany({
      where: { id: sessionId },
    });
  }

  deleteCookie(SESSION_COOKIE_NAME);
  return { success: true };
});

export const getAuthUserFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const sessionId = getCookie(SESSION_COOKIE_NAME);

    if (!sessionId) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            puskesmasCode: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Remove session if expired
    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    return session.user;
  },
);
