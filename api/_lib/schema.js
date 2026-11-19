// Validação do conteúdo editável do site. Tudo que não passar aqui é descartado.

const SOLUCOES = ["gestao", "incorporacao", "condo-market"];

function str(v, max) {
  if (typeof v !== "string") return undefined;
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

function color(v) {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : undefined;
}

function httpUrl(v) {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (s === "" || s === "#") return s;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

function youtubeId(v) {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (s === "") return "";
  // Aceita o ID ou um link completo do YouTube.
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,20})/) || s.match(/^([A-Za-z0-9_-]{6,20})$/);
  return m ? m[1] : undefined;
}

function prune(obj) {
  for (const k of Object.keys(obj)) if (obj[k] === undefined) delete obj[k];
  return obj;
}

export function sanitizeConfig(input) {
  const errors = [];
  if (!input || typeof input !== "object") return { errors: ["Dados inválidos"] };
  const out = {};

  if (input.tema && typeof input.tema === "object") {
    out.tema = prune({ primaria: color(input.tema.primaria), destaque: color(input.tema.destaque) });
  }

  if (input.textos && typeof input.textos === "object") {
    const t = input.textos;
    out.textos = prune({
      heroTag: str(t.heroTag, 80),
      heroTitulo: str(t.heroTitulo, 120),
      heroDestaque: str(t.heroDestaque, 120),
      heroSubtitulo: str(t.heroSubtitulo, 300),
      ctaTitulo: str(t.ctaTitulo, 80),
      ctaTexto: str(t.ctaTexto, 300)
    });
  }

  if (input.whatsapp && typeof input.whatsapp === "object") {
    const link = httpUrl(input.whatsapp.link);
    if (input.whatsapp.link && link === undefined) errors.push("Link do WhatsApp inválido");
    out.whatsapp = prune({ link });
  }

  if (Array.isArray(input.solucoes)) {
    out.solucoes = [];
    for (const s of input.solucoes) {
      if (!s || !SOLUCOES.includes(s.id)) continue;
      const link = httpUrl(s.link);
      if (s.link && link === undefined) errors.push(`Link inválido em ${s.id}`);
      out.solucoes.push(prune({
        id: s.id,
        nome: str(s.nome, 60),
        resumo: str(s.resumo, 300),
        recursos: Array.isArray(s.recursos)
          ? s.recursos.map((r) => str(r, 100)).filter(Boolean).slice(0, 8)
          : undefined,
        link
      }));
    }
  }

  if (Array.isArray(input.videos)) {
    out.videos = [];
    for (const v of input.videos.slice(0, 12)) {
      if (!v || typeof v !== "object") continue;
      const yt = youtubeId(v.youtubeId || "");
      if (v.youtubeId && yt === undefined) errors.push(`Link do YouTube inválido em "${v.titulo || "vídeo"}"`);
      const videoUrl = httpUrl(v.videoUrl || "");
      if (v.videoUrl && videoUrl === undefined) errors.push(`Arquivo de vídeo inválido em "${v.titulo || "vídeo"}"`);
      out.videos.push({
        titulo: str(v.titulo, 100) || "Vídeo",
        solucao: SOLUCOES.includes(v.solucao) ? v.solucao : "",
        youtubeId: yt || "",
        videoUrl: videoUrl && videoUrl !== "#" ? videoUrl : ""
      });
    }
  }

  out.atualizadoEm = new Date().toISOString();
  return { config: out, errors };
}
