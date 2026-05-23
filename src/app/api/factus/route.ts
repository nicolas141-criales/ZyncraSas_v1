import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FACTUS_BASE = {
  sandbox: "https://api-sandbox.factus.com.co",
  production: "https://api.factus.com.co",
};

async function getFactusToken(settings: any): Promise<string> {
  const base = FACTUS_BASE[settings.environment as "sandbox" | "production"] ?? FACTUS_BASE.sandbox;
  const res = await fetch(`${base}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: settings.factus_client_id,
      client_secret: settings.factus_client_secret,
      username: settings.factus_username,
      password: settings.factus_password,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Factus auth failed: ${err}`);
  }
  const data = await res.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, invoiceData, supabaseToken, tenantId } = body;

    // Build supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${supabaseToken}` } } }
    );

    // Load tenant's Factus settings
    const { data: settings, error: settingsErr } = await supabase
      .from("invoice_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (settingsErr || !settings) {
      return NextResponse.json({ error: "Configura las credenciales Factus primero." }, { status: 400 });
    }
    if (!settings.factus_client_id || !settings.factus_username) {
      return NextResponse.json({ error: "Credenciales Factus incompletas." }, { status: 400 });
    }

    const base = FACTUS_BASE[settings.environment as "sandbox" | "production"] ?? FACTUS_BASE.sandbox;
    const token = await getFactusToken(settings);

    // ── Test connection ──
    if (action === "test") {
      return NextResponse.json({ ok: true, message: "Conexión con Factus exitosa." });
    }

    // ── Create invoice ──
    if (action === "create") {
      const { customer, items, paymentMethod, notes } = invoiceData;

      const factusItems = items.map((item: any, i: number) => ({
        code_reference: `ITEM${String(i + 1).padStart(3, "0")}`,
        name: item.name,
        quantity: item.quantity,
        discount_rate: 0,
        price: item.price,
        tax_rate: item.tax_rate || "0.00",
        unit_measure_id: 70,
        standard_code_id: 10,
        is_excluded: item.is_excluded ?? 1,
      }));

      const factusPayload = {
        document_id: 1,
        numbering_range_id: settings.numbering_range_id,
        reference_code: `FAC-${Date.now()}`,
        observation: notes || "",
        payment_method_code: paymentMethod || "10",
        customer: {
          identification_document_id: customer.id_type,
          identification: customer.id_number,
          names: customer.name,
          surnames: customer.surname || "",
          company: customer.company || "",
          trade_name: customer.company || "",
          address: customer.address || "",
          email: customer.email || "",
          phone: customer.phone || "",
          municipality_id: customer.municipality_id || settings.municipality_id || 149,
        },
        items: factusItems,
      };

      const factusRes = await fetch(`${base}/v1/bills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(factusPayload),
      });

      const factusData = await factusRes.json();

      if (!factusRes.ok) {
        // Save as rejected draft
        const subtotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
        await supabase.from("invoices").insert({
          tenant_id: tenantId,
          status: "rejected",
          customer_name: customer.name,
          customer_id_type: customer.id_type,
          customer_id: customer.id_number,
          customer_email: customer.email,
          customer_address: customer.address,
          customer_phone: customer.phone,
          municipality_id: customer.municipality_id,
          payment_method: paymentMethod,
          subtotal,
          tax_total: 0,
          total: subtotal,
          factus_response: factusData,
          notes,
        });
        return NextResponse.json({ error: factusData?.message || "Error en Factus.", detail: factusData }, { status: 422 });
      }

      const bill = factusData?.data ?? factusData;
      const subtotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      const taxTotal = items.reduce((s: number, i: any) => {
        const rate = parseFloat(i.tax_rate) || 0;
        return s + (i.price * i.quantity * rate) / 100;
      }, 0);
      const total = subtotal + taxTotal;

      const { data: invoice } = await supabase.from("invoices").insert({
        tenant_id: tenantId,
        factus_id: String(bill.id ?? ""),
        cufe: bill.cufe ?? bill.uuid ?? "",
        number: bill.number ?? bill.bill_number ?? "",
        status: "sent",
        customer_name: customer.name,
        customer_id_type: customer.id_type,
        customer_id: customer.id_number,
        customer_email: customer.email,
        customer_address: customer.address,
        customer_phone: customer.phone,
        municipality_id: customer.municipality_id,
        payment_method: paymentMethod,
        subtotal,
        tax_total: taxTotal,
        total,
        pdf_url: bill.pdf_download_url ?? bill.pdf_url ?? null,
        factus_response: factusData,
        notes,
      }).select().single();

      if (invoice) {
        await supabase.from("invoice_items").insert(
          items.map((item: any) => ({
            invoice_id: invoice.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            tax_rate: item.tax_rate || "0.00",
            is_excluded: item.is_excluded ?? 1,
            total: item.price * item.quantity,
          }))
        );
      }

      return NextResponse.json({
        ok: true,
        cufe: bill.cufe ?? bill.uuid,
        number: bill.number ?? bill.bill_number,
        pdf_url: bill.pdf_download_url ?? bill.pdf_url,
        invoice_id: invoice?.id,
      });
    }

    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Error interno." }, { status: 500 });
  }
}
