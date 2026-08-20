import { createServerFn } from "@tanstack/react-start";
import { setCookie, getCookie, deleteCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "sigap_session";
const SESSION_EXPIRATION_DAYS = 7;

export const loginFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email("Format email tidak valid"),
      password: z.string().min(1, "Password tidak boleh kosong"),
    })
  )
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("Email atau password salah");
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("Email atau password salah");
    }

    // Create session in the database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRATION_DAYS);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt,
      },
    });

    // Set session cookie
    setCookie(SESSION_COOKIE_NAME, session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
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

export const getAuthUserFn = createServerFn({ method: "GET" }).handler(async () => {
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
});
