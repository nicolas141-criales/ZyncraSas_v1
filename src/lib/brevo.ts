const API_KEY   = process.env.BREVO_API_KEY!;
const FROM_EMAIL = process.env.BREVO_SENDER_EMAIL ?? "noreply@zyncra.app";
const FROM_NAME  = process.env.BREVO_SENDER_NAME  ?? "Zyncra";

export interface EmailPayload {
  to:      string;
  toName:  string;
  subject: string;
  html:    string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": API_KEY,
    },
    body: JSON.stringify({
      sender:   { name: FROM_NAME, email: FROM_EMAIL },
      to:       [{ email: payload.to, name: payload.toName }],
      subject:  payload.subject,
      htmlContent: payload.html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Brevo error ${res.status}: ${JSON.stringify(err)}`);
  }
}

// ── HTML templates ────────────────────────────────────────────────────────────

interface TemplateVars {
  nombre:       string;
  servicio:     string;
  profesional?: string;
  fecha:        string;
  hora:         string;
}

function baseLayout(content: string, preheader: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Zyncra</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Logo -->
      <tr><td align="center" style="padding:0 0 24px;">
        <div style="display:inline-flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#fb0f05,#0027fe);display:inline-block;vertical-align:middle;"></div>
          <span style="font-size:20px;font-weight:700;color:#14111c;letter-spacing:-0.5px;vertical-align:middle;">Zyncra</span>
        </div>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:#ffffff;border-radius:18px;border:1px solid #e8e6e2;overflow:hidden;">
        ${content}
      </td></tr>

      <!-- Footer -->
      <tr><td align="center" style="padding:28px 0 0;">
        <p style="font-size:12px;color:#9b9bb0;margin:0;">
          © 2026 Zyncra · Plataforma de gestión para salones y barberías en Colombia
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function accentBar() {
  return `<div style="height:4px;background:linear-gradient(90deg,#fb0f05,#9B3FC8,#0027fe);"></div>`;
}

export function buildEmail24h(vars: TemplateVars): { subject: string; html: string } {
  const subject = `Recordatorio: tu cita es mañana, ${vars.nombre}`;
  const content = `
    ${accentBar()}
    <div style="padding:40px 40px 36px;">
      <p style="font-size:28px;margin:0 0 6px;">📅</p>
      <h1 style="font-size:22px;font-weight:800;color:#14111c;margin:0 0 8px;letter-spacing:-0.5px;">
        Tu cita es mañana
      </h1>
      <p style="font-size:15px;color:#6b7280;margin:0 0 28px;">
        Hola <strong style="color:#14111c;">${vars.nombre}</strong>, te recordamos los detalles de tu cita.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f4;border-radius:12px;border:1px solid #e8e6e2;overflow:hidden;margin:0 0 28px;">
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e8e6e2;">
            <span style="font-size:11px;font-weight:700;color:#9b9bb0;text-transform:uppercase;letter-spacing:0.06em;">Servicio</span><br/>
            <span style="font-size:16px;font-weight:700;color:#14111c;">${vars.servicio}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e8e6e2;">
            <span style="font-size:11px;font-weight:700;color:#9b9bb0;text-transform:uppercase;letter-spacing:0.06em;">Fecha</span><br/>
            <span style="font-size:16px;font-weight:700;color:#14111c;">${vars.fecha}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;${vars.profesional ? "border-bottom:1px solid #e8e6e2;" : ""}">
            <span style="font-size:11px;font-weight:700;color:#9b9bb0;text-transform:uppercase;letter-spacing:0.06em;">Hora</span><br/>
            <span style="font-size:16px;font-weight:700;color:#14111c;">${vars.hora}</span>
          </td>
        </tr>
        ${vars.profesional ? `<tr>
          <td style="padding:16px 20px;">
            <span style="font-size:11px;font-weight:700;color:#9b9bb0;text-transform:uppercase;letter-spacing:0.06em;">Profesional</span><br/>
            <span style="font-size:16px;font-weight:700;color:#14111c;">${vars.profesional}</span>
          </td>
        </tr>` : ""}
      </table>

      <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.6;">
        Si necesitas cancelar o reprogramar, contáctanos con anticipación. ¡Te esperamos!
      </p>
    </div>
  `;
  return { subject, html: baseLayout(content, `Tu cita de ${vars.servicio} es mañana a las ${vars.hora}.`) };
}

export function buildEmail2h(vars: TemplateVars): { subject: string; html: string } {
  const subject = `⏰ Tu cita es en 2 horas, ${vars.nombre}`;
  const content = `
    ${accentBar()}
    <div style="padding:40px 40px 36px;">
      <p style="font-size:28px;margin:0 0 6px;">⏰</p>
      <h1 style="font-size:22px;font-weight:800;color:#14111c;margin:0 0 8px;letter-spacing:-0.5px;">
        ¡Ya casi! Tu cita es en 2 horas
      </h1>
      <p style="font-size:15px;color:#6b7280;margin:0 0 28px;">
        Hola <strong style="color:#14111c;">${vars.nombre}</strong>, te recordamos que tu cita es muy pronto.
      </p>

      <div style="background:linear-gradient(135deg,rgba(251,15,5,0.06),rgba(0,39,254,0.04));border:1px solid rgba(251,15,5,0.15);border-radius:12px;padding:20px 24px;margin:0 0 28px;">
        <p style="margin:0;font-size:15px;color:#14111c;">
          <strong>${vars.servicio}</strong> · <strong>${vars.hora}</strong>
          ${vars.profesional ? ` · con <strong>${vars.profesional}</strong>` : ""}
        </p>
      </div>

      <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.6;">
        ¡Te esperamos puntualmente! 🙌
      </p>
    </div>
  `;
  return { subject, html: baseLayout(content, `Tu cita de ${vars.servicio} es a las ${vars.hora}.`) };
}

export function buildEmailPost(vars: TemplateVars): { subject: string; html: string } {
  const subject = `¿Cómo estuvo tu visita, ${vars.nombre}? 🙏`;
  const content = `
    ${accentBar()}
    <div style="padding:40px 40px 36px;">
      <p style="font-size:28px;margin:0 0 6px;">🙏</p>
      <h1 style="font-size:22px;font-weight:800;color:#14111c;margin:0 0 8px;letter-spacing:-0.5px;">
        ¡Gracias por tu visita!
      </h1>
      <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">
        Hola <strong style="color:#14111c;">${vars.nombre}</strong>, esperamos que hayas disfrutado tu
        servicio de <strong style="color:#14111c;">${vars.servicio}</strong>. Tu opinión nos ayuda a mejorar.
      </p>

      <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;">
        Si tienes un momento, deja tu reseña en Google. ¡Nos ayuda muchísimo y toma solo 30 segundos!
      </p>

      <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.6;">
        ¡Esperamos verte pronto! 💫
      </p>
    </div>
  `;
  return { subject, html: baseLayout(content, `Gracias por tu visita, ${vars.nombre}. Cuéntanos cómo estuvo.`) };
}
