import type { Request, Response, NextFunction } from "express";

// Extendemos la interfaz de Express para incluir al usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email: string;
      };
    }
  }
}

/**
 * Extrae el contexto para los logs de auditoría
 */
export function extractAuditContext(req: Request) {
  return {
    userId: req.user?.id ?? "anonymous",
    ipAddress: req.ip || req.socket.remoteAddress || "unknown",
    userAgent: req.headers["user-agent"] ?? "unknown",
  };
}

/**
 * Middleware de Autenticación
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    // Modo Local: Simula un usuario administrador
    const devUserId = (req.headers["x-dev-user-id"] as string) ?? "dev-user-local";
    req.user = {
      id: devUserId,
      email: `${devUserId}@workfolder.local`,
      role: "admin",
    };
    return next();
  }

  // Lógica de Producción: Validar JWT de Supabase
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: { message: "No autorizado" } });
    return;
  }
  
  // Aquí iría la validación real con supabase.auth.getUser()
  next();
}

/**
 * Middleware de Roles
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: "Permisos insuficientes" }
      });
    }
    next();
  };
}