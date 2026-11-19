// GET /api/config — conteúdo público da página (textos, cores, links, vídeos).
import { readConfig } from "./_lib/store.js";

export async function GET() {
  try {
    const config = await readConfig();
    return new Response(JSON.stringify(config || {}), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=0, s-maxage=30, stale-while-revalidate=300"
      }
    });
  } catch (err) {
    console.error("config:get", err);
    return new Response("{}", {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
    });
  }
}
