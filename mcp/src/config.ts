import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface McpConfig {
  supabaseUrl: string;
  serviceKey: string;
  workspaceId: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const DEFAULT_KEY_FILE = join(homedir(), ".config", "estudioflow", "supabase-service.key");

/**
 * Reads configuration from the environment. The service key comes from
 * SUPABASE_SERVICE_ROLE_KEY, or from the file named by SERVICE_KEY_FILE
 * (default ~/.config/estudioflow/supabase-service.key).
 *
 * Errors name the variable that is missing, never its value.
 */
export function loadConfig(
  env: Record<string, string | undefined> = process.env,
  readFile: (path: string) => string = (p) => readFileSync(p, "utf8"),
): McpConfig {
  const supabaseUrl = env.SUPABASE_URL?.trim();
  if (!supabaseUrl) throw new Error("Falta la variable de entorno SUPABASE_URL.");
  if (!/^https:\/\//.test(supabaseUrl)) {
    throw new Error("SUPABASE_URL debe empezar con https:// (usa el proyecto en la nube, no 127.0.0.1).");
  }

  const workspaceId = env.ZERNFLOW_WORKSPACE_ID?.trim();
  if (!workspaceId) throw new Error("Falta la variable de entorno ZERNFLOW_WORKSPACE_ID.");
  if (!UUID_RE.test(workspaceId)) throw new Error("ZERNFLOW_WORKSPACE_ID no es un UUID válido.");

  let serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    const keyFile = env.SERVICE_KEY_FILE?.trim() || DEFAULT_KEY_FILE;
    try {
      serviceKey = readFile(keyFile).trim();
    } catch {
      throw new Error(
        `No hay SUPABASE_SERVICE_ROLE_KEY y no se pudo leer el archivo de clave (${keyFile}).`,
      );
    }
  }
  if (!serviceKey) throw new Error("La clave de servicio de Supabase está vacía.");

  return { supabaseUrl, serviceKey, workspaceId };
}
