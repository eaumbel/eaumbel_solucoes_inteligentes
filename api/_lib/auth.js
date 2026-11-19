// Autenticação da área administrativa: senha + código TOTP (Google Authenticator).
// Segredos ficam apenas em variáveis de ambiente da Vercel:
//   ADMIN_PASSWORD  senha de acesso (mínimo 12 caracteres)
//   SESSION_SECRET  chave aleatória para assinar a sessão (mínimo 32 caracteres)
//   TOTP_SECRET     segredo do Google Authenticator (gerado na primeira configuração)
import crypto from "node:crypto";

const SESSION_COOKIE = "adm_sess";
const SESSION_TTL_S = 8 * 60 * 60; // 8 horas
const TOTP_STEP_S = 30;
const TOTP_DIGITS = 6;

// ---------- Configuração ----------

export function envStatus() {
  const pwd = process.env.ADMIN_PASSWORD || "";
  const ses = process.env.SESSION_SECRET || "";
  const totp = (process.env.TOTP_SECRET || "").replace(/\s+/g, "").toUpperCase();
  const problems = [];
  if (pwd.length < 12) problems.push("ADMIN_PASSWORD ausente ou com menos de 12 caracteres");
  if (ses.length < 32) problems.push("SESSION_SECRET ausente ou com menos de 32 caracteres");
  const totpOk = totp.length > 0 && isValidBase32(totp) && base32Decode(totp).length >= 10;
  if (totp && !totpOk) problems.push("TOTP_SECRET inválido");
  return { ready: problems.length === 0, problems, totpConfigured: totpOk, totpSecret: totpOk ? totp : null };
}

// ---------- Senha ----------

export function checkPassword(candidate) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || typeof candidate !== "string") return false;
  const a = crypto.createHash("sha256").update(candidate, "utf8").digest();
  const b = crypto.createHash("sha256").update(expected, "utf8").digest();
  return crypto.timingSafeEqual(a, b);
}

// ---------- TOTP (RFC 6238) ----------

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function isValidBase32(s) {
  return /^[A-Z2-7]+=*$/.test(s);
}

export function base32Encode(buf) {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s) {
  const clean = s.replace(/=+$/, "").replace(/\s+/g, "").toUpperCase();
  let bits = 0, value = 0;
  const out = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx < 0) throw new Error("base32 inválido");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

export function totpAt(secret, counter) {
  const key = base32Decode(secret);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac("sha1", key).update(msg).digest();
  const off = h[h.length - 1] & 0xf;
  const bin = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(bin % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

// Aceita o código atual e o vizinho (±30s) para tolerar relógios levemente fora de hora.
// Retorna o contador usado (para impedir reutilização) ou -1.
export function verifyTotp(secret, code, now = Date.now()) {
  if (typeof code !== "string") return -1;
  const c = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(c)) return -1;
  const counter = Math.floor(now / 1000 / TOTP_STEP_S);
  let match = -1;
  for (const d of [-1, 0, 1]) {
    const expected = totpAt(secret, counter + d);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(c))) match = counter + d;
  }
  return match;
}

// Impede que o mesmo código seja usado duas vezes (por instância do servidor).
let lastUsedCounter = -1;
export function consumeTotpCounter(counter) {
  if (counter <= lastUsedCounter) return false;
  lastUsedCounter = counter;
  return true;
}

export function otpauthUri(secret, account = "admin", issuer = "Eaumbel Soluções") {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: "SHA1", digits: "6", period: "30" });
  return `otpauth://totp/${label}?${params}`;
}

// ---------- Limite de tentativas (por instância) ----------

const attempts = new Map();
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
}

export function isRateLimited(ip) {
  const a = attempts.get(ip);
  if (!a) return false;
  if (Date.now() - a.first > WINDOW_MS) { attempts.delete(ip); return false; }
  return a.count >= MAX_FAILS;
}

export function registerFailure(ip) {
  const a = attempts.get(ip);
  if (!a || Date.now() - a.first > WINDOW_MS) attempts.set(ip, { count: 1, first: Date.now() });
  else a.count++;
}

export function clearFailures(ip) {
  attempts.delete(ip);
}

// ---------- Sessão (cookie assinado) ----------

function sign(data) {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET).update(data).digest("base64url");
}

function isLocal(request) {
  const host = new URL(request.url).hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function createSessionCookie(request) {
  const payload = Buffer.from(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S,
    n: crypto.randomBytes(8).toString("hex")
  })).toString("base64url");
  const value = `${payload}.${sign(payload)}`;
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_S}` +
    (isLocal(request) ? "" : "; Secure");
}

export function clearSessionCookie(request) {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` + (isLocal(request) ? "" : "; Secure");
}

export function hasValidSession(request) {
  const env = envStatus();
  if (!env.ready || !env.totpConfigured) return false;
  const cookies = Object.fromEntries((request.headers.get("cookie") || "").split(/;\s*/).filter(Boolean).map((p) => {
    const i = p.indexOf("=");
    return [p.slice(0, i), p.slice(i + 1)];
  }));
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return false;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof exp === "number" && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

// Bloqueia requisições de outros sites (proteção CSRF além do SameSite=Strict).
export function isSameOrigin(request) {
  if (request.headers.get("x-admin-request") !== "1") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

// ---------- Respostas ----------

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export const delay = (ms) => new Promise((r) => setTimeout(r, ms));
