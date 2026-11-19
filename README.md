# eaumbel_solucoes_inteligentes

Homepage institucional da **Eaumbel Soluções Inteligentes**. Ela apresenta as soluções (Gestão, Incorporação e Condo Market), traz os links de acesso aos sistemas e os vídeos de apresentação, e oferece contato pelo WhatsApp.

Tem também uma **área de administração** em `/admin` para trocar textos, cores, links e vídeos sem mexer no código. O acesso exige senha e código do **Google Authenticator** (autenticação em 2 fatores).

## Estrutura

```
index.html             Página principal
assets/                CSS, JS e imagens da página
assets/js/config.js    Conteúdo padrão (usado enquanto nada for salvo no painel)
admin/                 Área de administração
api/                   Funções da Vercel (login, 2FA, salvar conteúdo, upload)
vercel.json            Cabeçalhos de segurança do painel
```

## Configurar a área de administração (uma vez)

### 1. Conectar o Vercel Blob (onde ficam o conteúdo e os vídeos)
1. No projeto da Vercel, abra **Storage** → **Create Database** → **Blob**.
2. Dê um nome (ex.: `eaumbel-site`), deixe o acesso **público** e conecte ao projeto, marcando todos os ambientes.
3. Isso cria sozinho a variável `BLOB_READ_WRITE_TOKEN`.

### 2. Criar as variáveis de ambiente
Em **Settings → Environment Variables**, crie (marcando todos os ambientes):

| Nome | Valor |
|---|---|
| `ADMIN_PASSWORD` | Uma senha forte, com pelo menos 12 caracteres |
| `SESSION_SECRET` | Uma sequência aleatória com pelo menos 32 caracteres (ex.: gerada em um gerenciador de senhas) |

Depois vá em **Deployments → ⋯ → Redeploy**.

### 3. Configurar o Google Authenticator
1. Acesse `https://SEU-DOMINIO/admin`.
2. Digite a senha. Vai aparecer um QR Code.
3. No celular, abra o Google Authenticator → **+** → **Ler código QR**.
4. Digite o código de 6 dígitos para confirmar.
5. O painel mostra a chave `TOTP_SECRET`. Crie essa variável na Vercel com esse valor e faça **Redeploy** de novo.

Pronto: a partir daí o login pede **senha + código do app**. A tela de configuração do QR Code fica desativada.

## Uso do painel
- **Cores**: cor principal e de destaque, com prévia e botão para restaurar o padrão.
- **Textos**: título, subtítulo, etiqueta, contato e link do WhatsApp.
- **Soluções**: nome, descrição, recursos e link de acesso de cada sistema.
- **Vídeos**: envie um arquivo (MP4, WebM ou MOV, até 200 MB) ou cole um link do YouTube. Dá para adicionar, excluir e reordenar.

Clique em **Salvar alterações**. O site é atualizado em até 1 minuto.

## Segurança
- Senha, chave de sessão e chave do autenticador ficam só nas variáveis de ambiente da Vercel, nunca no código.
- A sessão expira em 8 horas e usa cookie `HttpOnly`, `Secure` e `SameSite=Strict`.
- Após 5 tentativas erradas, o login fica bloqueado por 15 minutos.
- O envio de vídeos só é autorizado para quem está logado, e só para a pasta `videos/`.

**Perdeu o celular?** Apague a variável `TOTP_SECRET` na Vercel, faça Redeploy e repita o passo 3. Para derrubar todas as sessões abertas, troque o `SESSION_SECRET`.

## Testar localmente

```bash
npm install
```

```bash
ADMIN_PASSWORD='uma-senha-de-teste' SESSION_SECRET='uma-chave-aleatoria-com-32-caracteres-ou-mais' npm run dev
```

Abra http://localhost:3000 (site) e http://localhost:3000/admin (painel). Sem o Vercel Blob, o conteúdo é salvo em `.data/config.json` e o envio de vídeos fica desativado.
