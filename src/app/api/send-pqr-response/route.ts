import { NextRequest, NextResponse } from "next/server";
import { escapeHtml, requireInternalOrUser, rateLimit, clientIp, tooManyRequests } from "@/lib/api-auth";

const F = "'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif";

const TYPE_META: Record<string, { label: string; color: string; grad: string }> = {
  peticion:     { label: "Petición",     color: "#2563eb", grad: "linear-gradient(90deg,#3b82f6 0%,#60a5fa 100%)" },
  queja:        { label: "Queja",        color: "#dc2626", grad: "linear-gradient(90deg,#ef4444 0%,#fb923c 100%)" },
  reclamo:      { label: "Reclamo",      color: "#d97706", grad: "linear-gradient(90deg,#f59e0b 0%,#fbbf24 100%)" },
  sugerencia:   { label: "Sugerencia",   color: "#7c3aed", grad: "linear-gradient(90deg,#8b5cf6 0%,#a78bfa 100%)" },
  felicitacion: { label: "Felicitación", color: "#059669", grad: "linear-gradient(90deg,#10b981 0%,#34d399 100%)" },
};

function buildEmailHtml({
  submitterName,
  subject,
  description,
  pqrType,
  responseText,
}: {
  submitterName: string;
  subject: string;
  description: string;
  pqrType: string;
  responseText: string;
}) {
  const meta = TYPE_META[pqrType] ?? TYPE_META.queja;
  const greeting = submitterName ? `Hola <strong style="color:#14111C;">${submitterName}</strong>,` : "Hola,";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @media only screen and (max-width:600px){
      .ew{padding:16px 8px!important}
      .ec{border-radius:16px!important}
      .ep{padding-left:20px!important;padding-right:20px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0eff8;font-family:${F};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0eff8;">
    <tr><td align="center" class="ew" style="padding:36px 16px;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             class="ec"
             style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(20,15,30,0.08);">

        <!-- Cinta de color por tipo -->
        <tr>
          <td style="height:7px;background:${meta.grad};font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Logo + negocio -->
        <tr>
          <td style="padding:20px 32px 0;" class="ep">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:middle;padding-right:6px;">
                        <img src="https://zyncra.app/zyncra-icon.png" alt="Z"
                             width="18" height="18"
                             style="width:18px;height:18px;border-radius:4px;display:block;">
                      </td>
                      <td style="vertical-align:middle;">
                        <span style="font-size:13px;font-weight:800;color:#14111C;letter-spacing:-0.01em;font-family:${F};">Zyncra</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="right">
                  <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.04em;font-family:${F};background:${meta.color}18;color:${meta.color};">
                    ${meta.label}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Heading -->
        <tr>
          <td style="padding:22px 32px 0;" class="ep">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:#8E879B;font-family:${F};">Respuesta a tu PQR</p>
            <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#14111C;letter-spacing:-0.03em;line-height:1.2;font-family:${F};">${subject}</h1>
            <p style="margin:0;font-size:15px;color:#564E66;line-height:1.6;font-family:${F};">${greeting} hemos revisado tu ${meta.label.toLowerCase()} y queremos darte una respuesta.</p>
          </td>
        </tr>

        <!-- Respuesta del equipo -->
        <tr>
          <td style="padding:22px 32px;" class="ep">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f8f7fc;border-radius:12px;padding:20px 22px;border-left:4px solid ${meta.color};">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8E879B;font-family:${F};">Nuestra respuesta</p>
                  <p style="margin:0;font-size:15px;color:#14111C;line-height:1.7;white-space:pre-wrap;font-family:${F};">${responseText}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- PQR original (colapsado visualmente) -->
        <tr>
          <td style="padding:0 32px 28px;" class="ep">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-top:1px solid #f0eff8;padding-top:16px;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#b0adb8;font-family:${F};">Tu mensaje original</p>
                  <p style="margin:0;font-size:13px;color:#8E879B;line-height:1.65;white-space:pre-wrap;font-family:${F};">${description}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid #f0eff8;padding:16px 32px;text-align:center;">
            <span style="font-size:12px;color:#b0adb8;font-family:${F};">
              Gestionado con &nbsp;
            </span>
            <a href="https://zyncra.app" style="text-decoration:none;">
              <span style="font-size:12px;font-weight:800;color:#564E66;font-family:${F};">Zyncra</span>
            </a>
            <span style="font-size:12px;color:#b0adb8;font-family:${F};">&nbsp;· Este correo es una respuesta a tu PQR</span>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const authErr = await requireInternalOrUser(req);
    if (authErr) return authErr;

    if (!rateLimit(`send-pqr-response:${clientIp(req)}`, 20, 60_000)) return tooManyRequests();

    const body = await req.json() as {
      to: string;
      submitterName?: string;
      subject: string;
      description: string;
      pqrType: string;
      responseText: string;
    };

    const { to, submitterName = "", subject, description, pqrType, responseText } = body;

    if (!to || !subject || !responseText) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (responseText.length > 4000) {
      return NextResponse.json({ error: "Respuesta demasiado larga" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: true, skipped: true, reason: "No RESEND_API_KEY" });
    }

    const html = buildEmailHtml({
      submitterName: escapeHtml(submitterName),
      subject: escapeHtml(subject),
      description: escapeHtml(description),
      pqrType,
      responseText: escapeHtml(responseText),
    });

    const emailSubject = `Respuesta a tu ${TYPE_META[pqrType]?.label ?? "PQR"}: ${subject.replace(/[\r\n]+/g, " ").slice(0, 60)}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "Zyncra <bookings@zyncra.app>",
        to,
        subject: emailSubject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend PQR error:", err);
      return NextResponse.json({ error: "Error al enviar el correo" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("send-pqr-response error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
