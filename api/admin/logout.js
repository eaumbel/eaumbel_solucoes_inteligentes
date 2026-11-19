// POST /api/admin/logout — encerra a sessão.
import { clearSessionCookie, isSameOrigin, json } from "../_lib/auth.js";

export function POST(request) {
  if (!isSameOrigin(request)) return json({ error: "Requisição não permitida" }, 403);
  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie(request) });
}
