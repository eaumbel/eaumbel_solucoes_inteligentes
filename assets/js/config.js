/*
 * Configuração da homepage.
 * Edite apenas este arquivo para trocar links, vídeos e o número do WhatsApp.
 */
window.SITE_CONFIG = {
  empresa: "Eaumbel Soluções Inteligentes",

  // Use "link" para um link pronto do WhatsApp (ex.: wa.me/message/...).
  // Se "link" estiver vazio, o site monta o link a partir de "numero" + "mensagem".
  // "numero" no formato internacional, só dígitos: 55 + DDD + número (ex.: "5511999999999").
  whatsapp: {
    link: "https://wa.me/message/FBUQDN5SMSQYF1",
    numero: "",
    mensagem: "Olá! Vim pelo site e gostaria de saber mais sobre as soluções."
  },

  solucoes: [
    {
      id: "gestao",
      nome: "Gestão",
      resumo: "Controle financeiro, operacional e administrativo em um só lugar.",
      recursos: ["Financeiro e fluxo de caixa", "Cadastros e contratos", "Relatórios e indicadores"],
      link: "#", // URL de acesso ao sistema
      icone: "gestao"
    },
    {
      id: "incorporacao",
      nome: "Incorporação",
      resumo: "Acompanhamento de empreendimentos do lançamento à entrega.",
      recursos: ["Gestão de unidades e vendas", "Cronograma de obra", "Controle de custos"],
      link: "#",
      icone: "incorporacao"
    },
    {
      id: "condo-market",
      nome: "Condo Market",
      resumo: "Marketplace e serviços para condomínios e moradores.",
      recursos: ["Ofertas para moradores", "Fornecedores cadastrados", "Comunicação com o condomínio"],
      link: "#",
      icone: "condo"
    }
  ],

  // Vídeos de apresentação. Use o ID do YouTube (o trecho depois de "v=").
  // Exemplo: https://www.youtube.com/watch?v=dQw4w9WgXcQ  ->  "dQw4w9WgXcQ"
  // Deixe youtubeId vazio para exibir o espaço reservado "Em breve".
  videos: [
    { titulo: "Conheça o Gestão", solucao: "gestao", youtubeId: "" },
    { titulo: "Conheça o Incorporação", solucao: "incorporacao", youtubeId: "" },
    { titulo: "Conheça o Condo Market", solucao: "condo-market", youtubeId: "" }
  ]
};
