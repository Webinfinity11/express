import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, UI_COOKIE, verifyToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  if (!(await verifyToken(request.cookies.get(SESSION_COOKIE)?.value)))
    return NextResponse.redirect(new URL("/admin/login", request.url));
  const res = NextResponse.next();
  // ძველი სესიებისთვისაც: საიტზე „რედაქტირების“ ღილაკი
  if (!request.cookies.has(UI_COOKIE)) res.cookies.set(UI_COOKIE, "1", { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14 });
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
