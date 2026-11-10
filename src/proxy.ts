import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, readSession } from "@/lib/auth";

/** Το /admin θέλει σύνδεση. Εδώ ελέγχεται μόνο η υπογραφή του cookie· ο χρήστης στη βάση ελέγχεται στη σελίδα. */
export async function proxy(request: NextRequest) {
  if (await readSession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
