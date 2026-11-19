// GET /api/admin/session — informa se o painel está configurado e se há sessão ativa.
import { envStatus, hasValidSession, json } from "../_lib/auth.js";
import { blobEnabled } from "../_lib/store.js";

export function GET(request) {
  const env = envStatus();
  return json({
    ready: env.ready,
    problems: env.problems,
    totpConfigured: env.totpConfigured,
    authenticated: hasValidSession(request),
    storage: blobEnabled() ? "blob" : process.env.VERCEL ? "missing" : "local"
  });
}
