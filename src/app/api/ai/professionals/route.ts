import { NextRequest, NextResponse } from "next/server";
import { checkAIAuth, serviceDb } from "@/lib/ai-auth";

export async function POST(req: NextRequest) {
  const authErr = checkAIAuth(req);
  if (authErr) return authErr;

  const { tenant_id } = await req.json();
  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id requerido" }, { status: 400 });
  }

  const { data: professionals, error } = await serviceDb()
    .from("professionals")
    .select("id, name")
    .eq("tenant_id", tenant_id)
    .order("name");

  if (error) {
    return NextResponse.json({ error: "Error al obtener profesionales" }, { status: 500 });
  }

  return NextResponse.json({ professionals: professionals ?? [] });
}
