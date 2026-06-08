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

// ── HTML template builder ─────────────────────────────────────────────────────

function buildHtml(body: string, p: ReminderEmailParams): string {
  const color = p.primary_color ?? "#1a1a2e";
  const biz   = p.business_name ?? "";
  const logo  = p.logo_url
    ? `<img src="${p.logo_url}" alt="${biz}" height="56"
           style="height:56px;max-width:200px;width:auto;object-fit:contain;display:block;margin:0 auto 12px;border-radius:8px;">`
    : "";

  const apptCard = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:#f8f7ff;border-radius:14px;border:1px solid #e8e6f0;">
      <tr><td style="padding:20px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:7px 0;font-size:14px;color:#9b9bb0;">📅 Fecha</td>
            <td style="padding:7px 0;font-size:14px;color:#1a1a2e;font-weight:700;text-align:right;">${p.fecha}</td>
          </tr>
          <tr>
            <td style="padding:7px 0;font-size:14px;color:#9b9bb0;border-top:1px solid #e8e6f0;">⏰ Hora</td>
            <td style="padding:7px 0;font-size:14px;color:#1a1a2e;font-weight:700;text-align:right;border-top:1px solid #e8e6f0;">${p.hora}</td>
          </tr>
          <tr>
            <td style="padding:7px 0;font-size:14px;color:#9b9bb0;border-top:1px solid #e8e6f0;">✂️ Servicio</td>
            <td style="padding:7px 0;font-size:14px;color:#1a1a2e;font-weight:700;text-align:right;border-top:1px solid #e8e6f0;">${p.servicio}</td>
          </tr>
          ${p.profesional ? `
          <tr>
            <td style="padding:7px 0;font-size:14px;color:#9b9bb0;border-top:1px solid #e8e6f0;">👤 Profesional</td>
            <td style="padding:7px 0;font-size:14px;color:#1a1a2e;font-weight:700;text-align:right;border-top:1px solid #e8e6f0;">${p.profesional}</td>
          </tr>` : ""}
        </table>
      </td></tr>
    </table>`;

  const manageBtn = p.manage_url ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td align="center" style="padding-bottom:10px;">
          <a href="${p.manage_url}?action=reschedule" class="btn-full"
             style="display:inline-block;width:220px;max-width:100%;padding:14px 0;background:#0027fe;color:#ffffff;text-decoration:none;border-radius:11px;font-weight:700;font-size:15px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-align:center;">
            📅 Reagendar cita
          </a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:10px;">
          <a href="${p.manage_url}?action=cancel" class="btn-full"
             style="display:inline-block;width:220px;max-width:100%;padding:14px 0;background:#6b7280;color:#ffffff;text-decoration:none;border-radius:11px;font-weight:700;font-size:15px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-align:center;">
            ✕ Cancelar cita
          </a>
        </td>
      </tr>
      <tr>
        <td align="center">
          <p style="margin:0;font-size:12px;color:#9b9bb0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
            Sin necesidad de cuenta
          </p>
        </td>
      </tr>
    </table>` : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <style>
    @media only screen and (max-width:600px){
      .email-wrap   { padding:16px 8px !important; }
      .email-card   { border-radius:14px !important; }
      .email-header { padding:24px 20px 20px !important; }
      .email-body   { padding:22px 20px 20px !important; }
      .email-footer { padding:18px 20px !important; }
      .logo-img     { height:44px !important; }
      .biz-name     { font-size:17px !important; }
      .btn-full     { width:100% !important; display:block !important; box-sizing:border-box !important; }
      .appt-label   { font-size:13px !important; }
      .appt-value   { font-size:13px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0eff8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0eff8;">
    <tr><td align="center" class="email-wrap" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-card"
             style="max-width:540px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 48px rgba(0,0,0,0.10);">

        <!-- Header with brand color -->
        <tr>
          <td class="email-header" style="background:${color};padding:32px 32px 26px;text-align:center;">
            ${logo}
            <p class="biz-name" style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.025em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${biz}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td class="email-body" style="padding:28px 32px 24px;">
            ${body.replace("__APPT_CARD__", apptCard).replace("__MANAGE_BTN__", manageBtn)}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="email-footer" style="border-top:1px solid #e8e6e2;padding:20px 32px;text-align:center;background:#fafaf9;">
            <p style="margin:0 0 6px;font-size:12px;color:#b0aec0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Agenda gestionada con</p>
            <a href="https://zyncra.app" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
              <img src="https://zyncra.app/zyncra-icon.png" alt="Zyncra" width="20" height="20"
                   style="width:20px;height:20px;border-radius:5px;vertical-align:middle;">
              <span style="font-size:15px;font-weight:800;color:#fb0f05;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;vertical-align:middle;">Zyncra</span>
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
  "24h":  (p) => `Recordatorio: tu cita en ${p.business_name ?? "el negocio"} es mañana 📅`,
  "2h":   (p) => `⚡ Tu cita en ${p.business_name ?? "el negocio"} es en 2 horas`,
  "post": (p) => `⭐ ¿Cómo estuvo tu servicio en ${p.business_name ?? "el negocio"}?`,
};

const BODIES: Record<ReminderTemplateKey, (p: ReminderEmailParams) => string> = {
  "24h": (p) => `
    <p style="margin:0 0 8px;font-size:17px;color:#1a1a2e;">Hola, <strong>${p.nombre}</strong> 👋</p>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.65;">
      Te recordamos que tienes una cita <strong>mañana</strong>. 🔔
    </p>
    __APPT_CARD__
    __MANAGE_BTN__`,

  "2h": (p) => `
    <p style="margin:0 0 8px;font-size:17px;color:#1a1a2e;">Hola, <strong>${p.nombre}</strong> 👋</p>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.65;">
      ⚡ Tu cita es <strong>en 2 horas</strong>. ¡Ya casi! 🔔
    </p>
    __APPT_CARD__
    __MANAGE_BTN__`,

  "post": (p) => `
    <p style="margin:0 0 8px;font-size:17px;color:#1a1a2e;">Hola, <strong>${p.nombre}</strong> 🙏</p>
    <p style="margin:0 0 8px;font-size:15px;color:#6b7280;line-height:1.65;">
      Gracias por visitarnos hoy en <strong>${p.business_name}</strong>.
      Esperamos que hayas disfrutado tu servicio de <strong>${p.servicio}</strong>.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.65;">
      ⭐ Tu opinión nos ayuda a mejorar. ¡Esperamos verte pronto!
    </p>
    __MANAGE_BTN__`,
};

// ── Send via Resend ───────────────────────────────────────────────────────────

export async function sendReminderEmail(
  templateKey: ReminderTemplateKey,
  to: string,
  toName: string,
  params: ReminderEmailParams,
): Promise<void> {
  const from    = process.env.RESEND_FROM_EMAIL ?? "Zyncra <noreply@zyncra.app>";
  const subject = SUBJECTS[templateKey](params);
  const html    = buildHtml(BODIES[templateKey](params), params);

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
