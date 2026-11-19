// Servidor local para testes: serve os arquivos estáticos e as funções de /api
// do mesmo jeito que a Vercel. Uso:
//   ADMIN_PASSWORD=... SESSION_SECRET=... [TOTP_SECRET=...] npm run dev
import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 3000);
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon"
};

async function api(req, res, url) {
  const rel = url.pathname.replace(/^\/api\//, "");
  if (!/^[a-z0-9/-]+$/i.test(rel) || rel.split("/").some((p) => p.startsWith("_"))) return false;
  const file = path.join(ROOT, "api", rel + ".js");
  try { await fs.access(file); } catch { return false; }
  const mod = await import(pathToFileURL(file).href);
  const handler = mod[req.method];
  if (!handler) { res.writeHead(405).end(); return true; }

  const chunks = [];
  for await (const c of req) chunks.push(c);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
  const request = new Request(url, {
    method: req.method, headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks)
  });
  const response = await handler(request);
  const out = {};
  response.headers.forEach((v, k) => { out[k] = v; });
  res.writeHead(response.status, out);
  res.end(Buffer.from(await response.arrayBuffer()));
  return true;
}

async function estatico(res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p.endsWith("/")) p += "index.html";
  if (p === "/admin") p = "/admin/index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT + path.sep) || /node_modules|\/\.|\/api\//.test(file.slice(ROOT.length))) {
    res.writeHead(404).end("Não encontrado");
    return;
  }
  try {
    const data = await fs.readFile(file);
    res.writeHead(200, { "content-type": TIPOS[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404).end("Não encontrado");
  }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/") && (await api(req, res, url))) return;
    await estatico(res, url);
  } catch (err) {
    console.error(err);
    res.writeHead(500).end("Erro interno");
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}  (painel: /admin)`));
