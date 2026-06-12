import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require an authenticated session (server-side guard /
// defense-in-depth on top of RLS and the client-side layout checks).
const PROTECTED_PREFIXES = ["/admin", "/platform"];

/**
 * Refreshes the Supabase auth session from cookies and, for protected routes,
 * redirects unauthenticated requests to /login. Must return the response object
 * it builds so refreshed auth cookies propagate back to the browser.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // If env isn't configured (e.g. build-time), don't block.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Use getSession() (local cookie read, no network round-trip) to avoid
  // middleware timeouts on Vercel Edge (~1.5 s limit). RLS is the authoritative
  // security layer; this guard is defense-in-depth for the UI only.
  const { data: { session } } = await supabase.auth.getSession();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

  if (isProtected && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = `?redirect=${encodeURIComponent(path)}`;
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
