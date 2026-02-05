/**
 * Next Middleware
 *
 * Temporarily passes through all requests
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Match all paths except API, static files, etc.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
