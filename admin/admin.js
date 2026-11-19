import { upload } from "/admin/vendor/blob-client.js";

const PADRAO = window.SITE_CONFIG || {};
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ---------- API ----------

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: { "content-type": "application/json", "x-admin-request": "1" },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = {};
  try { data = await res.json(); } catch { /* sem corpo */ }
  if (!res.ok) {
    const err = new Error(data.error || `Erro ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---------- Telas ----------

function mostrar(tela) {
  $$("[data-tela]").forEach((s) => { s.hidden = s.dataset.tela !== tela; });
  $("#barra-acoes").hidden = tela !== "editor";
}

async function iniciar() {
  let s;
  try {
    s = await api("/api/admin/session");
  } catch {
    mostrar("nao-configurado");
    $("#lista-problemas").innerHTML = "<li>Não foi possível falar com o servidor (/api). O painel só funciona publicado na Vercel ou com <code>npm run dev</code>.</li>";
    return;
  }
  if (!s.ready) {
    $("#lista-problemas").replaceChildren(...s.problems.map((p) => Object.assign(document.createElement("li"), { textContent: p })));
    return mostrar("nao-configurado");
  }
  if (!s.totpConfigured) return mostrar("setup");
  if (!s.authenticated) return mostrar("login");
  await abrirEditor(s.storage);
}

// ---------- Configuração do Google Authenticator ----------

let setupSenha = "";
let setupSegredo = "";

$("#form-setup-senha").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  $("#setup-erro").textContent = "";
  travar(form, true);
  try {
    setupSenha = form.password.value;
    const r = await api("/api/admin/totp-setup", { method: "POST", body: { password: setupSenha } });
    setupSegredo = r.secret;
    $("#qr").innerHTML = r.qrSvg;
    $("#segredo-manual").textContent = r.secret.replace(/(.{4})/g, "$1 ").trim();
    form.hidden = true;
    $("#form-setup-codigo").hidden = false;
    $("#form-setup-codigo").code.focus();
  } catch (err) {
    $("#setup-erro").textContent = err.message;
  } finally {
    travar(form, false);
  }
});

$("#form-setup-codigo").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  $("#setup-erro").textContent = "";
  travar(form, true);
  try {
    await api("/api/admin/totp-setup", {
      method: "POST",
      body: { password: setupSenha, secret: setupSegredo, code: form.code.value.trim() }
    });
    setupSenha = "";
    form.hidden = true;
    $("#segredo-final").textContent = setupSegredo;
    $("#setup-final").hidden = false;
  } catch (err) {
    $("#setup-erro").textContent = err.message;
  } finally {
    travar(form, false);
  }
});

$("#btn-copiar").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(setupSegredo);
    $("#btn-copiar").textContent = "Copiado!";
  } catch {
    $("#btn-copiar").textContent = "Selecione e copie";
  }
});

// ---------- Login ----------

$("#form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  $("#login-erro").textContent = "";
  travar(form, true);
  try {
    await api("/api/admin/login", {
      method: "POST",
      body: { password: form.password.value, code: form.code.value.trim() }
    });
    form.reset();
    await iniciar();
  } catch (err) {
    $("#login-erro").textContent = err.message;
    form.code.value = "";
    form.code.focus();
  } finally {
    travar(form, false);
  }
});

$("#btn-sair").addEventListener("click", async () => {
  try { await api("/api/admin/logout", { method: "POST" }); } catch { /* ignora */ }
  mostrar("login");
});

function travar(form, sim) {
  $$("button, input", form).forEach((x) => { x.disabled = sim; });
}

// ---------- Editor ----------

let estado = null;
let alterado = false;

function mesclar(base, salvo) {
  salvo = salvo || {};
  const cfg = structuredClone(base);
  cfg.tema = { ...base.tema, ...salvo.tema };
  cfg.textos = { ...base.textos, ...salvo.textos };
  cfg.whatsapp = { ...base.whatsapp, ...salvo.whatsapp };
  if (Array.isArray(salvo.solucoes)) {
    cfg.solucoes = base.solucoes.map((s) => ({ ...s, ...(salvo.solucoes.find((x) => x.id === s.id) || {}) }));
  }
  if (Array.isArray(salvo.videos)) cfg.videos = salvo.videos;
  return cfg;
}

async function abrirEditor(storage) {
  let salvo = {};
  try {
    salvo = await api("/api/admin/config");
  } catch (err) {
    if (err.status === 401) return mostrar("login");
    status(err.message, "erro");
  }
  estado = mesclar(PADRAO, salvo);

  const aviso = $("#aviso-armazenamento");
  if (storage === "missing") {
    aviso.textContent = "O Vercel Blob ainda não está conectado ao projeto: não será possível salvar nem enviar vídeos. Veja o README.";
    aviso.hidden = false;
  } else if (storage === "local") {
    aviso.textContent = "Modo de teste local: as alterações são gravadas em .data/config.json e o envio de vídeos fica desativado.";
    aviso.hidden = false;
  } else {
    aviso.hidden = true;
  }

  preencher();
  mostrar("editor");
  alterado = false;
  status("");
}

function preencher() {
  const form = $("#form-editor");
  for (const campo of $$("[name]", form)) {
    const [grupo, chave] = campo.name.split(".");
    campo.value = (estado[grupo] && estado[grupo][chave]) || "";
  }
  for (const espelho of $$("[data-espelho]", form)) espelho.value = form.elements[espelho.dataset.espelho].value;
  atualizarPreviaCores();

  const solucoes = $("#editor-solucoes");
  solucoes.replaceChildren(...estado.solucoes.map(criarCartaoSolucao));
  renderVideos();
}

function criarCartaoSolucao(s) {
  const node = $("#tpl-solucao").content.firstElementChild.cloneNode(true);
  node.dataset.id = s.id;
  $("legend", node).textContent = s.nome;
  $("[data-campo=nome]", node).value = s.nome || "";
  $("[data-campo=resumo]", node).value = s.resumo || "";
  $("[data-campo=recursos]", node).value = (s.recursos || []).join("\n");
  $("[data-campo=link]", node).value = s.link && s.link !== "#" ? s.link : "";
  return node;
}

function lerSolucoes() {
  return $$("#editor-solucoes .cartao").map((n) => ({
    id: n.dataset.id,
    nome: $("[data-campo=nome]", n).value.trim(),
    resumo: $("[data-campo=resumo]", n).value.trim(),
    recursos: $("[data-campo=recursos]", n).value.split("\n").map((r) => r.trim()).filter(Boolean),
    link: $("[data-campo=link]", n).value.trim() || "#"
  }));
}

// ----- Vídeos -----

function lerVideos() {
  return $$("#editor-videos .video-edit").map((n) => ({
    titulo: $("[data-campo=titulo]", n).value.trim(),
    solucao: $("[data-campo=solucao]", n).value,
    youtubeId: $("[data-campo=youtubeId]", n).value.trim(),
    videoUrl: $("[data-campo=videoUrl]", n).value.trim()
  }));
}

function renderVideos() {
  $("#editor-videos").replaceChildren(...estado.videos.map(criarCartaoVideo));
}

function idYoutube(v) {
  const m = (v || "").match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,20})/) || (v || "").match(/^([A-Za-z0-9_-]{6,20})$/);
  return m ? m[1] : "";
}

function atualizarPreviaVideo(node) {
  const previa = $(".video-edit__previa", node);
  const arquivo = $("[data-campo=videoUrl]", node).value;
  const yt = idYoutube($("[data-campo=youtubeId]", node).value);
  previa.replaceChildren();
  if (arquivo) {
    const v = document.createElement("video");
    v.src = arquivo; v.controls = true; v.preload = "metadata";
    previa.append(v);
  } else if (yt) {
    const img = document.createElement("img");
    img.src = `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`; img.alt = "";
    previa.append(img);
  } else {
    previa.textContent = "Sem vídeo — aparece como “Vídeo em breve”";
  }
  $("[data-acao=limpar-arquivo]", node).hidden = !arquivo;
  $(".upload__info", node).textContent = arquivo ? "Arquivo enviado (tem prioridade sobre o YouTube)" : "";
}

function criarCartaoVideo(v) {
  const node = $("#tpl-video").content.firstElementChild.cloneNode(true);
  $("[data-campo=titulo]", node).value = v.titulo || "";
  $("[data-campo=solucao]", node).value = v.solucao || "";
  $("[data-campo=youtubeId]", node).value = v.youtubeId ? `https://www.youtube.com/watch?v=${v.youtubeId}` : "";
  $("[data-campo=videoUrl]", node).value = v.videoUrl || "";
  $("[data-campo=youtubeId]", node).addEventListener("change", () => atualizarPreviaVideo(node));
  $("input[type=file]", node).addEventListener("change", (e) => enviarVideo(node, e.target));
  atualizarPreviaVideo(node);
  return node;
}

$("#editor-videos").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-acao]");
  if (!btn) return;
  const node = btn.closest(".video-edit");
  const acao = btn.dataset.acao;
  if (acao === "excluir") {
    if (!confirm("Excluir este vídeo da página?")) return;
    node.remove();
  } else if (acao === "subir" && node.previousElementSibling) {
    node.previousElementSibling.before(node);
  } else if (acao === "descer" && node.nextElementSibling) {
    node.nextElementSibling.after(node);
  } else if (acao === "limpar-arquivo") {
    $("[data-campo=videoUrl]", node).value = "";
    atualizarPreviaVideo(node);
  }
  marcarAlterado();
});

$("#btn-add-video").addEventListener("click", () => {
  const node = criarCartaoVideo({ titulo: "Novo vídeo", solucao: "", youtubeId: "", videoUrl: "" });
  $("#editor-videos").append(node);
  $("[data-campo=titulo]", node).select();
  marcarAlterado();
});

async function enviarVideo(node, input) {
  const file = input.files && input.files[0];
  input.value = "";
  if (!file) return;
  const info = $(".upload__info", node);
  const barra = $("progress", node);
  if (file.size > 200 * 1024 * 1024) {
    info.textContent = "Arquivo maior que 200 MB. Comprima o vídeo ou use o YouTube.";
    return;
  }
  const nome = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "") || "video.mp4";
  barra.hidden = false;
  barra.value = 0;
  info.textContent = "Enviando…";
  $("#btn-salvar").disabled = true;
  try {
    const blob = await upload(`videos/${nome}`, file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload",
      headers: { "x-admin-request": "1" },
      multipart: file.size > 20 * 1024 * 1024,
      onUploadProgress: ({ percentage }) => { barra.value = percentage; info.textContent = `Enviando… ${Math.round(percentage)}%`; }
    });
    $("[data-campo=videoUrl]", node).value = blob.url;
    atualizarPreviaVideo(node);
    info.textContent = "Vídeo enviado. Clique em “Salvar alterações” para publicar.";
    marcarAlterado();
  } catch (err) {
    info.textContent = "Falha no envio: " + (err.message || err);
  } finally {
    barra.hidden = true;
    $("#btn-salvar").disabled = false;
  }
}

// ----- Cores -----

function atualizarPreviaCores() {
  const form = $("#form-editor");
  const p = $("#previa-cores");
  p.style.setProperty("--prev-primaria", form.elements["tema.primaria"].value);
  p.style.setProperty("--prev-destaque", form.elements["tema.destaque"].value);
}

$("#form-editor").addEventListener("input", (e) => {
  const form = e.currentTarget;
  const t = e.target;
  if (t.type === "color") {
    $(`[data-espelho="${t.name}"]`, form).value = t.value;
  } else if (t.dataset.espelho && /^#[0-9a-f]{6}$/i.test(t.value)) {
    form.elements[t.dataset.espelho].value = t.value.toLowerCase();
  }
  atualizarPreviaCores();
  marcarAlterado();
});

$("#btn-cores-padrao").addEventListener("click", () => {
  const form = $("#form-editor");
  for (const k of ["primaria", "destaque"]) {
    form.elements[`tema.${k}`].value = PADRAO.tema[k];
    $(`[data-espelho="tema.${k}"]`, form).value = PADRAO.tema[k];
  }
  atualizarPreviaCores();
  marcarAlterado();
});

// ----- Salvar -----

function marcarAlterado() {
  alterado = true;
  status("Alterações não salvas");
}

function status(msg, tipo) {
  const s = $("#status-salvar");
  s.textContent = msg;
  s.className = "muted" + (tipo ? ` ${tipo}-status` : "");
}

function coletar() {
  const form = $("#form-editor");
  const val = (n) => form.elements[n].value.trim();
  return {
    tema: { primaria: val("tema.primaria"), destaque: val("tema.destaque") },
    textos: {
      heroTag: val("textos.heroTag"), heroTitulo: val("textos.heroTitulo"), heroDestaque: val("textos.heroDestaque"),
      heroSubtitulo: val("textos.heroSubtitulo"), ctaTitulo: val("textos.ctaTitulo"), ctaTexto: val("textos.ctaTexto")
    },
    whatsapp: { link: val("whatsapp.link") },
    solucoes: lerSolucoes(),
    videos: lerVideos()
  };
}

$("#btn-salvar").addEventListener("click", async () => {
  const btn = $("#btn-salvar");
  btn.disabled = true;
  status("Salvando…");
  try {
    const r = await api("/api/admin/config", { method: "PUT", body: coletar() });
    estado = mesclar(PADRAO, r.config);
    alterado = false;
    status("✓ Salvo. O site é atualizado em até 1 minuto.", "ok");
  } catch (err) {
    if (err.status === 401) {
      status("Sessão expirada. Entre novamente (suas alterações nesta tela foram mantidas).", "erro");
      mostrarLoginSobreposto();
    } else {
      status(err.message, "erro");
    }
  } finally {
    btn.disabled = false;
  }
});

// Sessão expirou no meio da edição: pede login sem perder o que foi digitado.
function mostrarLoginSobreposto() {
  const senha = prompt("Sessão expirada. Digite a senha:");
  if (!senha) return;
  const codigo = prompt("Código do Google Authenticator:");
  if (!codigo) return;
  api("/api/admin/login", { method: "POST", body: { password: senha, code: codigo.trim() } })
    .then(() => status("Sessão renovada. Clique em “Salvar alterações” de novo.", "ok"))
    .catch((err) => status(err.message, "erro"));
}

window.addEventListener("beforeunload", (e) => {
  if (alterado) { e.preventDefault(); e.returnValue = ""; }
});

iniciar();
