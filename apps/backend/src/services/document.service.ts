// src/services/document.service.ts
//
// Servicio de documentos de WorkFolder.
//
// Orquesta el ciclo de vida completo de un documento:
//   1. Generar llave de cifrado única por documento.
//   2. Cifrar el buffer con AES-256-GCM antes de subir a Storage.
//   3. Persistir metadatos + hash original en PostgreSQL.
//   4. Registrar el evento de auditoría ("Evento de Vida").
//
// En producción: los pasos de Storage y BD van contra Supabase real.
// En desarrollo local: Storage usa un Map en memoria, BD usa el stub.

import { randomUUID } from "crypto";
import type { Document, EncryptionKey } from "@workfolder/types";
import {
  generateKey,
  encryptBuffer,
  decryptBuffer,
  hashBuffer,
} from "./encryption.service.js";
import { createAuditLog, type AuditContext } from "./audit.service.js";
import { supabase } from "../config/supabase.js";

// ─── Store en memoria (solo desarrollo local) ─────────────────────────────────

/** Map<documentId, { meta: Document, encryptedData: Buffer, key: EncryptionKey }> */
const localDocumentStore = new Map<
  string,
  { meta: Document; encryptedData: Buffer; key: EncryptionKey }
>();

// ─── Tipos de entrada ────────────────────────────────────────────────────────

export interface UploadDocumentInput {
  ownerId: string;
  name: string;
  mimeType: string;
  fileBuffer: Buffer;
  context: AuditContext;
  metadata?: Record<string, unknown>;
}

export interface DownloadDocumentResult {
  document: Document;
  decryptedBuffer: Buffer;
}

// ─── Operaciones ─────────────────────────────────────────────────────────────

/**
 * Sube un documento cifrándolo antes de almacenarlo.
 *
 * Flujo:
 *   plaintext → hash SHA-256 → AES-256-GCM encrypt → Supabase Storage
 *                                                  └─→ metadatos en PostgreSQL
 *                                                  └─→ audit log
 */
export async function uploadDocument(input: UploadDocumentInput): Promise<Document> {
  const documentId = randomUUID();

  // 1. Generar llave única para este documento
  const encKey = generateKey(input.ownerId, documentId);

  // 2. Cifrar el archivo
  const { payload, originalHash } = encryptBuffer(
    input.fileBuffer,
    encKey.keyMaterial,
    encKey.id
  );

  // 3. Serializar el payload cifrado a Buffer para enviarlo a Storage
  const encryptedBuffer = Buffer.from(JSON.stringify(payload), "utf-8");

  // 4. Construir la ruta en Storage: org/{ownerId}/docs/{documentId}
  const storagePath = `org/${input.ownerId}/docs/${documentId}`;

  // 5. Subir a Supabase Storage (en local: stub no hace nada)
  const { error: storageError } = await supabase
    .storage
    .from("workfolder-documents")
    .upload(storagePath, encryptedBuffer, { contentType: "application/octet-stream" });

  if (storageError) {
    throw new Error(`[DocumentService] Error en Storage: ${storageError.message}`);
  }

  // 6. Construir metadatos del documento
  const document: Document = {
    id: documentId,
    ownerId: input.ownerId,
    name: input.name,
    storagePath,
    originalHash,
    encryptionKeyId: encKey.id,
    mimeType: input.mimeType,
    sizeBytes: input.fileBuffer.length,
    version: 1,
    status: "active",
    metadata: input.metadata ?? {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 7. Persistir metadatos en PostgreSQL (en local: stub + store en memoria)
  localDocumentStore.set(documentId, {
    meta: document,
    encryptedData: encryptedBuffer,
    key: encKey,
  });

  await supabase.from("documents").insert(document);

  // 8. Registrar evento de auditoría: "document:created"
  await createAuditLog({
    action: "document:created",
    resourceId: documentId,
    resourceType: "document",
    context: input.context,
    newState: {
      name: document.name,
      sizeBytes: document.sizeBytes,
      originalHash: document.originalHash,
      version: document.version,
    },
  });

  console.info(
    `[DocumentService] Documento cifrado y almacenado: ${document.name} (id=${documentId})`
  );

  return document;
}

/**
 * Descarga y descifra un documento.
 *
 * Verifica integridad del AuthTag GCM antes de devolver los bytes.
 * Si el archivo fue tampered en Storage, lanza un error de seguridad.
 */
export async function downloadDocument(
  documentId: string,
  context: AuditContext
): Promise<DownloadDocumentResult> {
  // 1. Obtener metadatos y llave del store local
  const stored = localDocumentStore.get(documentId);
  if (!stored) {
    throw new Error(`[DocumentService] Documento no encontrado: ${documentId}`);
  }

  const { meta, encryptedData, key } = stored;

  // 2. En producción: descargar desde Supabase Storage
  // const { data, error } = await supabase.storage.from("workfolder-documents").download(meta.storagePath);

  // 3. Deserializar el payload cifrado
  const payload = JSON.parse(encryptedData.toString("utf-8"));

  // 4. Descifrar — GCM verifica integridad automáticamente
  const { buffer: decryptedBuffer, integrityHash } = decryptBuffer(payload, key.keyMaterial);

  // 5. Verificar que el hash del contenido descifrado coincide con el original guardado
  if (integrityHash !== meta.originalHash) {
    throw new Error(
      `[DocumentService] ALERTA DE SEGURIDAD: El hash del documento descifrado no coincide. Posible manipulación detectada. documentId=${documentId}`
    );
  }

  // 6. Registrar evento de auditoría: "document:accessed"
  await createAuditLog({
    action: "document:accessed",
    resourceId: documentId,
    resourceType: "document",
    context,
    newState: { downloadedAt: new Date().toISOString() },
  });

  return { document: meta, decryptedBuffer };
}

/**
 * Lista los documentos de un usuario desde el store local.
 * En producción: SELECT con RLS de Supabase (el usuario solo ve sus documentos).
 */
export async function listDocuments(ownerId: string): Promise<Document[]> {
  const docs: Document[] = [];
  for (const entry of localDocumentStore.values()) {
    if (entry.meta.ownerId === ownerId && entry.meta.status === "active") {
      docs.push(entry.meta);
    }
  }
  return docs;
}

/**
 * Elimina lógicamente un documento (soft delete).
 * El archivo permanece en Storage pero marcado como "deleted" — preserva la trazabilidad.
 */
export async function deleteDocument(
  documentId: string,
  context: AuditContext
): Promise<void> {
  const stored = localDocumentStore.get(documentId);
  if (!stored) {
    throw new Error(`[DocumentService] Documento no encontrado: ${documentId}`);
  }

  const previousState = { status: stored.meta.status };
  stored.meta.status = "deleted";
  stored.meta.updatedAt = new Date();

  await createAuditLog({
    action: "document:deleted",
    resourceId: documentId,
    resourceType: "document",
    context,
    previousState,
    newState: { status: "deleted", deletedAt: new Date().toISOString() },
  });

  console.info(`[DocumentService] Documento eliminado (soft): id=${documentId}`);
}

/**
 * Retorna el hash SHA-256 actual del documento almacenado.
 * Sirve para verificar que el archivo no fue alterado en Storage entre subidas.
 */
export function verifyDocumentIntegrity(documentId: string): {
  valid: boolean;
  storedHash: string;
  currentHash: string;
} {
  const stored = localDocumentStore.get(documentId);
  if (!stored) throw new Error(`Documento no encontrado: ${documentId}`);

  const currentHash = hashBuffer(stored.encryptedData);
  return {
    valid: currentHash === stored.meta.originalHash,
    storedHash: stored.meta.originalHash,
    currentHash,
  };
}
