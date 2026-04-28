import { randomUUID } from "crypto";
import { supabase } from "../../config/supabase.js";

export async function createAuditLog(input: any) {
  const log = {
    id: randomUUID(),
    user_id: input.context.userId, // Ajusta nombres según tu tabla SQL
    action: input.action,
    resource_id: input.resourceId,
    resource_type: input.resourceType,
    ip_address: input.context.ipAddress,
    user_agent: input.context.userAgent,
    previous_state: input.previousState || {},
    new_state: input.newState || {},
    created_at: new Date(),
  };

  const { error } = await supabase.from("audit_logs").insert(log);
  
  if (error) {
    console.error("[AuditService] Error persistiendo en Supabase:", error.message);
  }

  return log;
}