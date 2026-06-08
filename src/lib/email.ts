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

// ── Design tokens (mirrors landing page globals.css) ─────────────────────────
const T = {
  ink1:      "#14111C",
  ink2:      "#3a3a48",
  ink3:      "#564E66",
  ink4:      "#8E879B",
  ink5:      "#a0a0b0",
  border:    "#e8e6e2",
  bgWrap:    "#f0eff8",
  bgCard:    "#ffffff",
  bgElevated:"#f7f7fa",
  grad:      "linear-gradient(135deg,#fb0f05 0%,#0027fe 100%)",
  red:       "#fb0f05",
  font:      "'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif",
};

// ── Shared blocks ─────────────────────────────────────────────────────────────

function apptCard(p: ReminderEmailParams): string {
  const rows = [
    ["📅", "Fecha",      p.fecha],
    ["⏰", "Hora",       p.hora],
    ["✂️", "Servicio",   p.servicio],
    ...(p.profesional ? [["👤", "Profesional", p.profesional]] : []),
  ];

  const rowsHtml = rows.map(([ , label, value], i) => `
    <tr>
      <td style="padding:10px 0;font-size:13px;font-weight:600;color:${T.ink4};
                 ${i > 0 ? `border-top:1px solid ${T.border};` : ""}
                 font-family:${T.font};">${label}</td>
      <td style="padding:10px 0;font-size:14px;font-weight:700;color:${T.ink1};
                 text-align:right;
                 ${i > 0 ? `border-top:1px solid ${T.border};` : ""}
                 font-family:${T.font};">${value}</td>
    </tr>`).join("");

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:${T.bgElevated};border-radius:12px;border:1px solid ${T.border};margin-top:20px;">
    <tr><td style="padding:16px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${rowsHtml}
      </table>
    </td></tr>
  </table>`;
}

function manageBtns(url: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
    <tr>
      <td align="center" style="padding-bottom:10px;">
        <a href="${url}?action=reschedule"
           style="display:inline-block;width:240px;max-width:100%;padding:14px 0;
                  background:${T.grad};color:#ffffff;text-decoration:none;
                  border-radius:11px;font-weight:700;font-size:15px;
                  font-family:${T.font};text-align:center;
                  box-shadow:0 4px 16px rgba(0,39,254,0.22);">
          📅 Reagendar cita
        </a>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:10px;">
        <a href="${url}?action=cancel"
           style="display:inline-block;width:240px;max-width:100%;padding:13px 0;
                  background:#ffffff;color:${T.ink3};text-decoration:none;
                  border-radius:11px;font-weight:600;font-size:15px;
                  font-family:${T.font};text-align:center;
                  border:1.5px solid ${T.border};">
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

// ── Outer wrapper (header + body + footer) ────────────────────────────────────

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
      .ew  { padding:16px 8px !important; }
      .ec  { border-radius:14px !important; }
      .eh  { padding:22px 20px 18px !important; }
      .eb  { padding:22px 20px 20px !important; }
      .ef  { padding:16px 20px !important; }
      .li  { height:44px !important; }
      .bn  { font-size:17px !important; }
      .bf  { width:100% !important; display:block !important; box-sizing:border-box !important; }
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

        <!-- ── Header ── -->
        <tr>
          <td class="eh"
              style="background:${headerBg};padding:28px 32px 22px;text-align:center;">
            ${logo}
            <p class="bn"
               style="margin:0;font-size:20px;font-weight:800;color:#ffffff;
                      letter-spacing:-0.03em;font-family:${T.font};">${biz}</p>
          </td>
        </tr>

        <!-- ── Gradient accent bar ── -->
        <tr>
          <td style="height:3px;background:${T.grad};font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td class="eb" style="padding:28px 32px 24px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td class="ef"
              style="border-top:1px solid ${T.border};padding:18px 32px;
                     text-align:center;background:${T.bgElevated};">
            <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.06em;
                      text-transform:uppercase;color:${T.ink5};font-family:${T.font};">
              Agenda gestionada con
            </p>
            <a href="https://zyncra.app"
               style="text-decoration:none;display:inline-block;">
              <table role="presentation" cellpadding="0" cellspacing="0"
                     style="display:inline-table;">
                <tr>
                  <td style="vertical-align:middle;padding-right:6px;">
                    <img src="https://zyncra.app/zyncra-icon.png" alt="Zyncra"
                         width="20" height="20"
                         style="width:20px;height:20px;border-radius:5px;display:block;">
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:15px;font-weight:800;color:${T.red};
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

// ── Per-template content ──────────────────────────────────────────────────────

const SUBJECTS: Record<ReminderTemplateKey, (p: ReminderEmailParams) => string> = {
  "24h":  (p) => `Tienes una cita mañana en ${p.business_name ?? "el negocio"} 📅`,
  "2h":   (p) => `Tu cita en ${p.business_name ?? "el negocio"} es en 2 horas ⚡`,
  "post": (p) => `¿Cómo estuvo tu visita en ${p.business_name ?? "el negocio"}? ⭐`,
};

function body24h(p: ReminderEmailParams): string {
  return `
    <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:${T.ink1};
              font-family:${T.font};">
      Hola, ${p.nombre} 👋
    </p>
    <p style="margin:0 0 4px;font-size:15px;color:${T.ink3};line-height:1.7;
              font-family:${T.font};">
      Te recordamos que mañana tienes una cita confirmada.
    </p>
    <p style="margin:0 0 0;font-size:15px;color:${T.ink3};line-height:1.7;
              font-family:${T.font};">
      ¡Te esperamos!
    </p>
    ${apptCard(p)}
    ${p.manage_url ? manageBtns(p.manage_url) : ""}`;
}

function body2h(p: ReminderEmailParams): string {
  return `
    <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:${T.ink1};
              font-family:${T.font};">
      ¡Ya casi, ${p.nombre}! ⚡
    </p>
    <p style="margin:0 0 4px;font-size:15px;color:${T.ink3};line-height:1.7;
              font-family:${T.font};">
      Tu cita es <strong style="color:${T.ink2};">en 2 horas</strong>.
      Recuerda llegar unos minutos antes.
    </p>
    ${apptCard(p)}
    ${p.manage_url ? manageBtns(p.manage_url) : ""}`;
}

function bodyPost(p: ReminderEmailParams): string {
  return `
    <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:${T.ink1};
              font-family:${T.font};">
      ¡Gracias por visitarnos, ${p.nombre}! 🙏
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:${T.ink3};line-height:1.7;
              font-family:${T.font};">
      Esperamos que hayas disfrutado tu
      <strong style="color:${T.ink2};">${p.servicio}</strong>
      en <strong style="color:${T.ink2};">${p.business_name}</strong>.
      Tu opinión nos ayuda a mejorar.
    </p>

    <!-- Star rating row -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:${T.bgElevated};border-radius:12px;
                  border:1px solid ${T.border};margin-bottom:4px;">
      <tr>
        <td style="padding:16px 20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${T.ink4};
                    font-family:${T.font};">¿Cómo calificarías tu experiencia?</p>
          <p style="margin:0;font-size:28px;letter-spacing:4px;">⭐⭐⭐⭐⭐</p>
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
                    background:${T.grad};color:#ffffff;text-decoration:none;
                    border-radius:11px;font-weight:700;font-size:15px;
                    font-family:${T.font};text-align:center;
                    box-shadow:0 4px 16px rgba(0,39,254,0.22);">
            📅 Agendar próxima cita
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
