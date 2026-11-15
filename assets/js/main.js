(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var solucoes = cfg.solucoes || [];

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function linkValido(url) {
    return url && url !== "#";
  }

  function icone(nome) {
    return '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><use href="#ico-' + nome + '"/></svg>';
  }

  // WhatsApp
  var wa = cfg.whatsapp || {};
  var waUrl = "https://wa.me/" + (wa.numero || "") + "?text=" + encodeURIComponent(wa.mensagem || "");
  document.querySelectorAll("[data-whatsapp]").forEach(function (a) {
    a.href = waUrl;
    a.target = "_blank";
    a.rel = "noopener";
  });

  // Cards de soluções
  var lista = document.getElementById("lista-solucoes");
  solucoes.forEach(function (s) {
    var recursos = (s.recursos || []).map(function (r) { return "<li>" + escapeHtml(r) + "</li>"; }).join("");
    var card = el("article", { "class": "card", id: "solucao-" + s.id },
      '<div class="card__icone">' + icone(s.icone) + "</div>" +
      "<h3>" + escapeHtml(s.nome) + "</h3>" +
      "<p>" + escapeHtml(s.resumo) + "</p>" +
      "<ul>" + recursos + "</ul>" +
      '<div class="card__acoes">' +
        '<a class="link" href="#video-' + s.id + '">Ver vídeo</a>' +
        '<a class="link" href="#acesso-' + s.id + '">Acessar ' + icone("seta") + "</a>" +
      "</div>");
    lista.appendChild(card);
  });

  // Botões de acesso
  var acessos = document.getElementById("lista-acessos");
  solucoes.forEach(function (s) {
    var ativo = linkValido(s.link);
    var a = el("a", {
      "class": "acesso" + (ativo ? "" : " acesso--off"),
      id: "acesso-" + s.id,
      href: ativo ? s.link : "#acesso"
    },
      '<span class="acesso__icone">' + icone(s.icone) + "</span>" +
      '<span class="acesso__texto"><strong>' + escapeHtml(s.nome) + "</strong><small>" +
        (ativo ? "Entrar no sistema" : "Link em breve") + "</small></span>" +
      icone("seta"));
    if (ativo) { a.target = "_blank"; a.rel = "noopener"; }
    else { a.setAttribute("aria-disabled", "true"); }
    acessos.appendChild(a);
  });

  // Vídeos
  var videos = document.getElementById("lista-videos");
  (cfg.videos || []).forEach(function (v) {
    var fig = el("figure", { "class": "video", id: "video-" + v.solucao });
    var quadro;
    if (v.youtubeId) {
      quadro = el("button", { "class": "video__quadro", type: "button", "aria-label": "Assistir " + v.titulo },
        '<img src="https://i.ytimg.com/vi/' + encodeURIComponent(v.youtubeId) + '/hqdefault.jpg" alt="" loading="lazy">' +
        '<span class="video__play">' + '<svg viewBox="0 0 24 24" width="32" height="32"><use href="#ico-play"/></svg></span>');
      quadro.addEventListener("click", function () {
        var iframe = el("iframe", {
          src: "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(v.youtubeId) + "?autoplay=1&rel=0",
          title: v.titulo,
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: ""
        });
        var wrap = el("div", { "class": "video__quadro" });
        wrap.appendChild(iframe);
        quadro.replaceWith(wrap);
      });
    } else {
      quadro = el("div", { "class": "video__quadro video__quadro--vazio" },
        '<span class="video__play">' + '<svg viewBox="0 0 24 24" width="32" height="32"><use href="#ico-play"/></svg></span>' +
        "<span>Vídeo em breve</span>");
    }
    fig.appendChild(quadro);
    fig.appendChild(el("figcaption", {}, escapeHtml(v.titulo)));
    videos.appendChild(fig);
  });

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
