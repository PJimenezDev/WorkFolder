import { supabase } from "../config/supabase.js";
import { encryptBuffer, decryptBuffer, generateKey } from "./encryption.service.js";
import { createAuditLog } from "./audit.service.js";
import crypto from "crypto";

/**
 * Sube, cifra y registra un documento
 */
export async function uploadDocument(input: any) {
  const documentId = crypto.randomUUID();
  const encKey = generateKey(input.ownerId);

  // 1. Cifrar el buffer original
  const { payload, originalHash } = encryptBuffer(input.fileBuffer, encKey.keyMaterial, encKey.id);
  const encryptedBuffer = Buffer.from(JSON.stringify(payload));

  // 2. Subir a Supabase Storage
  const storagePath = `docs/${input.ownerId}/${documentId}`;
  const { error: storageError } = await supabase.storage
    .from("workfolder-documents")
    .upload(storagePath, encryptedBuffer);

  if (storageError) throw storageError;

  // 3. Guardar metadatos en la DB
  // Nota: Asegúrate de que los nombres de columnas coincidan con tu tabla SQL
  const documentData = {
    id: documentId,
    owner_id: input.ownerId,
    name: input.name,
    storage_path: storagePath,
    original_hash: originalHash,
    mime_type: input.mimeType,
    size_bytes: input.fileBuffer.length,
    status: 'active',
    created_at: new Date()
  };

  const { error: dbError } = await supabase.from("documents").insert(documentData);
  if (dbError) throw dbError;

  // 4. Registrar auditoría
  await createAuditLog({
    action: "document:created",
    resourceId: documentId,
    resourceType: "document",
    context: input.context,
    newState: { name: input.name, size: input.fileBuffer.length }
  });

  return documentData;
}

/**
 * Descarga y descifra un documento
 */
export async function downloadDocument(documentId: string, context: any) {
  // 1. Obtener metadatos de la DB
  const { data: doc, error: dbError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (dbError || !doc) throw new Error("Documento no encontrado");

  // 2. Descargar el contenido cifrado desde Storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from("workfolder-documents")
    .download(doc.storage_path);

  if (storageError || !storageData) throw storageError;

  // 3. Parsear el JSON cifrado y descifrar
  // Necesitarás obtener la llave (keyMaterial). Aquí asumo que la manejas vía ID o DB.
  // Por simplicidad, este ejemplo requiere que encryption.service tenga acceso a las llaves.
  const encryptedPayload = JSON.parse(await storageData.text());
  
  // IMPORTANTE: Aquí deberías recuperar la 'keyMaterial' asociada al payload.keyId
  // Si usas una Master Key local para pruebas:
  const masterKey = process.env.MASTER_ENCRYPTION_KEY!; 
  
  const { buffer: decryptedBuffer } = decryptBuffer(encryptedPayload, masterKey);

  // 4. Auditoría de acceso
  await createAuditLog({
    action: "document:accessed",
    resourceId: documentId,
    resourceType: "document",
    context
  });

  return { document: doc, decryptedBuffer };
}

/**
 * Lista los documentos de un dueño específico
 */
export async function listDocuments(ownerId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Eliminación lógica (Soft Delete)
 */
export async function deleteDocument(documentId: string, context: any) {
  const { error } = await supabase
    .from("documents")
    .update({ status: "deleted", updated_at: new Date() })
    .eq("id", documentId);

  if (error) throw error;

  await createAuditLog({
    action: "document:deleted",
    resourceId: documentId,
    resourceType: "document",
    context
  });
}