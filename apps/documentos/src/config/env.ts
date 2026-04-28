import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "3002", 10),
  
  // Supabase Local (CLI default)
  SUPABASE_URL: process.env.SUPABASE_URL ?? "http://127.0.0.1:54321",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  // Seguridad
  MASTER_ENCRYPTION_KEY: process.env.MASTER_ENCRYPTION_KEY ?? "c3R1Yi1tYXN0ZXIta2V5LXBhcmEtZGVzYXJyb2xsbw==",
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000").split(","),
} as const;