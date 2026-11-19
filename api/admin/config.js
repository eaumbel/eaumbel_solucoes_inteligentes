// GET /api/admin/config — conteúdo atual salvo (sem cache)
// PUT /api/admin/config — salva o conteúdo (exige sessão com 2 fatores)
import { hasValidSession, isSameOrigin, json, readJson } from "../_lib/auth.js";
import { readConfig, writeConfig } from "../_lib/store.js";
import { sanitizeConfig } from "../_lib/schema.js";

export async function GET(request) {
  if (!hasValidSession(request)) return json({ error: "Não autenticado" }, 401);
  try {
    return json((await readConfig()) || {});
  } catch (err) {
    console.error("admin:config:get", err);
    return json({ error: "Não foi possível ler as configurações" }, 500);
  }
}

export async function PUT(request) {
  if (!isSameOrigin(request)) return json({ error: "Requisição não permitida" }, 403);
  if (!hasValidSession(request)) return json({ error: "Sessão expirada. Entre novamente." }, 401);
  const { config, errors } = sanitizeConfig(await readJson(request));
  if (errors.length) return json({ error: errors.join("; ") }, 400);
  try {
    await writeConfig(config);
    return json({ ok: true, config });
  } catch (err) {
    console.error("admin:config:put", err);
    return json({ error: err.message || "Falha ao salvar" }, 500);
  }
}
