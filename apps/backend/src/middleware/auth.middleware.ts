// src/middleware/auth.middleware.ts
//
// Middleware de autenticación para WorkFolder.
//
// En producción: valida el JWT emitido por Supabase Auth y verifica
// que el usuario haya completado MFA (TOTP).
//
// En desarrollo local: acepta un header "x-dev-user-id" para simular
// distintos usuarios sin necesitar un token real.

import type { Request, Response, NextFunction } from "express";

// ─── Extensión del tipo Request ──────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        subscriptionTier: string;
        mfaVerified: boolean;
      };
    }
  }
}

// ─── Contexto de auditoría del request ──────────────────────────────────────

export function extractAuditContext(req: Request) {
  return {
    userId: req.user?.id ?? "anonymous",
    ipAddress: (
      Array.isArray(req.headers["x-forwarded-for"])
        ? req.headers["x-forwarded-for"][0]
        : req.headers["x-forwarded-for"]?.split(",")[0]
    )?.trim() ??
      req.socket.remoteAddress ??
      "unknown",
    userAgent: req.headers["user-agent"] ?? "unknown",
    // geoLocation: en producción se resuelve via MaxMind o ip-api
  };
}

// ─── Middleware principal ────────────────────────────────────────────────────

/**
 * Valida la autenticación del request.
 *
 * Flujo de producción (Supabase JWT):
 *   1. Extraer Bearer token del header Authorization.
 *   2. Verificar firma JWT con la clave pública de Supabase.
 *   3. Confirmar que el claim "aal" (Authentication Assurance Level) sea "aal2"
 *      — esto garantiza que el usuario completó MFA/TOTP.
 *   4. Inyectar req.user con los datos del token.
 *
 * Flujo local (stub):
 *   - Si hay header "x-dev-user-id", se usa como ID del usuario.
 *   - De lo contrario, se usa un usuario de desarrollo por defecto.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    // Stub para desarrollo local — nunca usar en producción
    const devUserId = (req.headers["x-dev-user-id"] as string) ?? "dev-user-001";
    req.user = {
      id: devUserId,
      email: `${devUserId}@workfolder.local`,
      role: "admin",
      subscriptionTier: "business",
      mfaVerified: true,
    };
    return next();
  }

  // ── Producción: validar JWT de Supabase ──
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Token de autenticación requerido.",
      },
    });
    return;
  }

  try {
    // TODO: cuando se integre Supabase real, usar:
    // const { data: { user }, error } = await supabase.auth.getUser(token);
    // Verificar que user.factors incluya TOTP completado (aal2).

    const _token = authHeader.replace("Bearer ", "");
    // Por ahora lanzamos error claro para no dar falsa sensación de seguridad.
    throw new Error("JWT validation not yet implemented. Use development mode.");
  } catch (err) {
    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: err instanceof Error ? err.message : "Token inválido.",
      },
    });
  }
}

/**
 * Middleware que verifica que el usuario tenga un rol mínimo requerido.
 * Uso: router.delete("/...", authMiddleware, requireRole("admin"), handler)
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Acción no permitida para el rol '${req.user.role}'. Roles requeridos: ${allowedRoles.join(", ")}.`,
        },
      });
      return;
    }
    next();
  };
}
