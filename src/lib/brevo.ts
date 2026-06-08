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
        <td align="center" style="padding-bottom:8px;">
          <a href="${p.manage_url}"
             style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#fb0f05 0%,#0027fe 100%);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
            📅 Gestionar mi cita
          </a>
        </td>
      </tr>
      <tr>
        <td align="center">
          <p style="margin:0;font-size:12px;color:#9b9bb0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
            Reagenda o cancela con 1 clic · Sin necesidad de cuenta
          </p>
        </td>
      </tr>
    </table>` : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0eff8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0eff8;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:540px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 48px rgba(0,0,0,0.10);">
        <tr>
          <td style="background:${color};padding:36px 32px 28px;text-align:center;">
            ${logo}
            <p style="margin:0;font-size:21px;font-weight:800;color:#ffffff;letter-spacing:-0.025em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${biz}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 28px;">
            ${body.replace("__APPT_CARD__", apptCard).replace("__MANAGE_BTN__", manageBtn)}
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid #e8e6e2;padding:22px 32px;text-align:center;background:#fafaf9;">
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
  const from    = `${process.env.BREVO_SENDER_NAME ?? "Zyncra"} <${process.env.BREVO_SENDER_EMAIL ?? "noreply@zyncra.app"}>`;
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
