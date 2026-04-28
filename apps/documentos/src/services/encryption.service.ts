import crypto from "crypto";

// ─── Constantes de Seguridad ────────────────────────────────────────────────
const ALGORITHM = "aes-256-gcm" as const;
const KEY_LENGTH_BYTES = 32; 
const IV_LENGTH_BYTES = 12;  
const AUTH_TAG_LENGTH = 16;  

// ─── Gestión de Llaves ──────────────────────────────────────────────────────

export function generateKey(ownerId: string) {
  return {
    id: crypto.randomUUID(),
    keyMaterial: crypto.randomBytes(KEY_LENGTH_BYTES).toString("base64"),
    ownerId,
    createdAt: new Date(),
  };
}

export function loadKeyFromBase64(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(`Llave inválida: se esperan ${KEY_LENGTH_BYTES} bytes.`);
  }
  return key;
}

// ─── Cifrado (Encrypt) ──────────────────────────────────────────────────────

export function encryptBuffer(plaintext: Buffer, keyMaterial: string, keyId: string) {
  const key = loadKeyFromBase64(keyMaterial);
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    payload: {
      iv: iv.toString("base64"),
      ciphertext: encrypted.toString("base64"),
      authTag: authTag.toString("base64"),
      keyId,
    },
    originalHash: crypto.createHash("sha256").update(plaintext).digest("hex"),
  };
}

// ─── Descifrado (Decrypt) ────────────────────────────────────────────────────

/**
 * IMPORTANTE: Asegúrate de que esta función tenga el 'export'
 */
export function decryptBuffer(payload: any, keyMaterial: string) {
  const key = loadKeyFromBase64(keyMaterial);
  const iv = Buffer.from(payload.iv, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return { buffer: decrypted };
  } catch (error) {
    throw new Error(
      "[EncryptionService] Error de autenticación: El archivo fue alterado o la llave es incorrecta."
    );
  }
}