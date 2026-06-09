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

const FONT = "'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif";
const GRAD = "linear-gradient(135deg,#fb0f05 0%,#0027fe 100%)";

function appointmentRows(service: string, professional: string, date: string, time: string) {
  return [
    ["Servicio",    service],
    ["Profesional", professional],
    ["Fecha",       formatDate(date)],
    ["Hora",        to12h(time)],
  ].map(([label, value], i) => `
    <tr>
      <td style="padding:10px 0;font-size:13px;font-weight:600;color:#8E879B;
                 ${i > 0 ? "border-top:1px solid #e8e6e2;" : ""}
                 font-family:${FONT};">${label}</td>
      <td style="padding:10px 0;font-size:14px;font-weight:700;color:#14111C;
                 text-align:right;
                 ${i > 0 ? "border-top:1px solid #e8e6e2;" : ""}
                 font-family:${FONT};">${value}</td>
    </tr>`).join("");
}

function emailHTML({
  clientName, businessName, service, professional,
  date, time, primaryColor, cancelUrl, rescheduleUrl,
}: {
  clientName: string; businessName: string; service: string; professional: string;
  date: string; time: string; primaryColor: string;
  cancelUrl: string; rescheduleUrl: string;
}) {
  const headerBg = primaryColor || "#14111C";
  const rows = appointmentRows(service, professional, date, time);

  return buildEmailWrapper(headerBg, `
    <!-- Header -->
    <tr>
      <td class="eh"
          style="background:${headerBg};padding:28px 32px 22px;text-align:center;">
        <div style="font-size:32px;margin-bottom:8px;">✓</div>
        <h1 style="margin:0 0 4px;font-size:21px;font-weight:800;color:#ffffff;
                   letter-spacing:-0.03em;font-family:${FONT};">
          ¡Cita confirmada!
        </h1>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);
                  font-family:${FONT};">${businessName}</p>
      </td>
    </tr>
    ${gradientBar()}
    <!-- Body -->
    <tr>
      <td class="eb" style="padding:28px 32px 24px;">
        <p style="margin:0 0 20px;font-size:16px;font-weight:600;color:#14111C;font-family:${FONT};">
          Hola, <strong>${clientName}</strong> 👋<br>
          <span style="font-weight:400;color:#564E66;font-size:15px;">
            Tu reserva ha sido registrada con éxito.
          </span>
        </p>
        ${appointmentCard(rows)}
        ${ctaButtons(rescheduleUrl, cancelUrl)}
      </td>
    </tr>
    ${footer()}
  `);
}

function emailModifiedHTML({
  clientName, businessName, service, professional,
  date, time, primaryColor, cancelUrl, rescheduleUrl,
}: {
  clientName: string; businessName: string; service: string; professional: string;
  date: string; time: string; primaryColor: string;
  cancelUrl: string; rescheduleUrl: string;
}) {
  const headerBg = primaryColor || "#14111C";
  const rows = appointmentRows(service, professional, date, time);
  return buildEmailWrapper(headerBg, `
    <!-- Header -->
    <tr>
      <td class="eh"
          style="background:${headerBg};padding:28px 32px 22px;text-align:center;">
        <div style="font-size:32px;margin-bottom:8px;">📅</div>
        <h1 style="margin:0 0 4px;font-size:21px;font-weight:800;color:#ffffff;
                   letter-spacing:-0.03em;font-family:${FONT};">
          ¡Cita actualizada!
        </h1>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);
                  font-family:${FONT};">${businessName}</p>
      </td>
    </tr>
    ${gradientBar()}
    <!-- Body -->
    <tr>
      <td class="eb" style="padding:28px 32px 24px;">
        <p style="margin:0 0 20px;font-size:16px;font-weight:600;color:#14111C;font-family:${FONT};">
          Hola, <strong>${clientName}</strong> 👋<br>
          <span style="font-weight:400;color:#564E66;font-size:15px;">
            Los datos de tu cita han sido actualizados.
          </span>
        </p>
        ${appointmentCard(rows)}
        ${ctaButtons(rescheduleUrl, cancelUrl)}
      </td>
    </tr>
    ${footer()}
  `);
}

function emailCancelledHTML({
  clientName, businessName, service, professional, date, time, primaryColor,
}: {
  clientName: string; businessName: string; service: string; professional: string;
  date: string; time: string; primaryColor: string;
}) {
  const headerBg = "#6b7280";
  const rows = appointmentRows(service, professional, date, time);
  return buildEmailWrapper(headerBg, `
    <!-- Header -->
    <tr>
      <td class="eh"
          style="background:${headerBg};padding:28px 32px 22px;text-align:center;">
        <div style="font-size:32px;margin-bottom:8px;">✕</div>
        <h1 style="margin:0 0 4px;font-size:21px;font-weight:800;color:#ffffff;
                   letter-spacing:-0.03em;font-family:${FONT};">
          Cita cancelada
        </h1>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);
                  font-family:${FONT};">${businessName}</p>
      </td>
    </tr>
    ${gradientBar()}
    <!-- Body -->
    <tr>
      <td class="eb" style="padding:28px 32px 24px;">
        <p style="margin:0 0 20px;font-size:16px;font-weight:600;color:#14111C;font-family:${FONT};">
          Hola, <strong>${clientName}</strong><br>
          <span style="font-weight:400;color:#564E66;font-size:15px;">
            Tu cita ha sido cancelada. Si fue un error o deseas reagendar, contáctanos directamente.
          </span>
        </p>
        ${appointmentCard(rows)}
      </td>
    </tr>
    ${footer()}
  `);
}

function gradientBar() {
  return `<tr><td style="height:3px;background:${GRAD};font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

function appointmentCard(rows: string) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:#f7f7fa;border-radius:12px;border:1px solid #e8e6e2;">
      <tr><td style="padding:16px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${rows}
        </table>
      </td></tr>
    </table>`;
}

function ctaButtons(rescheduleUrl: string, cancelUrl: string) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td align="center" style="padding-bottom:10px;">
          <a href="${rescheduleUrl}" class="bf"
             style="display:inline-block;width:240px;max-width:100%;padding:14px 0;
                    background:#0027fe;color:#ffffff;text-decoration:none;
                    border-radius:11px;font-weight:700;font-size:15px;
                    font-family:${FONT};text-align:center;">
            📅 Reagendar cita
          </a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:10px;">
          <a href="${cancelUrl}" class="bf"
             style="display:inline-block;width:240px;max-width:100%;padding:14px 0;
                    background:#6b7280;color:#ffffff;text-decoration:none;
                    border-radius:11px;font-weight:700;font-size:15px;
                    font-family:${FONT};text-align:center;">
            ✕ Cancelar cita
          </a>
        </td>
      </tr>
      <tr>
        <td align="center">
          <p style="margin:4px 0 0;font-size:12px;color:#a0a0b0;font-family:${FONT};">
            Sin necesidad de cuenta &middot; Un clic para gestionar
          </p>
        </td>
      </tr>
    </table>`;
}

function footer() {
  return `
    <tr>
      <td class="ef"
          style="border-top:1px solid #e8e6e2;padding:18px 32px;
                 text-align:center;background:#f7f7fa;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.06em;
                  text-transform:uppercase;color:#a0a0b0;font-family:${FONT};">
          Agenda gestionada con
        </p>
        <a href="https://zyncra.app" style="text-decoration:none;display:inline-block;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;">
            <tr>
              <td style="vertical-align:middle;padding-right:6px;">
                <img src="https://zyncra.app/zyncra-icon.png" alt="Zyncra"
                     width="20" height="20"
                     style="width:20px;height:20px;border-radius:5px;display:block;">
              </td>
              <td style="vertical-align:middle;">
                <span style="font-size:15px;font-weight:800;color:#14111C;
                             font-family:${FONT};">Zyncra</span>
              </td>
            </tr>
          </table>
        </a>
      </td>
    </tr>`;
}

function buildEmailWrapper(_primaryColor: string, content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @media only screen and (max-width:600px){
      .ew { padding:16px 8px !important; }
      .ec { border-radius:14px !important; }
      .eh { padding:22px 20px 18px !important; }
      .eb { padding:22px 20px 20px !important; }
      .ef { padding:16px 20px !important; }
      .bf { width:100% !important; display:block !important; box-sizing:border-box !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0eff8;font-family:${FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#f0eff8;">
    <tr><td align="center" class="ew" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             class="ec"
             style="max-width:540px;background:#ffffff;border-radius:20px;
                    overflow:hidden;box-shadow:0 8px 32px rgba(20,15,30,0.10);">
        ${content}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email, clientName, businessName,
      service, professional, date, time,
      primaryColor = "#fb0f05",
      manageToken,
      type = "confirmation",
    } = body as {
      email: string; clientName: string; businessName: string;
      service: string; professional: string; date: string; time: string;
      primaryColor?: string; manageToken?: string;
      type?: "confirmation" | "modification" | "cancellation";
    };

    if (!email || (type !== "cancellation" && !manageToken)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://zyncra.app").replace(/\/$/, "");
    const cancelUrl     = `${base}/manage/${manageToken}?action=cancel`;
    const rescheduleUrl = `${base}/manage/${manageToken}?action=reschedule`;

    const subjects: Record<string, string> = {
      confirmation: `Cita confirmada — ${businessName}`,
      modification:  `Cita actualizada — ${businessName}`,
      cancellation:  `Tu cita fue cancelada — ${businessName}`,
    };

    const html = type === "cancellation"
      ? emailCancelledHTML({ clientName, businessName, service, professional, date, time, primaryColor })
      : type === "modification"
        ? emailModifiedHTML({ clientName, businessName, service, professional, date, time, primaryColor, cancelUrl, rescheduleUrl })
        : emailHTML({ clientName, businessName, service, professional, date, time, primaryColor, cancelUrl, rescheduleUrl });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "Zyncra <bookings@zyncra.app>",
        to: email,
        subject: subjects[type] ?? subjects.confirmation,
        html,
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
