//
// Endpoints REST para gestión de documentos de WorkFolder.
//
// POST   /api/documents/upload     → Cifrar y subir un documento
// GET    /api/documents            → Listar documentos del usuario autenticado
// GET    /api/documents/:id        → Descargar y descifrar un documento
// DELETE /api/documents/:id        → Soft-delete de un documento
// GET    /api/documents/:id/verify → Verificar integridad del hash

import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import type { ApiResponse } from "@workfolder/types";
import {
  uploadDocument,
  downloadDocument,
  listDocuments,
  deleteDocument,
  verifyDocumentIntegrity,
} from "../services/document.service.js";
import { authMiddleware, requireRole, extractAuditContext } from "../middleware/auth.middleware.js";

const router = Router();

// Multer: archivos en memoria (no en disco) — máx 50 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  },
});

// Todos los endpoints de documentos requieren autenticación
router.use(authMiddleware);

// ─── POST /api/documents/upload ──────────────────────────────────────────────

/**
 * Cifra y sube un documento.
 *
 * Body (multipart/form-data):
 *   - file: archivo binario
 *   - metadata (opcional): JSON string con metadatos extra
 *
 * Response: Document metadata (sin el contenido cifrado)
 */
router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { code: "NO_FILE", message: "No se recibió ningún archivo." },
        } satisfies ApiResponse);
        return;
      }

      let metadata: Record<string, unknown> = {};
      if (req.body.metadata) {
        try {
          metadata = JSON.parse(req.body.metadata);
        } catch {
          // metadata inválido, se ignora
        }
      }

      const document = await uploadDocument({
        ownerId: req.user!.id,
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        fileBuffer: req.file.buffer,
        context: extractAuditContext(req),
        metadata,
      });

      res.status(201).json({
        success: true,
        data: document,
      } satisfies ApiResponse);
    } catch (err) {
      console.error("[DocumentRoute] Error en upload:", err);
      res.status(500).json({
        success: false,
        error: {
          code: "UPLOAD_ERROR",
          message: err instanceof Error ? err.message : "Error al subir el documento.",
        },
      } satisfies ApiResponse);
    }
  }
);

// ─── GET /api/documents ───────────────────────────────────────────────────────

/**
 * Lista los documentos activos del usuario autenticado.
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const documents = await listDocuments(req.user!.id);
    res.json({
      success: true,
      data: documents,
      meta: { total: documents.length },
    } satisfies ApiResponse);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: "LIST_ERROR", message: "Error al listar documentos." },
    } satisfies ApiResponse);
  }
});

// ─── GET /api/documents/:id ───────────────────────────────────────────────────

/**
 * Descarga y descifra un documento.
 * Devuelve el archivo original como stream binario.
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { document, decryptedBuffer } = await downloadDocument(
      req.params.id as string,
      extractAuditContext(req)
    );

    res.setHeader("Content-Type", document.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(document.name)}"`
    );
    res.setHeader("Content-Length", decryptedBuffer.length);
    res.send(decryptedBuffer);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al descargar.";
    const isNotFound = msg.includes("no encontrado");
    res.status(isNotFound ? 404 : 500).json({
      success: false,
      error: {
        code: isNotFound ? "NOT_FOUND" : "DOWNLOAD_ERROR",
        message: msg,
      },
    } satisfies ApiResponse);
  }
});

// ─── GET /api/documents/:id/verify ───────────────────────────────────────────

/**
 * Verifica la integridad del hash SHA-256 del documento.
 * Útil para auditorías y para detectar manipulación en Storage.
 */
router.get("/:id/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = verifyDocumentIntegrity(req.params.id as string);
    res.json({
      success: true,
      data: result,
    } satisfies ApiResponse);
  } catch (err) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Documento no encontrado." },
    } satisfies ApiResponse);
  }
});

// ─── DELETE /api/documents/:id ────────────────────────────────────────────────

/**
 * Soft-delete de un documento. Solo admins y owners.
 */
router.delete(
  "/:id",
  requireRole("admin", "owner"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      await deleteDocument(req.params.id as string, extractAuditContext(req));
      res.json({
        success: true,
        data: { message: "Documento eliminado correctamente." },
      } satisfies ApiResponse);
    } catch (err) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Documento no encontrado." },
      } satisfies ApiResponse);
    }
  }
);

export default router;
