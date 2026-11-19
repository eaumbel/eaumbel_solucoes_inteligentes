// Armazenamento das configurações do site.
// Na Vercel: usa o Vercel Blob (variável BLOB_READ_WRITE_TOKEN, criada ao conectar o Blob ao projeto).
// Localmente (sem token): usa o arquivo .data/config.json, só para testes.
import { promises as fs } from "node:fs";
import path from "node:path";

const CONFIG_PATH = "site/config.json";
const LOCAL_FILE = path.join(process.cwd(), ".data", "config.json");

export function blobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function readConfig() {
  if (!blobEnabled()) {
    try {
      return JSON.parse(await fs.readFile(LOCAL_FILE, "utf8"));
    } catch {
      return null;
    }
  }
  const { get } = await import("@vercel/blob");
  const res = await get(CONFIG_PATH, { access: "public", useCache: false });
  if (!res || !res.stream) return null;
  const text = await new Response(res.stream).text();
  return JSON.parse(text);
}

export async function writeConfig(config) {
  const body = JSON.stringify(config, null, 2);
  if (!blobEnabled()) {
    if (process.env.VERCEL) throw new Error("Vercel Blob não conectado ao projeto (BLOB_READ_WRITE_TOKEN ausente).");
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
    await fs.writeFile(LOCAL_FILE, body);
    return;
  }
  const { put } = await import("@vercel/blob");
  await put(CONFIG_PATH, body, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60
  });
}
