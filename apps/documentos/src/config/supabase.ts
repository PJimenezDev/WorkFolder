import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Usamos Service Role para saltar RLS en operaciones de sistema (como auditoría)
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);