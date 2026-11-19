/*
 * Conteúdo padrão da homepage.
 * O que for salvo na área de administração (/admin) substitui estes valores.
 */
window.SITE_CONFIG = {
  empresa: "Eaumbel Soluções Inteligentes",

  tema: {
    primaria: "#1748c0",
    destaque: "#18b6a0"
  },

  textos: {
    heroTag: "Tecnologia para o mercado imobiliário",
    heroTitulo: "Soluções inteligentes para",
    heroDestaque: "gestão, incorporação e condomínios",
    heroSubtitulo: "Sistemas desenvolvidos para simplificar a rotina, organizar informações e apoiar decisões com mais segurança.",
    ctaTitulo: "Vamos conversar?",
    ctaTexto: "Tire dúvidas, peça uma demonstração ou solicite uma proposta pelo WhatsApp."
  },

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
      link: "https://imobiliaria20.eaumbel.com.br/",
      icone: "gestao"
    },
    {
      id: "incorporacao",
      nome: "Incorporação",
      resumo: "Acompanhamento de empreendimentos do lançamento à entrega.",
      recursos: ["Gestão de unidades e vendas", "Cronograma de obra", "Controle de custos"],
      link: "https://incorporacao.eaumbel.com.br/",
      icone: "incorporacao"
    },
    {
      id: "condo-market",
      nome: "Condo Market",
      resumo: "Marketplace e serviços para condomínios e moradores.",
      recursos: ["Ofertas para moradores", "Fornecedores cadastrados", "Comunicação com o condomínio"],
      link: "https://condo-market.lovable.app",
      icone: "condo"
    }
  ],

  // Vídeos de apresentação: "videoUrl" (arquivo enviado pelo painel) ou "youtubeId".
  // Sem nenhum dos dois, o quadro aparece como "Vídeo em breve".
  videos: [
    { titulo: "Conheça o Gestão", solucao: "gestao", youtubeId: "", videoUrl: "" },
    { titulo: "Conheça o Incorporação", solucao: "incorporacao", youtubeId: "", videoUrl: "" },
    { titulo: "Conheça o Condo Market", solucao: "condo-market", youtubeId: "", videoUrl: "" }
  ]
};
