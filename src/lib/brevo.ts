const API_KEY = process.env.BREVO_API_KEY!;

// Template IDs created in Brevo account
const TEMPLATE_IDS = { "24h": 1, "2h": 2, "post": 3 } as const;

export type ReminderTemplateKey = keyof typeof TEMPLATE_IDS;

export interface ReminderEmailParams {
  nombre:        string;
  servicio:      string;
  fecha:         string;
  hora:          string;
  profesional?:  string;
  manage_url?:   string;
  business_name?: string;
  logo_url?:     string;
  primary_color?: string;
}

export async function sendReminderEmail(
  templateKey: ReminderTemplateKey,
  to: string,
  toName: string,
  params: ReminderEmailParams,
): Promise<void> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": API_KEY,
    },
    body: JSON.stringify({
      to:         [{ email: to, name: toName }],
      templateId: TEMPLATE_IDS[templateKey],
      params,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Brevo error ${res.status}: ${JSON.stringify(err)}`);
  }
}
