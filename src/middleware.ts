import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase-middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Run only on the protected app areas (keeps public pages, API routes and the
// booking flow untouched). Static assets are excluded by the matcher.
export const config = {
  matcher: ["/admin/:path*", "/platform/:path*"],
};
