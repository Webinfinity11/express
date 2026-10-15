import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "em_admin";
const MAX_AGE = 60 * 60 * 24 * 14;

const key = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export async function createSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function verifyToken(token: string | undefined) {
  if (!token || !process.env.AUTH_SECRET) return false;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

/** ყველა ადმინ გვერდი და server action ამას იძახებს; proxy მხოლოდ პირველი ბარიერია. */
export async function requireAdmin() {
  if (!(await verifyToken((await cookies()).get(SESSION_COOKIE)?.value))) redirect("/admin/login");
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}
