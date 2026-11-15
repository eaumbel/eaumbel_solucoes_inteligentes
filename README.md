# eaumbel_solucoes_inteligentes

Homepage institucional da **Eaumbel Soluções Inteligentes**. Ela apresenta as soluções desenvolvidas (Gestão, Incorporação e Condo Market), traz os links de acesso a cada sistema e os vídeos de apresentação, e oferece contato pelo WhatsApp.

O site é estático (HTML, CSS e JavaScript puros), sem build nem dependências.

## Estrutura

```
index.html            Página principal
assets/css/style.css  Estilos
assets/js/config.js   Links, vídeos e WhatsApp (edite aqui)
assets/js/main.js     Monta as seções a partir do config
assets/img/           Ícone/logo
```

## Como editar o conteúdo

Todas as informações ficam em `assets/js/config.js`:

- **WhatsApp**: em `whatsapp.link`, coloque o link pronto do WhatsApp (ex.: `https://wa.me/message/...`). Se preferir montar pelo número, deixe `link` vazio e preencha `whatsapp.numero` só com dígitos, com 55 + DDD + número (ex.: `5511999999999`).
- **Links dos sistemas**: troque `link: "#"` pela URL de cada sistema. Enquanto o link for `#`, o botão aparece como "Link em breve".
- **Vídeos**: em `youtubeId`, coloque o ID do vídeo do YouTube. Por exemplo, em `https://www.youtube.com/watch?v=abc123`, o ID é `abc123`. Sem ID, o quadro aparece como "Vídeo em breve".
- **Textos das soluções**: altere `resumo` e `recursos`.

## Visualizar localmente

Abra o `index.html` no navegador ou rode:

```bash
python3 -m http.server 8000
```

Depois acesse http://localhost:8000.

## Publicar no GitHub Pages

Em **Settings → Pages**, selecione o branch `main` e a pasta `/ (root)`.
