// src/services/encryption.service.ts
//
// Servicio de cifrado AES-256-GCM para WorkFolder.
//
// Inspirado en los scripts Python de Fernet (encrypt/decrypt),
// pero usando el estándar AES-256-GCM del PRD que ofrece:
//   • Confidencialidad   → AES-256 (misma fuerza que Fernet)
//   • Integridad         → GCM AuthTag (Fernet usa HMAC-SHA256)
//   • Autenticidad       → IV único por operación
//   • Sin dependencias externas → solo el módulo nativo `crypto` de Node.js
//
// Analogía con Python:
//   generar_key()  →  generateKey()
//   cargar_key()   →  loadKeyFromBase64()
//   encrypt()      →  encryptBuffer()
//   decrypt()      →  decryptBuffer()

import crypto from "crypto";
import { randomUUID } from "crypto";
import type { EncryptedPayload, EncryptionKey } from "@workfolder/types";

// ─── Constantes ─────────────────────────────────────────────────────────────

const ALGORITHM = "aes-256-gcm" as const;
const KEY_LENGTH_BYTES = 32; // 256 bits
const IV_LENGTH_BYTES = 12;  // 96 bits — recomendado para GCM
const AUTH_TAG_LENGTH = 16;  // 128 bits — máxima seguridad GCM

// ─── Tipos internos ──────────────────────────────────────────────────────────

export interface EncryptionResult {
  payload: EncryptedPayload;
  /** Hash SHA-256 del buffer ORIGINAL antes de cifrar — para auditoría */
  originalHash: string;
}

export interface DecryptionResult {
  buffer: Buffer;
  /** Verificación de integridad: hash del buffer descifrado */
  integrityHash: string;
}

// ─── Gestión de llaves ───────────────────────────────────────────────────────

export function generateKey(ownerId: string, documentId?: string): EncryptionKey {
  const rawKey = crypto.randomBytes(KEY_LENGTH_BYTES);
  const key: EncryptionKey = {
    id: randomUUID(),
    keyMaterial: rawKey.toString("base64"),
    ownerId,
    createdAt: new Date(),
  };
  if (documentId !== undefined) {
    key.documentId = documentId;
  }
  return key;
}

/**
 * Carga una llave desde su representación Base64 almacenada.
 * Equivalente a: `cargar_key()` en Python.
 *
 * @param base64Key - Llave en Base64 tal como está guardada en la BD.
 * @returns Buffer de 32 bytes listo para usar con crypto.
 */
export function loadKeyFromBase64(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `[EncryptionService] Llave inválida: se esperan ${KEY_LENGTH_BYTES} bytes, se recibieron ${key.length}.`
    );
  }
  return key;
}

/**
 * Calcula el hash SHA-256 de un buffer — usado para el "Evento de Vida: Creación".
 * Este hash se guarda en la tabla de documentos para verificar integridad futura.
 */
export function hashBuffer(data: Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

// ─── Cifrado ─────────────────────────────────────────────────────────────────

/**
 * Cifra un buffer con AES-256-GCM.
 * Equivalente a: `f.encrypt(file_data)` en Python.
 *
 * Diferencias respecto a Fernet:
 *   • Fernet: AES-128-CBC + HMAC-SHA256 en un solo token.
 *   • WorkFolder: AES-256-GCM — cifrado autenticado más eficiente y seguro.
 *   • El IV y el AuthTag se guardan por separado en el payload estructurado.
 *
 * @param plaintext  - Datos a cifrar (p.ej. Buffer del PDF o imagen subida).
 * @param keyMaterial - Llave AES-256 en Base64 (de la BD).
 * @param keyId       - ID de la llave para poder identificarla al descifrar.
 * @returns EncryptionResult con el payload cifrado y el hash original para auditoría.
 */
export function encryptBuffer(
  plaintext: Buffer,
  keyMaterial: string,
  keyId: string
): EncryptionResult {
  const key = loadKeyFromBase64(keyMaterial);

  // Hash del contenido ORIGINAL (pre-cifrado) — se guarda en la BD como prueba de integridad.
  const originalHash = hashBuffer(plaintext);

  // IV único por operación — NUNCA reutilizar IV con la misma llave en GCM.
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    iv: iv.toString("base64"),
    ciphertext: encrypted.toString("base64"),
    authTag: authTag.toString("base64"),
    keyId,
  };

  return { payload, originalHash };
}

// ─── Descifrado ──────────────────────────────────────────────────────────────

/**
 * Descifra un payload AES-256-GCM.
 * Equivalente a: `f.decrypt(encrypted_data)` en Python.
 *
 * GCM verifica automáticamente el AuthTag — si el archivo fue alterado
 * (tamper detection), `decipher.final()` lanza un error, protegiendo
 * contra manipulación silenciosa de datos.
 *
 * @param payload     - El objeto EncryptedPayload tal como se guardó.
 * @param keyMaterial - Llave AES-256 en Base64.
 * @returns Buffer con los datos originales descifrados.
 * @throws Error si el AuthTag no coincide (integridad comprometida).
 */
export function decryptBuffer(
  payload: EncryptedPayload,
  keyMaterial: string
): DecryptionResult {
  const key = loadKeyFromBase64(keyMaterial);

  const iv = Buffer.from(payload.iv, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted: Buffer;
  try {
    decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    // GCM lanza aquí si el AuthTag no coincide — el archivo fue modificado.
    throw new Error(
      "[EncryptionService] Fallo de autenticación GCM: el documento pudo haber sido alterado. Acceso denegado."
    );
  }

  return {
    buffer: decrypted,
    integrityHash: hashBuffer(decrypted),
  };
}

// ─── Rotación de llaves ───────────────────────────────────────────────────────

/**
 * Re-cifra un payload con una nueva llave (rotación).
 * Útil para el tier Enterprise donde las llaves se rotan periódicamente.
 *
 * @param payload     - Payload cifrado con la llave antigua.
 * @param oldKey      - Llave antigua en Base64.
 * @param newKeyData  - Nueva EncryptionKey generada con generateKey().
 */
export function rotateKey(
  payload: EncryptedPayload,
  oldKey: string,
  newKeyData: EncryptionKey
): EncryptionResult {
  const { buffer } = decryptBuffer(payload, oldKey);
  return encryptBuffer(buffer, newKeyData.keyMaterial, newKeyData.id);
}
