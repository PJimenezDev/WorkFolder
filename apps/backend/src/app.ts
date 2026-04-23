// src/app.ts
//
// Configuración de la aplicación Express de WorkFolder.
// Registra middlewares de seguridad, CORS, logging y rutas.
import type { ApiResponse } from "@workfolder/types";
import { env } from "./config/env.js";
import express, { type Application, type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import documentRoutes from "./routes/document.routes.js";
import auditRoutes from "./routes/audit.routes.js";

export function createApp(): Application {
  const app = express();

  // ─── Seguridad HTTP (Helmet) ────────────────────────────────────────────
  // Configura headers de seguridad: CSP, HSTS, X-Frame-Options, etc.
  app.use(helmet());

  // ─── CORS ───────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // Permite requests sin origin (curl, Postman) en desarrollo
        if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: Origin no permitido: ${origin}`));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-dev-user-id"],
      credentials: true,
    })
  );

  // ─── Rate Limiting ──────────────────────────────────────────────────────
  // Límite global: 100 requests / 15 min por IP
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Demasiadas solicitudes. Intenta nuevamente en 15 minutos.",
        },
      } satisfies ApiResponse,
    })
  );

  // Rate limit específico para uploads: 20 / 15 min por IP
  const uploadRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
      success: false,
      error: {
        code: "UPLOAD_RATE_LIMIT",
        message: "Límite de subidas alcanzado. Intenta nuevamente en 15 minutos.",
      },
    } satisfies ApiResponse,
  });

  // ─── Logging ────────────────────────────────────────────────────────────
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  // ─── Body parsers ───────────────────────────────────────────────────────
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ─── Health check ───────────────────────────────────────────────────────
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: "ok",
        service: "workfolder-backend",
        version: "1.0.0",
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    } satisfies ApiResponse);
  });

  // ─── Rutas API ──────────────────────────────────────────────────────────
  app.use("/api/documents", uploadRateLimit, documentRoutes);
  app.use("/api/audit", auditRoutes);

  // ─── 404 handler ────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Endpoint no encontrado.",
      },
    } satisfies ApiResponse);
  });

  // ─── Error handler global ───────────────────────────────────────────────
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[WorkFolder Error]", err);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          env.NODE_ENV === "development"
            ? err.message
            : "Error interno del servidor.",
      },
    } satisfies ApiResponse);
  });

  return app;
}