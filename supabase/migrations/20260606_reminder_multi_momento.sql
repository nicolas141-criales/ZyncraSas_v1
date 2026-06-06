-- =====================================================================
-- Zyncra – Recordatorios multi-momento
-- Agrega soporte para 3 plantillas: 24h antes, 2h antes, post-servicio
-- =====================================================================

ALTER TABLE public.reminder_settings
  ADD COLUMN IF NOT EXISTS enabled_24h   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS template_2h   text    NOT NULL DEFAULT 'Hola {{nombre}} 👋 Tu cita de {{servicio}} es en 2 horas ({{hora}}). ¡Ya casi! 🔔',
  ADD COLUMN IF NOT EXISTS enabled_2h    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_post text    NOT NULL DEFAULT E'Hola {{nombre}}, gracias por visitarnos hoy 🙏\n\n¿Cómo estuvo tu servicio de {{servicio}}? Tu opinión nos ayuda a mejorar. ¡Esperamos verte pronto!',
  ADD COLUMN IF NOT EXISTS enabled_post  boolean NOT NULL DEFAULT false;
