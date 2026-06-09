import { NextRequest, NextResponse } from "next/server";

const MONTHS_ES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];
const DAYS_ES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_ES[dt.getDay()]} ${d} de ${MONTHS_ES[m - 1]}`;
}

function to12h(t: string) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

const F = "'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif";
const GRAD = "linear-gradient(90deg,#fb0f05 0%,#0027fe 100%)";
const GRAD_BTN = "linear-gradient(135deg,#fb0f05 0%,#0027fe 100%)";

function detailRows(service: string, professional: string, date: string, time: string) {
  const rows = [
    ["Servicio",    service     || "—"],
    ["Profesional", professional || "—"],
    ["Fecha",       formatDate(date)],
    ["Hora",        to12h(time)],
  ];
  return rows.map(([label, value], i) => `
    <tr>
      <td style="padding:10px 0;font-size:11px;font-weight:700;letter-spacing:0.07em;
                 text-transform:uppercase;color:#8E879B;
                 ${i > 0 ? "border-top:1px solid #f0eff8;" : ""}
                 font-family:${F};">${label}</td>
      <td style="padding:10px 0;font-size:14px;font-weight:700;color:#14111C;
                 text-align:right;
                 ${i > 0 ? "border-top:1px solid #f0eff8;" : ""}
                 font-family:${F};">${value}</td>
    </tr>`).join("");
}

function topBar(businessName: string) {
  return `
    <tr>
      <td style="padding:20px 32px 0;" class="ep">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:5px;">
                    <img src="https://zyncra.app/zyncra-icon.png" alt="Z"
                         width="18" height="18"
                         style="width:18px;height:18px;border-radius:4px;display:block;">
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:13px;font-weight:800;color:#14111C;
                                 letter-spacing:-0.01em;font-family:${F};">Zyncra</span>
                  </td>
                </tr>
              </table>
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="font-size:12px;font-weight:500;color:#8E879B;font-family:${F};">
                ${businessName}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function heading(label: string, title: string, subtitle: string) {
  return `
    <tr>
      <td style="padding:26px 32px 0;" class="ep">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.10em;
                  text-transform:uppercase;color:#8E879B;font-family:${F};">${label}</p>
        <h1 style="margin:0 0 10px;font-size:28px;font-weight:800;color:#14111C;
                   letter-spacing:-0.04em;line-height:1.15;font-family:${F};">${title}</h1>
        <p style="margin:0;font-size:15px;color:#564E66;line-height:1.55;
                  font-family:${F};">${subtitle}</p>
      </td>
    </tr>`;
}

function detailsBlock(rows: string) {
  return `
    <tr>
      <td style="padding:22px 32px;" class="ep">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${rows}
        </table>
      </td>
    </tr>`;
}

function ctaBlock(manageUrl: string, rescheduleUrl: string, cancelUrl: string) {
  return `
    <tr>
      <td style="padding:4px 32px 32px;" class="ep">
        <a href="${manageUrl}" class="btn"
           style="display:block;background:${GRAD_BTN};color:#ffffff;
                  text-decoration:none;text-align:center;
                  padding:15px 24px;border-radius:12px;
                  font-size:15px;font-weight:700;letter-spacing:-0.01em;
                  font-family:${F};">
          Gestionar mi cita &nbsp;→
        </a>
        <p style="margin:14px 0 0;text-align:center;font-family:${F};">
          <a href="${rescheduleUrl}"
             style="color:#0027fe;text-decoration:none;font-size:13px;font-weight:600;">
            Reagendar
          </a>
          <span style="color:#d8d5dd;margin:0 10px;">·</span>
          <a href="${cancelUrl}"
             style="color:#8E879B;text-decoration:none;font-size:13px;font-weight:600;">
            Cancelar
          </a>
        </p>
      </td>
    </tr>`;
}

function footerBlock() {
  return `
    <tr>
      <td style="border-top:1px solid #f0eff8;padding:16px 32px;text-align:center;">
        <span style="font-size:12px;color:#b0adb8;font-family:${F};">
          Agenda gestionada con &nbsp;
        </span>
        <a href="https://zyncra.app" style="text-decoration:none;">
          <span style="font-size:12px;font-weight:800;color:#564E66;font-family:${F};">Zyncra</span>
        </a>
      </td>
    </tr>`;
}

function wrap(cintaGrad: string, content: string) {
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
      .ew{padding:16px 8px!important}
      .ec{border-radius:16px!important}
      .ep{padding-left:20px!important;padding-right:20px!important}
      .btn{width:100%!important;display:block!important;box-sizing:border-box!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0eff8;font-family:${F};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#f0eff8;">
    <tr><td align="center" class="ew" style="padding:36px 16px;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             class="ec"
             style="max-width:560px;background:#ffffff;border-radius:20px;
                    overflow:hidden;box-shadow:0 2px 20px rgba(20,15,30,0.08);">

        <!-- LA CINTA -->
        <tr>
          <td style="height:7px;background:${cintaGrad};font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        ${content}

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Confirmation ───────────────────────────────────────────────────────────
function emailHTML({ clientName, businessName, service, professional, date, time, manageUrl, rescheduleUrl, cancelUrl }: {
  clientName: string; businessName: string; service: string; professional: string;
  date: string; time: string; manageUrl: string; rescheduleUrl: string; cancelUrl: string;
}) {
  return wrap(GRAD, `
    ${topBar(businessName)}
    ${heading(
      "Reserva confirmada",
      "¡Tu cita está lista!",
      `Hola <strong style="color:#14111C;">${clientName}</strong>, tu cita en <strong style="color:#14111C;">${businessName}</strong> quedó registrada con éxito.`
    )}
    ${detailsBlock(detailRows(service, professional, date, time))}
    ${ctaBlock(manageUrl, rescheduleUrl, cancelUrl)}
    ${footerBlock()}
  `);
}

// ── Modification ───────────────────────────────────────────────────────────
function emailModifiedHTML({ clientName, businessName, service, professional, date, time, manageUrl, rescheduleUrl, cancelUrl }: {
  clientName: string; businessName: string; service: string; professional: string;
  date: string; time: string; manageUrl: string; rescheduleUrl: string; cancelUrl: string;
}) {
  return wrap(GRAD, `
    ${topBar(businessName)}
    ${heading(
      "Cita actualizada",
      "Nueva fecha confirmada",
      `Hola <strong style="color:#14111C;">${clientName}</strong>, tu cita en <strong style="color:#14111C;">${businessName}</strong> fue reprogramada con los siguientes datos.`
    )}
    ${detailsBlock(detailRows(service, professional, date, time))}
    ${ctaBlock(manageUrl, rescheduleUrl, cancelUrl)}
    ${footerBlock()}
  `);
}

// ── Cancellation ───────────────────────────────────────────────────────────
function emailCancelledHTML({ clientName, businessName, service, professional, date, time }: {
  clientName: string; businessName: string; service: string; professional: string;
  date: string; time: string;
}) {
  const grayGrad = "linear-gradient(90deg,#374151 0%,#6b7280 100%)";
  return wrap(grayGrad, `
    ${topBar(businessName)}
    ${heading(
      "Cancelación",
      "Cita cancelada",
      `Hola <strong style="color:#14111C;">${clientName}</strong>, tu cita en <strong style="color:#14111C;">${businessName}</strong> fue cancelada. Si fue un error, contáctanos directamente.`
    )}
    ${detailsBlock(detailRows(service, professional, date, time))}
    ${footerBlock()}
  `);
}

// ── POST handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email, clientName, businessName,
      service, professional, date, time,
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
    const manageUrl    = `${base}/manage/${manageToken}`;
    const rescheduleUrl = `${base}/manage/${manageToken}?action=reschedule`;
    const cancelUrl     = `${base}/manage/${manageToken}?action=cancel`;

    const subjects: Record<string, string> = {
      confirmation: `Cita confirmada — ${businessName}`,
      modification:  `Cita actualizada — ${businessName}`,
      cancellation:  `Tu cita fue cancelada — ${businessName}`,
    };

    const params = { clientName, businessName, service, professional, date, time };
    const html = type === "cancellation"
      ? emailCancelledHTML(params)
      : type === "modification"
        ? emailModifiedHTML({ ...params, manageUrl, rescheduleUrl, cancelUrl })
        : emailHTML({ ...params, manageUrl, rescheduleUrl, cancelUrl });

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
