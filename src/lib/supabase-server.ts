import { createClient } from "@supabase/supabase-js";

// Server-only client that uses the service role key (bypasses RLS).
// Lazy singleton — created on first call so build-time evaluation doesn't
// fail when SUPABASE_SERVICE_ROLE_KEY is not yet present in the environment.
// Never import this in client components.
let _admin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _admin;
}
