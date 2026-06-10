-- ─────────────────────────────────────────────────────────────────────────────
-- AI Booking Assistant — conversation history & WhatsApp config
-- ─────────────────────────────────────────────────────────────────────────────

-- Conversation history per customer per tenant
CREATE TABLE IF NOT EXISTS ai_conversations (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id        uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone            text        NOT NULL,
  messages         jsonb       NOT NULL DEFAULT '[]'::jsonb,
  last_message_at  timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_lookup
  ON ai_conversations (tenant_id, phone);

-- Per-tenant WhatsApp Business configuration
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id        uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  phone_number_id  text        NOT NULL,   -- WhatsApp Business phone number ID
  access_token     text        NOT NULL,   -- System user token
  verify_token     text        NOT NULL DEFAULT gen_random_uuid()::text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE ai_conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config   ENABLE ROW LEVEL SECURITY;

-- Service-role (API routes) has full access via SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- These policies cover the admin panel accessing their own data via anon/user key.

CREATE POLICY "ai_conversations_tenant_owner"
  ON ai_conversations FOR ALL
  USING  (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "whatsapp_config_tenant_owner"
  ON whatsapp_config FOR ALL
  USING  (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
