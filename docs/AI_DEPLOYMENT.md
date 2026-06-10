# Zyncra AI Booking Assistant — Guía de Despliegue

## Arquitectura

```
WhatsApp Cloud API
       ↓ webhook POST
/api/whatsapp/webhook  (Next.js / Vercel)
       ↓ HTTP
OpenClaw  (Oracle Cloud — Docker)
       ↓ tool calls
/api/ai/*  (Next.js — Vercel o Docker)
       ↓ Supabase service role
Supabase PostgreSQL
```

---

## 1. Preparar Supabase

```bash
# Aplicar migración desde la raíz del proyecto
supabase db push
# o manualmente:
# psql $DATABASE_URL < supabase/migrations/20260609_ai_booking_assistant.sql
```

Las tablas nuevas son:
- `ai_conversations` — historial de conversación por cliente
- `whatsapp_config` — credenciales WhatsApp por tenant

---

## 2. Preparar Oracle Cloud Free Tier

### Instancia recomendada
- **Shape**: VM.Standard.A1.Flex (ARM) — 4 OCPUs, 24 GB RAM (Free Tier)
- **OS**: Ubuntu 22.04 LTS ARM64
- **Storage**: 50 GB boot volume

### Reglas de seguridad (Security List)
Abre los siguientes puertos en el grupo de seguridad de la instancia:

| Puerto | Protocolo | Descripción |
|--------|-----------|-------------|
| 22     | TCP       | SSH         |
| 80     | TCP       | HTTP (redirige a HTTPS) |
| 443    | TCP       | HTTPS       |

OpenClaw (8080) y Ollama (11434) **no** deben exponerse al exterior — solo son accesibles dentro de la red Docker interna.

### Instalar Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Reiniciar sesión SSH
```

---

## 3. Desplegar en Oracle

```bash
# Clonar el repo
git clone https://github.com/tu-org/zyncra.git
cd zyncra

# Copiar y configurar variables de entorno
cp .env.production.example .env.production
nano .env.production   # ← editar con valores reales

# Para build Docker de Next.js, DOCKER_BUILD=1 activa output standalone
# (ya está en .env.production.example)

# Construir e iniciar todos los servicios
docker compose up -d --build

# Ver logs
docker compose logs -f
```

---

## 4. Descargar modelos Ollama

```bash
# Una vez que el contenedor ollama esté corriendo:
docker compose exec ollama ollama pull qwen3:14b
docker compose exec ollama ollama pull qwen3:8b   # fallback

# Verificar
docker compose exec ollama ollama list
```

Esto descarga ~8 GB (14b). Asegúrate de tener espacio suficiente.

---

## 5. Configurar OpenClaw

OpenClaw lee su configuración desde `/app/config/` (montado desde `./openclaw/` en Docker).

Edita las variables de entorno en `.env.production`:
```env
AI_API_SECRET=secreto-largo-y-aleatorio
OPENCLAW_API_SECRET=otro-secreto-largo
ZYNCRA_API_URL=https://tu-dominio.com    # o http://zyncra:3000 si Zyncra también está en Docker
OLLAMA_BASE_URL=http://ollama:11434
```

---

## 6. SSL con Let's Encrypt

```bash
# Instalar certbot
sudo apt install certbot

# Obtener certificado (detener nginx temporalmente)
docker compose stop nginx
sudo certbot certonly --standalone -d tu-dominio.com

# Copiar certificados al directorio de nginx
sudo cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem ./nginx/certs/
sudo cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem   ./nginx/certs/
sudo chown $USER:$USER ./nginx/certs/*.pem

# Editar nginx/nginx.conf → cambiar "your-domain.com" por tu dominio
nano nginx/nginx.conf

# Reiniciar nginx
docker compose start nginx
```

---

## 7. Configurar WhatsApp Cloud API

### En Meta for Developers
1. Crea una app → Producto: WhatsApp
2. Añade un número de WhatsApp Business
3. Anota:
   - `Phone Number ID`
   - `Access Token` (System User Token de larga duración)
4. Configura el webhook:
   - **URL**: `https://tu-dominio.com/api/whatsapp/webhook`
   - **Verify Token**: el valor de `WHATSAPP_VERIFY_TOKEN` en `.env.production`
   - **Suscribir a**: `messages`

### En Supabase — registrar el negocio
```sql
INSERT INTO whatsapp_config (tenant_id, phone_number_id, access_token)
VALUES (
  'uuid-del-tenant',
  '123456789012345',   -- Phone Number ID de Meta
  'EAAxxxxx...'        -- System User Token
);
```

---

## 8. Variables de entorno requeridas

| Variable | Descripción |
|----------|-------------|
| `AI_API_SECRET` | Token que autentica las llamadas OpenClaw → Zyncra |
| `OPENCLAW_API_URL` | URL del servicio OpenClaw (`http://openclaw:8080` en Docker) |
| `OPENCLAW_API_SECRET` | Token de la API de OpenClaw |
| `WHATSAPP_VERIFY_TOKEN` | Token para verificar el webhook con Meta |
| `WHATSAPP_ACCESS_TOKEN` | Token de acceso global (solo para setup single-tenant) |

---

## 9. Verificar el sistema

```bash
# Test de salud
curl https://tu-dominio.com/api/health

# Test de servicio AI (reemplaza los valores)
curl -X POST https://tu-dominio.com/api/ai/services \
  -H "Authorization: Bearer $AI_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid-del-tenant"}'

# Test de disponibilidad
curl -X POST https://tu-dominio.com/api/ai/availability \
  -H "Authorization: Bearer $AI_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"uuid","service_id":"uuid","date":"2026-06-20"}'
```

---

## 10. Escalabilidad multi-tenant

Cada negocio que quiera activar el asistente de WhatsApp solo necesita:

1. Registrar su número de WhatsApp en `whatsapp_config`
2. Configurar el webhook apuntando al mismo endpoint (`/api/whatsapp/webhook`)
3. El sistema identifica el tenant automáticamente por el `phone_number_id`

Para escalar a cientos de negocios:
- **Ollama**: considerar GPU en Oracle (Paid Tier) o múltiples instancias con load balancing
- **OpenClaw**: escalar horizontalmente con Docker Swarm o Kubernetes
- **Cola de mensajes**: añadir Redis + BullMQ para procesar mensajes en background si el volumen sube
- **Rate limiting**: ajustar `nginx.conf` → `limit_req_zone` según el plan de cada tenant
