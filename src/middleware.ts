import { NextResponse, type NextRequest } from "next/server";

// First line of defence for pages. The real checks still happen again on the server in every
// API route and service (see server/session.ts), so this is a convenience, not the only gate.
export function middleware(req: NextRequest) {
  const role = req.cookies.get("sms_role")?.value;
  const student = req.cookies.get("sms_student")?.value;
  const path = req.nextUrl.pathname;

  const ok =
    (path.startsWith("/staff") && role === "staff") || (path.startsWith("/student") && role === "student" && !!student);
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/staff/:path*", "/student/:path*"] };
