# 🛡️ WorkFolder — Bóveda Digital Segura

WorkFolder es una plataforma de gestión documental orientada a la máxima seguridad. Diseñada con una arquitectura de monorepo, implementa cifrado de grado militar (AES-256-GCM), auditoría inmutable ("Eventos de Vida") y un patrón BFF (Backend for Frontend).

## ✨ Características Principales

- **Cifrado E2EE (End-to-End Encryption):** Todos los documentos se cifran con `AES-256-GCM` antes de ser subidos al Storage.
- **Auditoría Inmutable:** Registro estricto de accesos, subidas y eliminaciones (Append-only).
- **Arquitectura Monorepo:** Separación limpia entre Frontend, Backend y Tipos Compartidos.
- **Patrón BFF (Backend For Frontend):** Next.js actúa como proxy de seguridad ocultando el Backend real.
- **Stub Local Inteligente:** Capacidad de desarrollar offline sin necesidad de conexión inmediata a la base de datos real.

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js, React, Tailwind CSS.
- **Backend:** Node.js, Express, TypeScript (ESM con `tsx`), Multer, Helmet.
- **Base de Datos & Storage:** Supabase (PostgreSQL + Buckets).
- **Criptografía:** Módulo nativo `crypto` de Node.js.
- **Gestión de Monorepo:** npm workspaces + concurrently.

## 📂 Estructura del Proyecto

- **`workfolder/`** (Raíz del monorepo)
  - **`apps/`**
    - `frontend/` — Aplicación Next.js (UI y BFF)
    - `backend/` — Microservicio Express (Lógica de negocio, Cifrado, DB)
  - **`packages/`**
    - `types/` — Interfaces de TypeScript compartidas (`@workfolder/types`)
  - `.env.example` — Plantilla de variables de entorno
  - `.gitignore` — Archivos ignorados por Git
  - `package.json` — Configuración del workspace y scripts globales

## 🚀 Instalación y Uso Local

### 1. Prerrequisitos
- Node.js (v18 o superior)
- npm (v9 o superior)

### 2. Instalación de dependencias
Ejecuta el siguiente comando en la raíz del proyecto para instalar las dependencias de todos los paquetes al mismo tiempo:
\`\`\`bash
npm install
\`\`\`

### 3. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto (puedes basarte en `.env.example`).
Para el desarrollo inicial local usando el **Stub de memoria**, solo necesitas:

\`\`\`env
# Frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/api/proxy

# Backend
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

# Supabase (Dejar vacío o con placeholders para usar el Stub local)
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
\`\`\`

### 4. Levantar el entorno de desarrollo
Inicia tanto el Frontend como el Backend simultáneamente con un solo comando desde la raíz:
\`\`\`bash
npm run dev
\`\`\`

- **Frontend (Next.js):** http://localhost:3000
- **Backend (Express):** http://localhost:3001
- **Healthcheck Backend:** http://localhost:3001/health
- **Test BFF Proxy:** http://localhost:3000/api/proxy/health

---
*Desarrollado con ❤️ para garantizar la privacidad y seguridad documental.*
