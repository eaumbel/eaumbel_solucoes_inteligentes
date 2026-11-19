(function () {
  "use strict";

  var padrao = window.SITE_CONFIG || {};

  // ---------- Utilitários ----------

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function urlSegura(url) {
    return typeof url === "string" && /^https?:\/\//i.test(url) ? url : "";
  }

  function icone(nome) {
    return '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><use href="#ico-' + nome + '"/></svg>';
  }

  function escurecer(hex, fator) {
    var m = /^#([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return null;
    var n = parseInt(m[1], 16);
    var c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      return Math.max(0, Math.round(v * (1 - fator))).toString(16).padStart(2, "0");
    });
    return "#" + c.join("");
  }

  // Junta o conteúdo salvo no painel com o padrão de config.js.
  function mesclar(base, salvo) {
    salvo = salvo || {};
    var cfg = JSON.parse(JSON.stringify(base));
    cfg.tema = Object.assign({}, base.tema, salvo.tema);
    cfg.textos = Object.assign({}, base.textos, salvo.textos);
    cfg.whatsapp = Object.assign({}, base.whatsapp, salvo.whatsapp);
    if (Array.isArray(salvo.solucoes)) {
      cfg.solucoes = (base.solucoes || []).map(function (s) {
        var o = salvo.solucoes.filter(function (x) { return x.id === s.id; })[0];
        return Object.assign({}, s, o);
      });
    }
    if (Array.isArray(salvo.videos)) cfg.videos = salvo.videos;
    return cfg;
  }

  // ---------- Renderização ----------

  function aplicarTema(tema) {
    var root = document.documentElement.style;
    if (/^#[0-9a-f]{6}$/i.test(tema.primaria || "")) {
      root.setProperty("--cor-primaria", tema.primaria);
      root.setProperty("--cor-primaria-escura", escurecer(tema.primaria, 0.3));
    }
    if (/^#[0-9a-f]{6}$/i.test(tema.destaque || "")) root.setProperty("--cor-destaque", tema.destaque);
  }

  function aplicarTextos(t) {
    var mapa = {
      "hero-tag": t.heroTag, "hero-titulo": t.heroTitulo, "hero-destaque": t.heroDestaque,
      "hero-subtitulo": t.heroSubtitulo, "cta-titulo": t.ctaTitulo, "cta-texto": t.ctaTexto
    };
    Object.keys(mapa).forEach(function (id) {
      var n = document.getElementById(id);
      if (n && mapa[id]) n.textContent = mapa[id];
    });
  }

  function aplicarWhatsapp(wa) {
    var url = urlSegura(wa.link) ||
      "https://wa.me/" + (wa.numero || "") + "?text=" + encodeURIComponent(wa.mensagem || "");
    document.querySelectorAll("[data-whatsapp]").forEach(function (a) {
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
    });
  }

  function renderSolucoes(solucoes) {
    var lista = document.getElementById("lista-solucoes");
    lista.innerHTML = "";
    solucoes.forEach(function (s) {
      var recursos = (s.recursos || []).map(function (r) { return "<li>" + escapeHtml(r) + "</li>"; }).join("");
      lista.appendChild(el("article", { "class": "card", id: "solucao-" + s.id },
        '<div class="card__icone">' + icone(s.icone) + "</div>" +
        "<h3>" + escapeHtml(s.nome) + "</h3>" +
        "<p>" + escapeHtml(s.resumo) + "</p>" +
        "<ul>" + recursos + "</ul>" +
        '<div class="card__acoes">' +
          '<a class="link" href="#video-' + s.id + '">Ver vídeo</a>' +
          '<a class="link" href="#acesso-' + s.id + '">Acessar ' + icone("seta") + "</a>" +
        "</div>"));
    });
  }

  function renderAcessos(solucoes) {
    var acessos = document.getElementById("lista-acessos");
    acessos.innerHTML = "";
    solucoes.forEach(function (s) {
      var link = urlSegura(s.link);
      var a = el("a", {
        "class": "acesso" + (link ? "" : " acesso--off"),
        id: "acesso-" + s.id,
        href: link || "#acesso"
      },
        '<span class="acesso__icone">' + icone(s.icone) + "</span>" +
        '<span class="acesso__texto"><strong>' + escapeHtml(s.nome) + "</strong><small>" +
          (link ? "Entrar no sistema" : "Link em breve") + "</small></span>" +
        icone("seta"));
      if (link) { a.target = "_blank"; a.rel = "noopener"; }
      else { a.setAttribute("aria-disabled", "true"); }
      acessos.appendChild(a);
    });
  }

  var PLAY = '<span class="video__play"><svg viewBox="0 0 24 24" width="32" height="32"><use href="#ico-play"/></svg></span>';

  function renderVideos(videos) {
    var lista = document.getElementById("lista-videos");
    lista.innerHTML = "";
    var usados = {};
    videos.forEach(function (v) {
      var attrs = { "class": "video" };
      if (v.solucao && !usados[v.solucao]) { attrs.id = "video-" + v.solucao; usados[v.solucao] = true; }
      var fig = el("figure", attrs);
      var arquivo = urlSegura(v.videoUrl);
      var yt = /^[A-Za-z0-9_-]{6,20}$/.test(v.youtubeId || "") ? v.youtubeId : "";
      var quadro;

      if (arquivo) {
        quadro = el("div", { "class": "video__quadro" });
        var video = el("video", { controls: "", preload: "metadata", playsinline: "" });
        video.src = arquivo;
        quadro.appendChild(video);
      } else if (yt) {
        quadro = el("button", { "class": "video__quadro", type: "button", "aria-label": "Assistir " + (v.titulo || "vídeo") },
          '<img src="https://i.ytimg.com/vi/' + yt + '/hqdefault.jpg" alt="" loading="lazy">' + PLAY);
        quadro.addEventListener("click", function () {
          var wrap = el("div", { "class": "video__quadro" });
          wrap.appendChild(el("iframe", {
            src: "https://www.youtube-nocookie.com/embed/" + yt + "?autoplay=1&rel=0",
            title: v.titulo || "Vídeo",
            allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
            allowfullscreen: ""
          }));
          quadro.replaceWith(wrap);
        });
      } else {
        quadro = el("div", { "class": "video__quadro video__quadro--vazio" }, PLAY + "<span>Vídeo em breve</span>");
      }
      fig.appendChild(quadro);
      fig.appendChild(el("figcaption", {}, escapeHtml(v.titulo)));
      lista.appendChild(fig);
    });
  }

  function render(cfg) {
    aplicarTema(cfg.tema || {});
    aplicarTextos(cfg.textos || {});
    aplicarWhatsapp(cfg.whatsapp || {});
    renderSolucoes(cfg.solucoes || []);
    renderAcessos(cfg.solucoes || []);
    renderVideos(cfg.videos || []);
  }

  // ---------- Inicialização ----------

  // Mostra o conteúdo padrão na hora e troca pelo conteúdo do painel quando chegar.
  render(mesclar(padrao, null));

  if (location.protocol === "http:" || location.protocol === "https:") {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 4000);
    fetch("/api/config", { signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (salvo) {
        if (salvo && Object.keys(salvo).length) render(mesclar(padrao, salvo));
      })
      .catch(function () { /* mantém o conteúdo padrão */ })
      .then(function () { clearTimeout(timer); });
  }

  // Menu mobile
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("menu");
  toggle.addEventListener("click", function () {
    var aberto = menu.classList.toggle("menu--aberto");
    toggle.setAttribute("aria-expanded", aberto ? "true" : "false");
  });
  menu.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      menu.classList.remove("menu--aberto");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  document.getElementById("ano").textContent = new Date().getFullYear();
})();
