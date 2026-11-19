// POST /api/admin/upload — autoriza o envio de vídeos direto do navegador para o Vercel Blob.
// O arquivo não passa por esta função (que tem limite de 4,5 MB); ela só emite um token
// temporário, e apenas para quem tem sessão válida com 2 fatores.
import { handleUpload } from "@vercel/blob/client";
import { hasValidSession, isSameOrigin, json } from "../_lib/auth.js";

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB por vídeo

export async function POST(request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return json({ error: "Vercel Blob não conectado ao projeto. Veja o README." }, 503);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Dados inválidos" }, 400);
  }

  // Pedido de token vem do painel; avisos de conclusão vêm dos servidores da Vercel.
  if (body?.type === "blob.generate-client-token") {
    if (!isSameOrigin(request) || !hasValidSession(request)) return json({ error: "Não autenticado" }, 401);
  }

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("videos/")) throw new Error("Destino não permitido");
        return {
          allowedContentTypes: ["video/mp4", "video/webm", "video/quicktime"],
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true
        };
      }
    });
    return json(result);
  } catch (err) {
    return json({ error: err.message || "Falha no envio" }, 400);
  }
}
