// ✅ Safe: create on demand
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function createSupabaseClient() {
  const supabaseUrl =Deno.env.get("LOCAL_DEV_SUPABASE_URL") ??
  Deno.env.get("SUPABASE_URL")!
  const supabaseServiceRoleKey =
  Deno.env.get("LOCAL_DEV_SUPABASE_SERVICE_ROLE_KEY")??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") !
  return createClient(supabaseUrl, supabaseServiceRoleKey)
}
