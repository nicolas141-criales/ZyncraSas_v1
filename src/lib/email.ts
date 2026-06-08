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

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  ink1:       "#14111C",
  ink2:       "#3a3a48",
  ink3:       "#564E66",
  ink4:       "#8E879B",
  ink5:       "#a0a0b0",
  border:     "#e8e6e2",
  bgWrap:     "#f0eff8",
  bgCard:     "#ffffff",
  bgElevated: "#f7f7fa",
  grad:       "linear-gradient(135deg,#fb0f05 0%,#0027fe 100%)",
  font:       "'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif",
};

// ── SVG icons (exact paths from src/components/landing/icons.tsx) ─────────────
// stroke-width 1.6, round caps, 20×20 display / 24×24 viewBox
const SVG = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/><circle cx="8" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="14" r="1" fill="currentColor" stroke="none"/></svg>`,

  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,

  scissors: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.5 15.5M20 20L8.5 8.5M14 12h6"/></svg>`,

  user: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.2c2.8.5 5 2.8 5 5.8"/></svg>`,

  star: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FBBF24" stroke="none"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.8 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z"/></svg>`,

  bolt: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z"/></svg>`,

  check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>`,
};

// icon wrapped in a small colored rounded badge — matches landing icon style
function badge(svg: string, bg: string, color: string): string {
  return `<span style="display:inline-block;width:24px;height:24px;background:${bg};
                border-radius:6px;text-align:center;line-height:24px;vertical-align:middle;
                color:${color};">${svg}</span>`;
}

// ── Appointment card ──────────────────────────────────────────────────────────

function apptCard(p: ReminderEmailParams): string {
  const rows: [string, string, string, string][] = [
    [SVG.calendar, "#eff2ff", "#0027fe", "Fecha",       p.fecha],
    [SVG.clock,    "#f3ecff", "#7B2FBE", "Hora",        p.hora],
    [SVG.scissors, "#fff0f0", "#fb0f05", "Servicio",     p.servicio],
    ...(p.profesional
      ? [[SVG.user, "#e0fafb", "#0891b2", "Profesional", p.profesional]] as [string,string,string,string,string][]
      : []),
  ] as [string,string,string,string,string][];

  const rowsHtml = rows.map(([svg, bg, color, label, value], i) => `
    <tr>
      <td style="padding:10px 0;${i > 0 ? `border-top:1px solid ${T.border};` : ""}vertical-align:middle;width:140px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:8px;vertical-align:middle;">
              ${badge(svg, bg, color)}
            </td>
            <td style="vertical-align:middle;font-size:13px;font-weight:600;
                       color:${T.ink4};font-family:${T.font};">${label}</td>
          </tr>
        </table>
      </td>
      <td style="padding:10px 0;${i > 0 ? `border-top:1px solid ${T.border};` : ""}
                 font-size:14px;font-weight:700;color:${T.ink1};
                 text-align:right;font-family:${T.font};">${value}</td>
    </tr>`).join("");

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:${T.bgElevated};border-radius:12px;
                border:1px solid ${T.border};margin-top:20px;">
    <tr><td style="padding:4px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${rowsHtml}
      </table>
    </td></tr>
  </table>`;
}

// ── Manage buttons ────────────────────────────────────────────────────────────

function manageBtns(url: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="margin-top:24px;">
    <tr>
      <td align="center" style="padding-bottom:10px;">
        <a href="${url}?action=reschedule"
           style="display:inline-block;width:240px;max-width:100%;padding:14px 0;
                  background:#0027fe;color:#ffffff;text-decoration:none;
                  border-radius:11px;font-weight:700;font-size:15px;
                  font-family:${T.font};text-align:center;">
          Reagendar cita
        </a>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:10px;">
        <a href="${url}?action=cancel"
           style="display:inline-block;width:240px;max-width:100%;padding:14px 0;
                  background:#6b7280;color:#ffffff;text-decoration:none;
                  border-radius:11px;font-weight:700;font-size:15px;
                  font-family:${T.font};text-align:center;">
          Cancelar cita
        </a>
      </td>
    </tr>
    <tr>
      <td align="center">
        <p style="margin:4px 0 0;font-size:12px;color:${T.ink5};font-family:${T.font};">
          Sin necesidad de cuenta &middot; Un clic para gestionar
        </p>
      </td>
    </tr>
  </table>`;
}

// ── Outer wrapper ─────────────────────────────────────────────────────────────

function buildHtml(bodyHtml: string, p: ReminderEmailParams): string {
  const headerBg = p.primary_color ?? "#14111C";
  const biz      = p.business_name ?? "";
  const logo     = p.logo_url
    ? `<img src="${p.logo_url}" alt="${biz}" height="52"
             style="height:52px;max-width:180px;width:auto;object-fit:contain;
                    display:block;margin:0 auto 10px;border-radius:8px;">`
    : "";

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
      .ew { padding:16px 8px !important; }
      .ec { border-radius:14px !important; }
      .eh { padding:22px 20px 18px !important; }
      .eb { padding:22px 20px 20px !important; }
      .ef { padding:16px 20px !important; }
      .bn { font-size:17px !important; }
      .bf { width:100% !important; display:block !important; box-sizing:border-box !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${T.bgWrap};font-family:${T.font};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:${T.bgWrap};">
    <tr><td align="center" class="ew" style="padding:32px 16px;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             class="ec"
             style="max-width:540px;background:${T.bgCard};border-radius:20px;
                    overflow:hidden;box-shadow:0 8px 32px rgba(20,15,30,0.10);">

        <!-- Header -->
        <tr>
          <td class="eh"
              style="background:${headerBg};padding:28px 32px 22px;text-align:center;">
            ${logo}
            <p class="bn"
               style="margin:0;font-size:20px;font-weight:800;color:#ffffff;
                      letter-spacing:-0.03em;font-family:${T.font};">${biz}</p>
          </td>
        </tr>

        <!-- Gradient accent bar -->
        <tr>
          <td style="height:3px;background:${T.grad};font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Body -->
        <tr>
          <td class="eb" style="padding:28px 32px 24px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="ef"
              style="border-top:1px solid ${T.border};padding:18px 32px;
                     text-align:center;background:${T.bgElevated};">
            <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.06em;
                      text-transform:uppercase;color:${T.ink5};font-family:${T.font};">
              Agenda gestionada con
            </p>
            <a href="https://zyncra.app" style="text-decoration:none;display:inline-block;">
              <table role="presentation" cellpadding="0" cellspacing="0"
                     style="display:inline-table;">
                <tr>
                  <td style="vertical-align:middle;padding-right:6px;">
                    <img src="https://zyncra.app/zyncra-icon.png" alt="Zyncra"
                         width="20" height="20"
                         style="width:20px;height:20px;border-radius:5px;display:block;">
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:15px;font-weight:800;color:${T.ink1};
                                 font-family:${T.font};">Zyncra</span>
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Per-template bodies ───────────────────────────────────────────────────────

const SUBJECTS: Record<ReminderTemplateKey, (p: ReminderEmailParams) => string> = {
  "24h":  (p) => `Tienes una cita mañana en ${p.business_name ?? "el negocio"}`,
  "2h":   (p) => `Tu cita en ${p.business_name ?? "el negocio"} es en 2 horas`,
  "post": (p) => `¿Cómo estuvo tu visita en ${p.business_name ?? "el negocio"}?`,
};

function body24h(p: ReminderEmailParams): string {
  return `
    <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:${T.ink1};
              font-family:${T.font};">
      Hola, ${p.nombre}
    </p>
    <p style="margin:0;font-size:15px;color:${T.ink3};line-height:1.7;
              font-family:${T.font};">
      Te recordamos que <strong style="color:${T.ink2};">mañana</strong>
      tienes una cita confirmada. ¡Te esperamos!
    </p>
    ${apptCard(p)}
    ${p.manage_url ? manageBtns(p.manage_url) : ""}`;
}

function body2h(p: ReminderEmailParams): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td style="vertical-align:middle;padding-right:8px;color:#7B2FBE;">
          ${SVG.bolt}
        </td>
        <td style="vertical-align:middle;font-size:18px;font-weight:700;
                   color:${T.ink1};font-family:${T.font};">
          ¡Ya casi, ${p.nombre}!
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:15px;color:${T.ink3};line-height:1.7;
              font-family:${T.font};">
      Tu cita es <strong style="color:${T.ink2};">en 2 horas</strong>.
      Recuerda llegar unos minutos antes.
    </p>
    ${apptCard(p)}
    ${p.manage_url ? manageBtns(p.manage_url) : ""}`;
}

function bodyPost(p: ReminderEmailParams): string {
  const stars = SVG.star.repeat(5);
  return `
    <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:${T.ink1};
              font-family:${T.font};">
      ¡Gracias por visitarnos, ${p.nombre}!
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:${T.ink3};line-height:1.7;
              font-family:${T.font};">
      Esperamos que hayas disfrutado tu
      <strong style="color:${T.ink2};">${p.servicio}</strong>
      en <strong style="color:${T.ink2};">${p.business_name}</strong>.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:${T.bgElevated};border-radius:12px;
                  border:1px solid ${T.border};margin-bottom:4px;">
      <tr>
        <td style="padding:18px 20px;text-align:center;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:${T.ink4};
                    font-family:${T.font};">¿Cómo calificarías tu experiencia?</p>
          <div style="font-size:0;">${stars}</div>
        </td>
      </tr>
    </table>

    ${p.manage_url ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="margin-top:20px;">
      <tr>
        <td align="center">
          <a href="${p.manage_url}"
             style="display:inline-block;width:240px;max-width:100%;padding:14px 0;
                    background:#0027fe;color:#ffffff;text-decoration:none;
                    border-radius:11px;font-weight:700;font-size:15px;
                    font-family:${T.font};text-align:center;">
            Agendar próxima cita
          </a>
        </td>
      </tr>
    </table>` : ""}`;
}

// ── Send via Resend ───────────────────────────────────────────────────────────

const BUILDERS: Record<ReminderTemplateKey, (p: ReminderEmailParams) => string> = {
  "24h":  body24h,
  "2h":   body2h,
  "post": bodyPost,
};

export async function sendReminderEmail(
  templateKey: ReminderTemplateKey,
  to: string,
  toName: string,
  params: ReminderEmailParams,
): Promise<void> {
  const from    = process.env.RESEND_FROM_EMAIL ?? "Zyncra <noreply@zyncra.app>";
  const subject = SUBJECTS[templateKey](params);
  const html    = buildHtml(BUILDERS[templateKey](params), params);

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
