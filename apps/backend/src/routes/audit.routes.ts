// src/routes/audit.routes.ts
//
// Endpoints REST para consulta de logs de auditoría (solo lectura).
//
// GET /api/audit              → Últimos N logs del usuario autenticado
// GET /api/audit/:resourceId  → Historial de un recurso específico

import { Router } from "express";
import type { Request, Response } from "express";
import type { ApiResponse } from "@workfolder/types";
import { getAuditLogs } from "../services/audit.service.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// ─── GET /api/audit ───────────────────────────────────────────────────────────

/**
 * Retorna los últimos logs de auditoría.
 * Query params:
 *   - limit (default 50, max 200)
 *   - resourceId (opcional): filtrar por recurso específico
 */
router.get(
  "/",
  requireRole("admin", "owner"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const resourceId = req.query.resourceId as string | undefined;

      const logs = await getAuditLogs(resourceId, limit);

      res.json({
        success: true,
        data: logs,
        meta: { total: logs.length, limit },
      } satisfies ApiResponse);
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: "AUDIT_ERROR", message: "Error al consultar logs de auditoría." },
      } satisfies ApiResponse);
    }
  }
);

// ─── GET /api/audit/:resourceId ───────────────────────────────────────────────

/**
 * Historial completo de un recurso (documento, usuario, llave).
 */
router.get(
  "/:resourceId",
  requireRole("admin", "owner"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const logs = await getAuditLogs(req.params.resourceId as string, 200);
      res.json({
        success: true,
        data: logs,
        meta: { total: logs.length },
      } satisfies ApiResponse);
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: "AUDIT_ERROR", message: "Error al consultar historial." },
      } satisfies ApiResponse);
    }
  }
);

export default router;
