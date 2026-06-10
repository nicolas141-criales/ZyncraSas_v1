import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { serviceDb } from "@/lib/ai-auth";
import { processMessage } from "./message-processor";

export const maxDuration = 300;

// ── Route handlers ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const sp        = req.nextUrl.searchParams;
  const mode      = sp.get("hub.mode");
  const challenge = sp.get("hub.challenge");
  const token     = sp.get("hub.verify_token");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  let phone         = "";
  let text          = "";
  let waMessageId   = "";
  let phoneNumberId = "";
  let tenantId      = "";
  let accessToken   = "";

  try {
    const body  = await req.json();
    const value = body?.entry?.[0]?.changes?.[0]?.value;

    if (!value?.messages?.length) return NextResponse.json({ ok: true });

    const msg = value.messages[0];
    if (msg.type !== "text") return NextResponse.json({ ok: true });

    phone         = msg.from         as string;
    waMessageId   = msg.id           as string;
    phoneNumberId = value.metadata?.phone_number_id as string;
    text          = (msg.text?.body ?? "") as string;

    if (!text.trim()) return NextResponse.json({ ok: true });

    const db = serviceDb();
    const { data: config } = await db
      .from("whatsapp_config")
      .select("tenant_id, access_token")
      .eq("phone_number_id", phoneNumberId)
      .maybeSingle();

    if (config) {
      tenantId    = (config as any).tenant_id;
      accessToken = (config as any).access_token ?? process.env.WHATSAPP_ACCESS_TOKEN ?? "";
    } else {
      // Fallback: tenant_id from query param — validate it actually exists
      const fallbackId = req.nextUrl.searchParams.get("tenant_id") ?? "";
      if (fallbackId) {
        const { data: tenant } = await db
          .from("tenants").select("id").eq("id", fallbackId).maybeSingle();
        if (!tenant) {
          console.error("[webhook] tenant not found for fallback id:", fallbackId);
          return NextResponse.json({ ok: true });
        }
        tenantId    = fallbackId;
        accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
      }
    }

    if (!tenantId) {
      console.error("[webhook] no tenant resolved for phone_number_id:", phoneNumberId);
      return NextResponse.json({ ok: true });
    }
  } catch (e) {
    console.error("[webhook] parse error:", e);
    return NextResponse.json({ ok: true });
  }

  // after() keeps the function alive until processMessage completes (even after 200 is sent)
  const params = { phone, text, waMessageId, phoneNumberId, tenantId, accessToken };
  after(async () => {
    try {
      await processMessage(params);
    } catch (e) {
      console.error("[webhook] processMessage error:", e);
    }
  });

  return NextResponse.json({ ok: true });
}
