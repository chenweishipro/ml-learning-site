// i18n 中间件: 把 cookie 中的 locale 暴露给 RSC
import { NextRequest, NextResponse } from "next/server";
import { detectLocale, DEFAULT_LOCALE } from "./lib/i18n/types";

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};

export function middleware(req: NextRequest) {
  const locale = detectLocale(req.cookies.get("ml-site-locale")?.value ?? null);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-ml-site-locale", locale);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
