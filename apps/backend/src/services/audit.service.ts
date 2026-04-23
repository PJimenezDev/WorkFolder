// src/services/audit.service.ts
//
// Servicio de Auditoría Inmutable — "Eventos de Vida" de WorkFolder.
//
// Principios de diseño:
//   • Los logs son APPEND-ONLY: nunca se modifican ni eliminan.
//   • Cada log incluye contexto forense completo (IP, userAgent, geoLocation).
//   • En producción se escriben a Supabase PostgreSQL con RLS que solo permite INSERT.
//   • En desarrollo local se escriben en memoria (array en proceso) y se loguean a consola.

import { randomUUID } from "crypto";
import type { AuditAction, AuditLog } from "@workfolder/types";
import { supabase } from "../config/supabase.js";

// ─── Store en memoria (solo desarrollo local) ─────────────────────────────────

const localAuditStore: AuditLog[] = [];

// ─── Request context ─────────────────────────────────────────────────────────

export interface AuditContext {
  userId: string;
  ipAddress: string;
  userAgent: string;
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface CreateAuditLogInput {
  action: AuditAction;
  resourceId: string;
  resourceType: "document" | "user" | "key";
  context: AuditContext;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
}

// ─── Servicio ────────────────────────────────────────────────────────────────

/**
 * Registra un evento de auditoría inmutable.
 *
 * En producción: persiste en Supabase PostgreSQL con una política RLS
 * que solo permite INSERT — ningún usuario puede UPDATE o DELETE logs.
 *
 * En desarrollo local: almacena en memoria y lo imprime por consola.
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
  const log: AuditLog = {
    id: randomUUID(),
    userId: input.context.userId,
    action: input.action,
    resourceId: input.resourceId,
    resourceType: input.resourceType,
    ipAddress: input.context.ipAddress,
    userAgent: input.context.userAgent,
    geoLocation: input.context.geoLocation || {},
    previousState: input.previousState || {},
    newState: input.newState || {},
    immutable: true,
    createdAt: new Date(),
  };

  // Persistencia local en desarrollo
  localAuditStore.push(log);

  // Persistencia en Supabase (stub en local, real en producción)
  const { error } = await supabase.from("audit_logs").insert(log);
  if (error) {
    console.error("[AuditService] Error al persistir log en Supabase:", error.message);
    // No lanzamos error — el log ya está en memoria. En producción debería ir a una cola.
  }

  console.info(
    `[AUDIT] ${log.createdAt.toISOString()} | ${log.action} | user=${log.userId} | resource=${log.resourceType}:${log.resourceId} | ip=${log.ipAddress}`
  );

  return log;
}

/**
 * Retorna los últimos N logs de auditoría del store local.
 * En producción esta función haría un SELECT paginado en Supabase con filtros.
 */
export async function getAuditLogs(
  resourceId?: string,
  limit = 50
): Promise<AuditLog[]> {
  const filtered = resourceId
    ? localAuditStore.filter((l) => l.resourceId === resourceId)
    : localAuditStore;

  return filtered.slice(-limit).reverse();
}

/**
 * Retorna el store en memoria completo (útil para debugging en local).
 */
export function getLocalAuditStore(): Readonly<AuditLog[]> {
  return Object.freeze([...localAuditStore]);
}
