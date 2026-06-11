-- =====================================================================
-- Zyncra · Security hardening — trigger/event-trigger functions
-- =====================================================================
-- Supabase advisors flagged these SECURITY DEFINER functions as callable by
-- anon/authenticated via PostgREST RPC (/rest/v1/rpc/...). They are trigger
-- functions (invoked by the engine when their trigger fires), never meant to be
-- called directly. Revoking EXECUTE does NOT affect the triggers (they run with
-- the function owner's rights). Also pins search_path (function_search_path_mutable).
-- =====================================================================

REVOKE EXECUTE ON FUNCTION public.fn_update_product_stock() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()         FROM PUBLIC;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.fn_update_product_stock() FROM anon';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()         FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.fn_update_product_stock() FROM authenticated';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()         FROM authenticated';
  END IF;
END $$;

ALTER FUNCTION public.fn_update_product_stock() SET search_path = public, pg_temp;
ALTER FUNCTION public.rls_auto_enable()         SET search_path = public, pg_temp;
