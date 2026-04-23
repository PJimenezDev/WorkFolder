// src/config/env.ts
// Centraliza y valida las variables de entorno del backend.
// En desarrollo local se usan valores stub — en producción se cargan desde .env real.

import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(
      `[WorkFolder Config] Variable de entorno requerida no definida: ${key}`
    );
  }
  return value;
}

export const env = {
  // ─── Servidor ──────────────────────────────────────────────────────────
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "3001", 10),

  // ─── Supabase (stubs para desarrollo local) ────────────────────────────
  // En producción estos valores vienen del panel de Supabase.
  SUPABASE_URL: process.env.SUPABASE_URL ?? "http://localhost:54321",
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "local-stub-key",

  // ─── Cifrado ───────────────────────────────────────────────────────────
  // Llave maestra AES-256 en Base64 (32 bytes → 44 chars en Base64).
  // Generada con: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  MASTER_ENCRYPTION_KEY:
    process.env.MASTER_ENCRYPTION_KEY ??
    "c3R1Yi1tYXN0ZXIta2V5LXBhcmEtZGVzYXJyb2xsbw==", // solo dev

  // ─── Stripe ────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "sk_test_stub",
  STRIPE_WEBHOOK_SECRET:
    process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_stub",

  // ─── CORS ──────────────────────────────────────────────────────────────
  ALLOWED_ORIGINS: (
    process.env.ALLOWED_ORIGINS ?? "http://localhost:3000"
  ).split(","),
} as const;

export type Env = typeof env;