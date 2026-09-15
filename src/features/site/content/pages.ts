export type SitePageContent = {
  title: string;
  description: string;
  sections: Array<{
    heading?: string;
    body: string[];
  }>;
};

export const sitePages = {
  blog: {
    title: "Blog",
    description: "Novidades, guias e atualizações da Elloot.",
    sections: [
      {
        body: [
          "Em breve vamos publicar conteúdos sobre compra e venda segura, boas práticas de escrow e novidades da plataforma.",
        ],
      },
    ],
  },
  faq: {
    title: "Perguntas frequentes",
    description: "Respostas rápidas sobre compra, venda e escrow na Elloot.",
    sections: [
      {
        heading: "O que é escrow?",
        body: [
          "É a intermediação do pagamento: o valor fica retido na Elloot até a entrega ser confirmada. Assim comprador e vendedor ficam protegidos.",
        ],
      },
      {
        heading: "Quando o vendedor recebe?",
        body: [
          "Após a confirmação da entrega pelo comprador, ou quando o prazo de auto-liberação termina sem disputa.",
        ],
      },
      {
        heading: "Posso abrir uma disputa?",
        body: [
          "Sim. Se houver problema na entrega, abra uma disputa pelo pedido para a equipe analisar o caso.",
        ],
      },
    ],
  },
  help: {
    title: "Central de ajuda",
    description: "Suporte para compradores e vendedores da Elloot.",
    sections: [
      {
        body: [
          "Precisa de ajuda com um pedido, anúncio ou pagamento? Fale com nosso time pelo Discord ou pela página de contato.",
          "Tenha em mãos o número do pedido e prints relevantes para agilizar o atendimento.",
        ],
      },
    ],
  },
  "how-it-works": {
    title: "Como funciona",
    description: "O fluxo de compra e venda com escrow na Elloot.",
    sections: [
      {
        heading: "1. Escolha e peça",
        body: [
          "O comprador escolhe um anúncio e inicia o pedido. O pagamento fica bloqueado em escrow.",
        ],
      },
      {
        heading: "2. Entrega",
        body: [
          "O vendedor entrega o produto/serviço pelo chat da plataforma, com registro da conversa.",
        ],
      },
      {
        heading: "3. Liberação",
        body: [
          "O comprador confirma a entrega (ou o prazo encerra). O valor é creditado na carteira do vendedor.",
        ],
      },
    ],
  },
  advantages: {
    title: "Vantagens",
    description: "Por que comprar e vender na Elloot.",
    sections: [
      {
        heading: "Segurança",
        body: [
          "Pagamento intermediado por escrow reduz golpe e aumenta a confiança nas negociações.",
        ],
      },
      {
        heading: "Praticidade",
        body: [
          "Pedido, chat e liberação ficam na mesma plataforma — sem combinações por fora.",
        ],
      },
      {
        heading: "Transparência",
        body: [
          "Histórico do pedido e regras claras de liberação e disputa para ambos os lados.",
        ],
      },
    ],
  },
  fees: {
    title: "Tarifas e prazos",
    description: "Taxas da plataforma e tempos do fluxo de escrow.",
    sections: [
      {
        heading: "Taxa da plataforma",
        body: [
          "A Elloot cobra uma taxa percentual sobre o valor do pedido (configurável no backend). O valor líquido é creditado ao vendedor após a liberação.",
        ],
      },
      {
        heading: "Prazos",
        body: [
          "O checkout tem tempo limite para pagamento. Após a entrega, há prazo de confirmação; se não houver disputa, o escrow pode ser liberado automaticamente.",
        ],
      },
    ],
  },
  "payment-methods": {
    title: "Formas de pagamento",
    description: "Como pagar e receber na Elloot.",
    sections: [
      {
        heading: "PIX",
        body: [
          "Compras são pagas via PIX no checkout. O valor fica retido em escrow até a entrega ser confirmada (ou o prazo de auto-liberação).",
          "Após a liberação, o vendedor vê o saldo na carteira e pode solicitar saque por PIX, sujeito à verificação de identidade.",
        ],
      },
      {
        heading: "Outros métodos",
        body: [
          "Cartão e demais métodos podem ser adicionados no futuro. O checkout mostra apenas o que estiver disponível no momento da compra.",
        ],
      },
    ],
  },
  "account-verifier": {
    title: "Verificador de contas",
    description: "Confira se um perfil ou anúncio faz sentido antes de negociar.",
    sections: [
      {
        body: [
          "Negocie apenas dentro da Elloot. Desconfie de pedidos para pagar ou entregar por fora da plataforma.",
          "Em breve esta página terá ferramentas para validar reputação e status de contas. Enquanto isso, use o chat oficial e o escrow em todos os pedidos.",
        ],
      },
    ],
  },
  terms: {
    title: "Termos de uso",
    description: "Regras de uso da plataforma Elloot.",
    sections: [
      {
        body: [
          "Ao criar uma conta e usar a Elloot, você concorda em negociar produtos digitais de forma lícita, respeitar o fluxo de escrow e não contornar a intermediação da plataforma.",
          "A Elloot pode suspender contas que violem as regras, pratiquem fraude ou abusem do sistema de disputas.",
          "Esta é uma versão inicial dos termos e será atualizada conforme a operação amadurecer.",
        ],
      },
    ],
  },
  rewards: {
    title: "Programa de recompensa",
    description: "Benefícios para quem indica e engaja na Elloot.",
    sections: [
      {
        body: [
          "Em breve lançaremos um programa de recompensas para indicações e vendedores ativos.",
          "Fique de olho no blog e nas novidades da conta para participar assim que estiver disponível.",
        ],
      },
    ],
  },
  privacy: {
    title: "Política de privacidade",
    description: "Como tratamos seus dados na Elloot.",
    sections: [
      {
        body: [
          "Coletamos dados necessários para conta, pedidos, pagamento e segurança (como e-mail, perfil e registros de transação).",
          "Não vendemos seus dados. Compartilhamentos ocorrem apenas quando necessários para operação, cumprimento legal ou prevenção a fraudes.",
          "Você pode solicitar atualização de dados pela área da conta ou pelo suporte.",
        ],
      },
    ],
  },
  refund: {
    title: "Política de reembolso",
    description: "Quando um valor pode ser devolvido.",
    sections: [
      {
        body: [
          "Como o pagamento fica em escrow, o reembolso ao comprador pode ocorrer se a entrega não for cumprida, se houver cancelamento elegível ou se uma disputa for resolvida a favor do comprador.",
          "Produtos digitais entregues e confirmados normalmente não são reembolsáveis, salvo decisão em disputa ou erro operacional comprovado.",
        ],
      },
    ],
  },
  careers: {
    title: "Trabalhe conosco",
    description: "Faça parte da Elloot.",
    sections: [
      {
        body: [
          "Estamos construindo um marketplace de produtos digitais com foco em segurança e experiência.",
          "Se quiser colaborar, envie uma mensagem pela página de contato contando sua experiência e área de interesse.",
        ],
      },
    ],
  },
  contact: {
    title: "Fale conosco",
    description: "Canais oficiais de atendimento da Elloot.",
    sections: [
      {
        body: [
          "Para suporte de pedidos, use o Discord da comunidade ou abra um chamado pela central de ajuda.",
          "Para assuntos comerciais e parcerias, descreva sua proposta com o máximo de detalhes possível.",
        ],
      },
    ],
  },
} as const satisfies Record<string, SitePageContent>;

export type SitePageSlug = keyof typeof sitePages;
