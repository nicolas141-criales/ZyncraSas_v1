import { NextRequest, NextResponse } from "next/server";
import { checkAIAuth } from "@/lib/ai-auth";
import { processMessage } from "../webhook/message-processor";

export const maxDuration = 300;

// Internal endpoint — called by /api/whatsapp/webhook
// Runs in its own request context so the 5-min agent loop completes
export async function POST(req: NextRequest) {
  const authErr = checkAIAuth(req);
  if (authErr) return authErr;

  const { phone, text, phoneNumberId, tenantId, accessToken } = await req.json();
  if (!phone || !text || !tenantId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  try {
    await processMessage({ phone, text, phoneNumberId, tenantId, accessToken });
  } catch (e) {
    console.error("[process] error:", e);
  }

  return NextResponse.json({ ok: true });
}
