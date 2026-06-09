export type ReminderTemplateKey = "24h" | "2h" | "post";

export interface ReminderEmailParams {
  nombre:         string;
  servicio:       string;
  fecha:          string;
  hora:           string;
  profesional?:   string;
  manage_url?:    string;
  business_name?: string;
  logo_url?:      string;
  primary_color?: string;
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const F    = "'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif";
const INK1 = "#14111C";
const INK3 = "#564E66";
const INK4 = "#8E879B";
const INK5 = "#b0adb8";
const SEP  = "#f0eff8";

// ── Detail rows (label uppercase left, value bold right) ───────────────────────
function detailRows(p: ReminderEmailParams): string {
  const entries: [string, string][] = [
    ["Servicio",    p.servicio],
    ["Profesional", p.profesional ?? "—"],
    ["Fecha",       p.fecha],
    ["Hora",        p.hora],
  ];
  return entries.map(([label, value], i) => `
    <tr>
      <td style="padding:10px 0;font-size:11px;font-weight:700;letter-spacing:0.07em;
                 text-transform:uppercase;color:${INK4};
                 ${i > 0 ? `border-top:1px solid ${SEP};` : ""}
                 font-family:${F};">${label}</td>
      <td style="padding:10px 0;font-size:14px;font-weight:700;color:${INK1};
                 text-align:right;
                 ${i > 0 ? `border-top:1px solid ${SEP};` : ""}
                 font-family:${F};">${value}</td>
    </tr>`).join("");
}

// ── CTA block: primary button + text links ─────────────────────────────────────
function ctaBlock(manageUrl: string, primaryColor: string): string {
  const btn = primaryColor || "#14111C";
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="margin-top:8px;">
    <tr>
      <td style="padding-bottom:0;">
        <a href="${manageUrl}" class="btn"
           style="display:block;background:${btn};color:#ffffff;
                  text-decoration:none;text-align:center;
                  padding:15px 24px;border-radius:12px;
                  font-size:15px;font-weight:700;letter-spacing:-0.01em;
                  font-family:${F};">
          Gestionar mi cita &nbsp;→
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding-top:14px;text-align:center;">
        <a href="${manageUrl}?action=reschedule"
           style="color:#0027fe;text-decoration:none;font-size:13px;font-weight:600;
                  font-family:${F};">Reagendar</a>
        <span style="color:#d8d5dd;margin:0 10px;">·</span>
        <a href="${manageUrl}?action=cancel"
           style="color:${INK4};text-decoration:none;font-size:13px;font-weight:600;
                  font-family:${F};">Cancelar</a>
      </td>
    </tr>
  </table>`;
}

// ── Outer wrapper ──────────────────────────────────────────────────────────────
function buildHtml(
  label: string,
  title: string,
  subtitle: string,
  bodyExtra: string,
  p: ReminderEmailParams,
): string {
  const cinta      = p.primary_color ?? "#14111C";
  const biz        = p.business_name ?? "";
  const logoHtml   = p.logo_url
    ? `<img src="${p.logo_url}" alt="${biz}" height="44"
           style="height:44px;max-width:160px;width:auto;object-fit:contain;
                  display:block;border-radius:6px;">`
    : "";

  // Top bar: logo (left) + business name (right if logo, else centered as heading)
  const topBar = logoHtml
    ? `
    <tr>
      <td style="padding:20px 32px 0;" class="ep">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;">${logoHtml}</td>
            <td align="right" style="vertical-align:middle;">
              <span style="font-size:12px;font-weight:600;color:${INK4};font-family:${F};">${biz}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : `
    <tr>
      <td style="padding:20px 32px 0;" class="ep">
        <p style="margin:0;font-size:15px;font-weight:800;color:${INK1};
                  letter-spacing:-0.02em;font-family:${F};">${biz}</p>
      </td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
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

        <!-- LA CINTA (tenant brand color) -->
        <tr>
          <td style="height:7px;background:${cinta};font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Business identity -->
        ${topBar}

        <!-- Heading -->
        <tr>
          <td style="padding:26px 32px 0;" class="ep">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.10em;
                      text-transform:uppercase;color:${INK4};font-family:${F};">${label}</p>
            <h1 style="margin:0 0 10px;font-size:28px;font-weight:800;color:${INK1};
                       letter-spacing:-0.04em;line-height:1.15;font-family:${F};">${title}</h1>
            <p style="margin:0;font-size:15px;color:${INK3};line-height:1.55;
                      font-family:${F};">${subtitle}</p>
          </td>
        </tr>

        <!-- Detail rows -->
        <tr>
          <td style="padding:22px 32px;" class="ep">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${detailRows(p)}
            </table>
          </td>
        </tr>

        <!-- Extra body content (post rating, etc.) -->
        ${bodyExtra ? `<tr><td style="padding:0 32px;" class="ep">${bodyExtra}</td></tr>` : ""}

        <!-- CTA -->
        ${p.manage_url ? `<tr><td style="padding:4px 32px 32px;" class="ep">${ctaBlock(p.manage_url, cinta)}</td></tr>` : `<tr><td style="padding:0 0 32px;"></td></tr>`}

        <!-- Footer: Zyncra only -->
        <tr>
          <td style="border-top:1px solid ${SEP};padding:16px 32px;text-align:center;">
            <span style="font-size:12px;color:${INK5};font-family:${F};">
              Agenda gestionada con &nbsp;
            </span>
            <a href="https://zyncra.app" style="text-decoration:none;">
              <span style="font-size:12px;font-weight:800;color:${INK3};font-family:${F};">Zyncra</span>
            </a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Per-template definitions ───────────────────────────────────────────────────

const SUBJECTS: Record<ReminderTemplateKey, (p: ReminderEmailParams) => string> = {
  "24h":  (p) => `Tu cita mañana — ${p.business_name ?? "el negocio"}`,
  "2h":   (p) => `Tu cita es en 2 horas — ${p.business_name ?? "el negocio"}`,
  "post": (p) => `¿Cómo estuvo tu visita? — ${p.business_name ?? "el negocio"}`,
};

function build24h(p: ReminderEmailParams): string {
  return buildHtml(
    "Recordatorio · 24 horas",
    "Tienes cita mañana",
    `Hola <strong style="color:${INK1};">${p.nombre}</strong>, te recordamos que mañana tienes una cita confirmada. ¡Te esperamos!`,
    "",
    p,
  );
}

function build2h(p: ReminderEmailParams): string {
  return buildHtml(
    "Recordatorio · 2 horas",
    "¡Ya casi es tu hora!",
    `Hola <strong style="color:${INK1};">${p.nombre}</strong>, tu cita es <strong style="color:${INK1};">en 2 horas</strong>. Recuerda llegar unos minutos antes.`,
    "",
    p,
  );
}

function buildPost(p: ReminderEmailParams): string {
  const stars = Array(5).fill(
    `<td style="padding:0 2px;">
       <span style="font-size:22px;color:#fbbf24;font-family:${F};">★</span>
     </td>`
  ).join("");

  const ratingBlock = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:#fafaf8;border-radius:12px;border:1px solid #f0eff8;margin-bottom:16px;">
      <tr><td style="padding:18px 20px;text-align:center;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.07em;
                  text-transform:uppercase;color:${INK4};font-family:${F};">
          ¿Cómo calificarías tu experiencia?
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0"
               style="display:inline-table;margin:0 auto;">
          <tr>${stars}</tr>
        </table>
      </td></tr>
    </table>`;

  return buildHtml(
    "Post-visita",
    "¡Gracias por tu visita!",
    `Hola <strong style="color:${INK1};">${p.nombre}</strong>, esperamos que hayas disfrutado tu <strong style="color:${INK1};">${p.servicio}</strong>. Nos encantaría saber cómo estuvo.`,
    ratingBlock,
    p,
  );
}

// ── Send via Resend ────────────────────────────────────────────────────────────

const BUILDERS: Record<ReminderTemplateKey, (p: ReminderEmailParams) => string> = {
  "24h":  build24h,
  "2h":   build2h,
  "post": buildPost,
};

export async function sendReminderEmail(
  templateKey: ReminderTemplateKey,
  to: string,
  toName: string,
  params: ReminderEmailParams,
): Promise<void> {
  const from    = process.env.RESEND_FROM_EMAIL ?? "Zyncra <noreply@zyncra.app>";
  const subject = SUBJECTS[templateKey](params);
  const html    = BUILDERS[templateKey](params);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ from, to: [`${toName} <${to}>`], subject, html }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Resend error ${res.status}: ${JSON.stringify(err)}`);
  }
}
