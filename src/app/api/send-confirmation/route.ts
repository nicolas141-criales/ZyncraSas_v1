import { NextRequest, NextResponse } from "next/server";

const MONTHS_ES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];
const DAYS_ES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_ES[dt.getDay()]} ${d} de ${MONTHS_ES[m - 1]} de ${y}`;
}

function to12h(t: string) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function emailHTML({
  clientName, businessName, service, professional,
  date, time, primaryColor, secondaryColor, cancelUrl, rescheduleUrl,
}: {
  clientName: string; businessName: string; service: string; professional: string;
  date: string; time: string; primaryColor: string; secondaryColor: string;
  cancelUrl: string; rescheduleUrl: string;
}) {
  const rows = [
    ["Servicio",     service      ],
    ["Profesional",  professional ],
    ["Fecha",        formatDate(date)],
    ["Hora",         to12h(time)  ],
  ]
    .map(([label, value]) => `
      <tr>
        <td style="padding:8px 0;color:#6b6b80;font-size:13px;font-weight:600;width:110px;vertical-align:top">${label}</td>
        <td style="padding:8px 0;color:#111118;font-size:14px;font-weight:500;text-transform:${label === "Fecha" ? "capitalize" : "none"}">${value}</td>
      </tr>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f9;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.09)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,${primaryColor},${secondaryColor});padding:32px 36px;text-align:center">
      <div style="font-size:28px;margin-bottom:8px">✓</div>
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px">¡Cita confirmada!</h1>
      <p style="color:rgba(255,255,255,.8);margin:6px 0 0;font-size:14px">${businessName}</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 36px">
      <p style="margin:0 0 20px;font-size:15px;color:#111118">Hola <strong>${clientName}</strong>, tu reserva ha sido registrada con éxito.</p>

      <!-- Summary -->
      <div style="background:#f7f5f2;border-radius:12px;padding:16px 20px;margin-bottom:28px">
        <table style="width:100%;border-collapse:collapse">${rows}</table>
      </div>

      <!-- CTA -->
      <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#6b6b80;text-transform:uppercase;letter-spacing:.06em">Gestiona tu cita</p>
      <a href="${rescheduleUrl}"
        style="display:block;text-align:center;background:linear-gradient(135deg,${primaryColor},${secondaryColor});color:#fff;padding:14px 24px;border-radius:11px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:10px">
        📅 Reagendar cita
      </a>
      <a href="${cancelUrl}"
        style="display:block;text-align:center;background:#fff;color:#64748b;padding:13px 24px;border-radius:11px;text-decoration:none;font-weight:600;font-size:14px;border:1.5px solid #e8e6e2">
        Cancelar cita
      </a>

      <p style="margin:22px 0 0;font-size:12px;color:#b0b0c0;text-align:center">
        Estos botones funcionan hasta el día de tu cita.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f7f5f2;padding:16px 36px;text-align:center;border-top:1px solid #e8e6e2">
      <p style="margin:0;font-size:12px;color:#a0a0b0">Reservas gestionadas por <strong>Zyncra</strong></p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email, clientName, businessName,
      service, professional, date, time,
      primaryColor = "#fb0f05", secondaryColor = "#0027fe",
      manageToken,
    } = body;

    if (!email || !manageToken) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Email not configured — skip silently in dev
      return NextResponse.json({ ok: true, skipped: true });
    }

    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://zyncra.app").replace(/\/$/, "");
    const cancelUrl     = `${base}/manage/${manageToken}?action=cancel`;
    const rescheduleUrl = `${base}/manage/${manageToken}?action=reschedule`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "Zyncra <bookings@zyncra.app>",
        to: email,
        subject: `Cita confirmada — ${businessName}`,
        html: emailHTML({ clientName, businessName, service, professional, date, time, primaryColor, secondaryColor, cancelUrl, rescheduleUrl }),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return NextResponse.json({ error: err }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("send-confirmation error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
