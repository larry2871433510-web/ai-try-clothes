import { NextRequest, NextResponse } from "next/server";
import { adminSessionCookieName, verifyAdminSession } from "@/lib/auth/session";

const protectedPages = ["/try-on", "/history", "/admin", "/tasks"];
const protectedApiPrefixes = ["/api/upload", "/api/try-on", "/api/tasks", "/api/models", "/api/dev/fashn-health"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/api/dev/fashn-health" && process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Not found"
        }
      },
      { status: 404 }
    );
  }

  const session = await verifyAdminSession(request.cookies.get(adminSessionCookieName)?.value);

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/try-on", request.url));
  }

  if (isProtectedPage(pathname) && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isProtectedApi(pathname) && !session) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "请先登录"
        }
      },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

function isProtectedPage(pathname: string) {
  return protectedPages.some((page) => pathname === page || pathname.startsWith(`${page}/`));
}

function isProtectedApi(pathname: string) {
  return protectedApiPrefixes.some((api) => pathname === api || pathname.startsWith(`${api}/`));
}

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/mock") ||
    pathname.startsWith("/uploads") ||
    pathname === "/favicon.ico" ||
    /\.(?:png|jpg|jpeg|webp|svg|ico|css|js|map|txt)$/.test(pathname)
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
