import { createClient } from "@supabase/supabase-js";

/** Service-role client: bypasses RLS. Server-only (cron route); never import from client code. */
export const createAdminClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
