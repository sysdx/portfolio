import { NextResponse, type NextRequest } from "next/server";
import { adminEnabled } from "./lib/guard";

export function proxy(request: NextRequest) {
  if (!adminEnabled()) {
    return new NextResponse("Not found", { status: 404 });
  }
  // Phase 2: check the Supabase session here and redirect to /admin/sign-in when missing.
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/tasks/:path*"],
};
