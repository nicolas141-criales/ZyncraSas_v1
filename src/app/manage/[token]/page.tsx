import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import ManageClient from "./ManageClient";

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // Service role required (server component): reads appointment-by-token which
  // anon cannot access under hardened RLS. No anon fallback.
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
) as any;

type Params = Promise<{ token: string }>;

export default async function ManagePage({ params }: { params: Params }) {
  const { token } = await params;

  const { data: appt } = await db()
    .from("appointments")
    .select(`
      id, status, appointment_date, appointment_time, manage_token, tenant_id, professional_id,
      clients(name, email, phone),
      services(name, duration_minutes),
      professionals(name, schedule)
    `)
    .eq("manage_token", token)
    .maybeSingle();

  if (!appt) notFound();

  const [{ data: tenant }, { data: branding }] = await Promise.all([
    db().from("tenants").select("name, settings").eq("id", appt.tenant_id).maybeSingle(),
    db().from("branding").select("business_name, primary_color, secondary_color, logo_url").eq("tenant_id", appt.tenant_id).maybeSingle(),
  ]);

  return <ManageClient token={token} appt={appt} tenant={tenant} branding={branding} />;
}
