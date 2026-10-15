import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  if (!(await verifyToken(request.cookies.get(SESSION_COOKIE)?.value)))
    return NextResponse.redirect(new URL("/admin/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
