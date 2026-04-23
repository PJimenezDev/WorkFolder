// src/config/supabase.ts
// Cliente de Supabase para el backend (usa service_role para bypass de RLS cuando
// el propio backend necesita operar con privilegios elevados, ej. logs inmutables).
//
// NOTA LOCAL: En desarrollo, este cliente apunta al stub local.
// Para activar Supabase real, define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env

import { env } from "./env.js";

// Interfaz mínima que el cliente debe cumplir.
// Cuando instales @supabase/supabase-js, reemplaza el stub por:
//   import { createClient } from "@supabase/supabase-js";
//   export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

interface SupabaseStub {
  from: (table: string) => {
    insert: (data: unknown) => Promise<{ error: null | Error }>;
    select: (cols?: string) => {
      eq: (col: string, val: unknown) => Promise<{ data: unknown[]; error: null | Error }>;
    };
  };
  storage: {
    from: (bucket: string) => {
      upload: (path: string, file: Buffer, opts?: unknown) => Promise<{ data: unknown; error: null | Error }>;
      download: (path: string) => Promise<{ data: Buffer | null; error: null | Error }>;
      remove: (paths: string[]) => Promise<{ error: null | Error }>;
    };
  };
}

function createLocalStub(): SupabaseStub {
  console.warn(
    "[Supabase] Usando cliente STUB local. Define SUPABASE_URL en .env para conectar a Supabase real."
  );
  return {
    from: (_table: string) => ({
      insert: async (_data: unknown) => ({ error: null }),
      select: (_cols?: string) => ({
        eq: async (_col: string, _val: unknown) => ({ data: [], error: null }),
      }),
    }),
    storage: {
      from: (_bucket: string) => ({
        upload: async (_path: string, _file: Buffer) => ({ data: {}, error: null }),
        download: async (_path: string) => ({ data: null, error: new Error("Stub: sin datos locales") }),
        remove: async (_paths: string[]) => ({ error: null }),
      }),
    },
  };
}

// Cuando @supabase/supabase-js esté instalado, cambiar esto por:
// export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
export const supabase: SupabaseStub = createLocalStub();
