import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Browser client (cookie-based session storage) so the Next.js middleware can
// read the session server-side and guard /admin and /platform. All importers
// of this module are client components ("use client").
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/**
 * JSON headers including the current user's Supabase access token, for calling
 * internal API routes that require an authenticated session (e.g. email send).
 * Returns just Content-Type when no session is present.
 */
export async function authedHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
