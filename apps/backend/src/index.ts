// src/index.ts
// Punto de entrada del backend de WorkFolder.
// Inicia el servidor Express y gestiona el graceful shutdown.

import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║              WorkFolder Backend — API REST               ║
╠══════════════════════════════════════════════════════════╣
║  Entorno  : ${env.NODE_ENV.padEnd(44)} ║
║  Puerto   : ${String(env.PORT).padEnd(44)} ║
║  Health   : http://localhost:${env.PORT}/health${" ".repeat(17)}║
╠══════════════════════════════════════════════════════════╣
║  Endpoints disponibles:                                  ║
║    POST   /api/documents/upload                          ║
║    GET    /api/documents                                 ║
║    GET    /api/documents/:id                             ║
║    GET    /api/documents/:id/verify                      ║
║    DELETE /api/documents/:id                             ║
║    GET    /api/audit                                     ║
║    GET    /api/audit/:resourceId                         ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────

function shutdown(signal: string) {
  console.log(`\n[WorkFolder] Señal ${signal} recibida. Cerrando servidor...`);
  server.close(() => {
    console.log("[WorkFolder] Servidor cerrado correctamente.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[WorkFolder] Promise no manejada:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[WorkFolder] Excepción no capturada:", err);
  process.exit(1);
});