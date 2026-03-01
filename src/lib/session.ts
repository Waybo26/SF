import { cookies } from "next/headers";

const COOKIE_NAME = "sf_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionData {
  userId: string;
  role: string;
  name: string;
  email: string;
}

/**
 * Set the session cookie with user data.
 * Call this from API route handlers (server-side only).
 */
export async function setSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Read the session cookie and return parsed user data.
 * Returns null if no valid session exists.
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    const data = JSON.parse(cookie.value) as SessionData;
    if (data.userId && data.role) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear the session cookie (logout).
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
