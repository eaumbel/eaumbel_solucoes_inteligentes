// POST /api/admin/totp-setup — primeira configuração do Google Authenticator.
// Só funciona enquanto TOTP_SECRET não existe na Vercel, e exige a senha de administrador.
//   { password }                 -> gera um segredo novo e o QR Code
//   { password, secret, code }   -> confirma que o app foi configurado corretamente
import QRCode from "qrcode";
import {
  envStatus, checkPassword, generateTotpSecret, verifyTotp, otpauthUri,
  clientIp, isRateLimited, registerFailure, clearFailures, isSameOrigin, json, readJson, delay
} from "../_lib/auth.js";

export async function POST(request) {
  if (!isSameOrigin(request)) return json({ error: "Requisição não permitida" }, 403);
  const env = envStatus();
  if (!env.ready) return json({ error: "Painel não configurado", problems: env.problems }, 503);
  if (env.totpConfigured) return json({ error: "O Google Authenticator já está configurado." }, 403);

  const ip = clientIp(request);
  if (isRateLimited(ip)) return json({ error: "Muitas tentativas. Aguarde 15 minutos." }, 429);

  const { password, secret, code } = await readJson(request);
  if (!checkPassword(password)) {
    registerFailure(ip);
    await delay(800);
    return json({ error: "Senha inválida" }, 401);
  }

  if (!secret) {
    clearFailures(ip);
    const newSecret = generateTotpSecret();
    const uri = otpauthUri(newSecret);
    const qrSvg = await QRCode.toString(uri, { type: "svg", margin: 1, width: 220 });
    return json({ secret: newSecret, uri, qrSvg });
  }

  if (typeof secret !== "string" || !/^[A-Z2-7]{16,64}$/.test(secret)) return json({ error: "Segredo inválido" }, 400);
  if (verifyTotp(secret, code) < 0) {
    registerFailure(ip);
    return json({ error: "Código incorreto. Confira o app e tente de novo." }, 401);
  }
  clearFailures(ip);
  return json({ ok: true, secret });
}
