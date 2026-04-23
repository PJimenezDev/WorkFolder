// packages/types/index.ts

// Roles de usuario según tu arquitectura
export type UserRole = 'ADMIN' | 'STANDARD' | 'RRHH';

// Interfaz global de Documento
export interface DocumentMetadata {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  ownerId: string;
  encryptedKey: string; // Para el cifrado E2EE
  createdAt: Date;
}

// Estructura estándar para todas las respuestas de la API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    total?: number;
    limit?: number;
    [key: string]: any;
  };
}



// --- TIPOS DE ENCRIPTACIÓN ---
export interface EncryptionKey {
  id: string;
  keyMaterial: string; // Base64
  ownerId: string;
  documentId?: string;
  createdAt: Date;
}

export interface EncryptedPayload {
  iv: string; // Base64
  ciphertext: string; // Base64
  authTag: string; // Base64
  keyId: string;
}

// --- TIPOS DE DOCUMENTOS ---
export interface Document {
  id: string;
  ownerId: string;
  name: string;
  storagePath: string;
  originalHash: string;
  encryptionKeyId: string;
  mimeType: string;
  sizeBytes: number;
  version: number;
  status: "active" | "deleted" | "archived";
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// --- TIPOS DE AUDITORÍA ---
export type AuditAction = 
  | "document:created" 
  | "document:accessed" 
  | "document:deleted" 
  | "document:shared"
  | "user:login"
  | "key:rotated";

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resourceId: string;
  resourceType: "document" | "user" | "key";
  ipAddress: string;
  userAgent: string;
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  immutable: boolean;
  createdAt: Date;
}