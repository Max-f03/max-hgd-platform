import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  // Lecture optimiste du cookie de session NextAuth v5
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value

  const isLoggedIn = !!sessionToken
  const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard")
  const isOnLogin = request.nextUrl.pathname === "/login"

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isOnLogin && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
