// POST /api/admin/login — { password, code } -> cria a sessão.
import {
  envStatus, checkPassword, verifyTotp, consumeTotpCounter, createSessionCookie,
  clientIp, isRateLimited, registerFailure, clearFailures, isSameOrigin, json, readJson, delay
} from "../_lib/auth.js";

export async function POST(request) {
  if (!isSameOrigin(request)) return json({ error: "Requisição não permitida" }, 403);
  const env = envStatus();
  if (!env.ready) return json({ error: "Painel não configurado", problems: env.problems }, 503);
  if (!env.totpConfigured) return json({ error: "Google Authenticator ainda não configurado" }, 409);

  const ip = clientIp(request);
  if (isRateLimited(ip)) return json({ error: "Muitas tentativas. Aguarde 15 minutos." }, 429);

  const { password, code } = await readJson(request);
  const passOk = checkPassword(password);
  const counter = verifyTotp(env.totpSecret, code);

  if (!passOk || counter < 0 || !consumeTotpCounter(counter)) {
    registerFailure(ip);
    await delay(800);
    return json({ error: "Senha ou código inválidos" }, 401);
  }

  clearFailures(ip);
  return json({ ok: true }, 200, { "set-cookie": createSessionCookie(request) });
}
