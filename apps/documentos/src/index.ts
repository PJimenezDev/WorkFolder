import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import documentRoutes from "./routes/document.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/documents", documentRoutes);

app.listen(env.PORT, () => {
  console.log(`
  ✅ Microservicio Documentos (Supabase Local)
  URL: http://localhost:${env.PORT}
  Storage: workfolder-documents bucket
  `);
});