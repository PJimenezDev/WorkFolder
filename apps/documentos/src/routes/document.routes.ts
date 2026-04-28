import { Router } from "express";
import multer from "multer";
import { 
  uploadDocument, 
  downloadDocument, 
  listDocuments, 
  deleteDocument 
} from "../services/document.service.js";
import { authMiddleware, extractAuditContext, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// Configuración de Multer (Archivos en RAM)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Todas las rutas de este microservicio requieren estar logueado
router.use(authMiddleware);

/**
 * POST /api/documents/upload
 * Sube y cifra un archivo
 */
router.post("/upload", upload.single("file"), async (req: any, res) => {
  try {
    if (!req.file) throw new Error("Archivo no recibido");

    const document = await uploadDocument({
      ownerId: req.user!.id,
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      fileBuffer: req.file.buffer,
      context: extractAuditContext(req),
      metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
    });

    res.status(201).json({ success: true, data: document });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/documents
 * Lista documentos del usuario
 */
router.get("/", async (req, res) => {
  try {
    const docs = await listDocuments(req.user!.id);
    res.json({ success: true, data: docs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/documents/:id
 * Descarga y descifra el archivo
 */
router.get("/:id", async (req, res) => {
  try {
    const { document, decryptedBuffer } = await downloadDocument(
      req.params.id,
      extractAuditContext(req)
    );

    res.setHeader("Content-Type", document.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${document.name}"`);
    res.send(decryptedBuffer);
  } catch (err: any) {
    res.status(404).json({ success: false, error: { message: err.message } });
  }
});

router.delete("/:id", requireRole("admin", "owner"), async (req, res) => {
  try {
    await deleteDocument(req.params.id as string, extractAuditContext(req));
    res.json({ success: true, message: "Documento eliminado" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;