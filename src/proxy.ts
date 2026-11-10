import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, UI_COOKIE, verifyToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ადმინი — შესვლის შემოწმება
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) return NextResponse.next();
    if (!(await verifyToken(request.cookies.get(SESSION_COOKIE)?.value)))
      return NextResponse.redirect(new URL("/admin/login", request.url));
    const res = NextResponse.next();
    // ძველი სესიებისთვისაც: საიტზე „რედაქტირების“ ღილაკი
    if (!request.cookies.has(UI_COOKIE)) res.cookies.set(UI_COOKIE, "1", { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14 });
    return res;
  }

  // ენები: /en/... — ინგლისური; /ka/... → პრეფიქსის გარეშე; დანარჩენი — ქართული (შიგნით /ka/...)
  if (pathname === "/en" || pathname.startsWith("/en/")) return NextResponse.next();
  if (pathname === "/ka" || pathname.startsWith("/ka/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  const url = request.nextUrl.clone();
  url.pathname = `/ka${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // API, Next-ის ფაილები და სტატიკური ფაილები (წერტილით) არ გადის
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
