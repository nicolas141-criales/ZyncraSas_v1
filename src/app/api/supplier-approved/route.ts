import { NextRequest, NextResponse } from "next/server";
import { escapeHtml, requireInternalOrUser, rateLimit, clientIp, tooManyRequests } from "@/lib/api-auth";

const F = "'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif";
const GRAD = "linear-gradient(90deg,#fb0f05 0%,#0027fe 100%)";

function wrap(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    @media only screen and (max-width:600px){
      .ew{padding:16px 8px!important}
      .ec{border-radius:16px!important}
      .ep{padding-left:20px!important;padding-right:20px!important}
      .btn{width:100%!important;display:block!important;box-sizing:border-box!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0eff8;font-family:${F};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0eff8;">
    <tr><td align="center" class="ew" style="padding:36px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="ec"
             style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(20,15,30,0.08);">
        <tr><td style="height:7px;background:${GRAD};font-size:0;line-height:0;">&nbsp;</td></tr>
        ${content}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function approvedHtml({ companyName, email, portalUrl }: {
  companyName: string; email: string; portalUrl: string;
}) {
  return wrap(`
    <!-- Header -->
    <tr>
      <td style="padding:28px 32px 0;" class="ep">
        <div style="display:inline-flex;align-items:center;gap:6px;margin-bottom:20px;">
          <img src="https://zyncra.app/zyncra-icon.png" alt="Z" width="20" height="20"
               style="width:20px;height:20px;border-radius:4px;display:block;">
          <span style="font-size:14px;font-weight:800;color:#14111C;font-family:${F};">Zyncra</span>
        </div>
        <div style="display:inline-block;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:6px 12px;margin-bottom:16px;">
          <span style="font-size:11px;font-weight:700;color:#065f46;letter-spacing:0.08em;text-transform:uppercase;font-family:${F};">✓ Cuenta aprobada</span>
        </div>
        <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#14111C;letter-spacing:-0.03em;line-height:1.2;font-family:${F};">
          ¡Bienvenido al portal de proveedores!
        </h1>
        <p style="margin:0;font-size:15px;color:#564E66;line-height:1.55;font-family:${F};">
          Hola <strong style="color:#14111C;">${companyName}</strong>, tu solicitud fue revisada y aprobada. Ya puedes acceder a tu portal de proveedor en Zyncra.
        </p>
      </td>
    </tr>

    <!-- Datos de acceso -->
    <tr>
      <td style="padding:22px 32px;" class="ep">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="background:#f8f7ff;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#8E879B;text-transform:uppercase;letter-spacing:0.08em;font-family:${F};">Tus datos de acceso</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;font-size:12px;font-weight:700;color:#8E879B;text-transform:uppercase;letter-spacing:0.06em;font-family:${F};border-top:1px solid #ece9f8;">Correo</td>
                <td style="padding:8px 0;font-size:14px;font-weight:700;color:#14111C;text-align:right;font-family:${F};border-top:1px solid #ece9f8;">${email}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-size:12px;font-weight:700;color:#8E879B;text-transform:uppercase;letter-spacing:0.06em;font-family:${F};border-top:1px solid #ece9f8;">Contraseña</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;color:#564E66;text-align:right;font-family:${F};border-top:1px solid #ece9f8;">La que creaste al registrarte</td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:0 32px 28px;" class="ep">
        <a href="${portalUrl}" class="btn"
           style="display:block;background:linear-gradient(135deg,#fb0f05 0%,#0027fe 100%);color:#ffffff;
                  text-decoration:none;text-align:center;padding:15px 24px;border-radius:12px;
                  font-size:15px;font-weight:700;letter-spacing:-0.01em;font-family:${F};">
          Ingresar a mi portal →
        </a>
        <p style="margin:14px 0 0;text-align:center;font-size:13px;color:#8E879B;font-family:${F};">
          O ve directamente a <a href="${portalUrl}" style="color:#0027fe;text-decoration:none;font-weight:600;">${portalUrl}</a>
        </p>
      </td>
    </tr>

    <!-- Próximos pasos -->
    <tr>
      <td style="padding:0 32px 28px;" class="ep">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#8E879B;text-transform:uppercase;letter-spacing:0.08em;font-family:${F};">Qué puedes hacer ahora</p>
        ${[
          ["📦", "Agrega tu catálogo de productos con precios y fotos"],
          ["🛒", "Recibe pedidos de cientos de negocios de belleza"],
          ["💳", "Gestiona pagos y confirma despachos desde el portal"],
        ].map(([icon, text]) => `
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
            <span style="font-size:18px;flex-shrink:0;">${icon}</span>
            <span style="font-size:13px;color:#564E66;line-height:1.5;font-family:${F};">${text}</span>
          </div>`).join("")}
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="border-top:1px solid #f0eff8;padding:16px 32px;text-align:center;">
        <span style="font-size:12px;color:#b0adb8;font-family:${F};">
          Portal de proveedores de &nbsp;
        </span>
        <a href="https://zyncra.app" style="text-decoration:none;">
          <span style="font-size:12px;font-weight:800;color:#564E66;font-family:${F};">Zyncra</span>
        </a>
        <span style="font-size:12px;color:#b0adb8;font-family:${F};">&nbsp;· Colombia</span>
      </td>
    </tr>
  `);
}

function pendingHtml({ companyName, email }: { companyName: string; email: string }) {
  return wrap(`
    <tr>
      <td style="padding:28px 32px 0;" class="ep">
        <div style="display:inline-flex;align-items:center;gap:6px;margin-bottom:20px;">
          <img src="https://zyncra.app/zyncra-icon.png" alt="Z" width="20" height="20"
               style="width:20px;height:20px;border-radius:4px;display:block;">
          <span style="font-size:14px;font-weight:800;color:#14111C;font-family:${F};">Zyncra</span>
        </div>
        <div style="display:inline-block;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:6px 12px;margin-bottom:16px;">
          <span style="font-size:11px;font-weight:700;color:#92400e;letter-spacing:0.08em;text-transform:uppercase;font-family:${F};">⏳ Solicitud recibida</span>
        </div>
        <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#14111C;letter-spacing:-0.03em;line-height:1.2;font-family:${F};">
          Recibimos tu solicitud
        </h1>
        <p style="margin:0;font-size:15px;color:#564E66;line-height:1.55;font-family:${F};">
          Hola <strong style="color:#14111C;">${companyName}</strong>, registramos tu solicitud para unirte como proveedor de Zyncra. Nuestro equipo la revisará en máximo <strong style="color:#14111C;">48 horas hábiles</strong>.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:22px 32px;" class="ep">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="background:#f8f7ff;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#8E879B;text-transform:uppercase;letter-spacing:0.06em;font-family:${F};">Correo registrado</p>
            <p style="margin:0;font-size:14px;font-weight:700;color:#14111C;font-family:${F};">${email}</p>
          </td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 28px;" class="ep">
        ${[
          "Revisaremos tu información y documentación",
          "Verificaremos tu empresa y categorías de productos",
          "Recibirás un correo de confirmación cuando seas aprobado",
        ].map((step, i) => `
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
            <div style="width:22px;height:22px;border-radius:50%;background:#f3f0ff;border:1px solid #c4b5fd;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <span style="font-size:11px;font-weight:800;color:#7c3aed;">${i + 1}</span>
            </div>
            <span style="font-size:13px;color:#564E66;line-height:1.5;font-family:${F};">${step}</span>
          </div>`).join("")}
      </td>
    </tr>
    <tr>
      <td style="border-top:1px solid #f0eff8;padding:16px 32px;text-align:center;">
        <span style="font-size:12px;color:#b0adb8;font-family:${F};">Portal de proveedores de &nbsp;</span>
        <a href="https://zyncra.app" style="text-decoration:none;">
          <span style="font-size:12px;font-weight:800;color:#564E66;font-family:${F};">Zyncra</span>
        </a>
      </td>
    </tr>
  `);
}

export async function POST(req: NextRequest) {
  try {
    const authErr = await requireInternalOrUser(req);
    if (authErr) return authErr;

    if (!rateLimit(`supplier-notify:${clientIp(req)}`, 20, 60_000)) return tooManyRequests();

    const { companyName, email, type = "approved" } = await req.json() as {
      companyName: string;
      email: string;
      type?: "approved" | "pending";
    };

    if (!email || !companyName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: true, skipped: true });

    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://zyncra.app").replace(/\/$/, "");
    const portalUrl = `${base}/login`;

    const safeName = escapeHtml(companyName);
    const safeEmail = escapeHtml(email);

    const html = type === "approved"
      ? approvedHtml({ companyName: safeName, email: safeEmail, portalUrl })
      : pendingHtml({ companyName: safeName, email: safeEmail });

    const subject = type === "approved"
      ? "✓ Tu cuenta de proveedor fue aprobada — Zyncra"
      : "Solicitud recibida — Portal de Proveedores Zyncra";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "Zyncra <bookings@zyncra.app>",
        to: email,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend supplier notify error:", err);
      return NextResponse.json({ error: err }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("supplier-approved error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
