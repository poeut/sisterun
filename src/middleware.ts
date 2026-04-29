// Middleware Edge — utilise la config minimale (sans Prisma) pour rester Edge-safe.
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const verified = session?.user?.verified;
  const role = session?.user?.role;
  const banned = session?.user?.banned;

  const needsAuth =
    pathname.startsWith("/map") ||
    pathname.startsWith("/runs") ||
    pathname.startsWith("/routes") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin");

  if (needsAuth && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (banned) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "banned");
    return NextResponse.redirect(url);
  }

  // Connectée mais non vérifiée → flow KYC obligatoire
  if (
    session &&
    !verified &&
    !pathname.startsWith("/kyc") &&
    !pathname.startsWith("/api") &&
    pathname !== "/login" &&
    pathname !== "/register" &&
    pathname !== "/"
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/kyc";
    return NextResponse.redirect(url);
  }

  // Admin : seuls ADMIN/MODERATOR
  if (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "MODERATOR") {
    const url = req.nextUrl.clone();
    url.pathname = "/map";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|favicon.ico|uploads|routes|.*\\..*).*)"],
};
