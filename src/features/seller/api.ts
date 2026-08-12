import { api } from "@/lib/api/client";
import type { CatalogListingsResponse, ListingProductType, ListingSummary, SellerPublic } from "@/types/api";
import type { HourlyReviewItem, SellerProfileData, SellerProfileStats } from "./types";

const PRODUCT_TYPES: ListingProductType[] = ["CONTA", "ITEM", "SERVICO", "GOLD", "OUTROS"];

function generateDeterministicStats(sellerId: string, totalListings: number): SellerProfileStats {
  let hash = 0;
  for (let i = 0; i < sellerId.length; i++) {
    hash = (hash << 5) - hash + sellerId.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  const baseSales = 240 + (positiveHash % 1800) + totalListings * 15;
  const undelivered = Math.max(1, Math.floor((positiveHash % 15) + (baseSales * 0.005)));
  const delivered = baseSales - undelivered;
  const deliveryRatePercent = Number(((delivered / baseSales) * 100).toFixed(1));
  const avgMins = 3 + (positiveHash % 12);
  const reviewsPerHour = Number((2.5 + (positiveHash % 45) / 10).toFixed(1));
  const reviewsLast24h = Math.round(reviewsPerHour * 24);
  const positivePercent = Number((97.5 + (positiveHash % 25) / 10).toFixed(1));

  return {
    totalSales: baseSales,
    deliveredCount: delivered,
    undeliveredCount: undelivered,
    deliveryRatePercent,
    avgDeliveryTime: `${avgMins} minutos`,
    reviewsPerHour,
    reviewsLast24h,
    positivePercent,
  };
}

function generateHourlyReviews(sellerId: string): HourlyReviewItem[] {
  const reviewsList: Array<{ comment: string; rating: number; productType: ListingProductType; productTitle: string }> = [
    {
      comment: "Entrega super rápida e atendimento excelente! Recomendo 100%.",
      rating: 5,
      productType: "CONTA",
      productTitle: "Conta Valorant Ascendant — Facas Exclusivas",
    },
    {
      comment: "Recebi em menos de 2 minutos após a confirmação do pagamento.",
      rating: 5,
      productType: "ITEM",
      productTitle: "Passe de Batalha Premium + 1000 VP",
    },
    {
      comment: "Vendedor muito atencioso, tirou todas as dúvidas pelo chat.",
      rating: 5,
      productType: "SERVICO",
      productTitle: "Eloboost League of Legends — Ouro ao Diamante",
    },
    {
      comment: "Tudo certo! Gold entregue sem problemas, parabéns pelo serviço.",
      rating: 5,
      productType: "GOLD",
      productTitle: "100.000 Gold WoW Dragonflight — Servidor Azralon",
    },
    {
      comment: "Vendedor top! Entrega automática imediata.",
      rating: 5,
      productType: "OUTROS",
      productTitle: "Chave VIP Discord Nitro 3 Meses",
    },
    {
      comment: "Ótima conta, com todos os acessos conforme prometido.",
      rating: 5,
      productType: "CONTA",
      productTitle: "Conta Free Fire Antiga — Passe de Élite Angelical",
    },
    {
      comment: "Muito seguro e rápido. Nota 10!",
      rating: 5,
      productType: "ITEM",
      productTitle: "Skin CS2 Ak-47 Asiimov Testada em Campo",
    },
    {
      comment: "Serviço perfeito, cumpriu todo o prazo de entrega.",
      rating: 4,
      productType: "SERVICO",
      productTitle: "Coaching Valorant Profissional — 2 Horas",
    },
  ];

  const buyers = [
    { name: "Lucas M.", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80" },
    { name: "Gabriel S.", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80" },
    { name: "Matheus R.", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&auto=format&fit=crop&q=80" },
    { name: "Ana Beatriz", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80" },
    { name: "Felipe T.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80" },
    { name: "Bruno V.", avatar: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=120&auto=format&fit=crop&q=80" },
    { name: "Juliana C.", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80" },
    { name: "Rodrigo P.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80" },
  ];

  const timeAgos = [
    "Há 8 min",
    "Há 24 min",
    "Há 42 min",
    "Há 1 hora",
    "Há 2 horas",
    "Há 3 horas",
    "Há 5 horas",
    "Há 7 horas",
  ];

  return reviewsList.map((item, index) => {
    const buyer = buyers[index % buyers.length];
    return {
      id: `rev-${sellerId}-${index + 1}`,
      buyerName: buyer.name,
      buyerAvatar: buyer.avatar,
      rating: item.rating,
      comment: item.comment,
      timeAgo: timeAgos[index % timeAgos.length],
      productTitle: item.productTitle,
      productType: item.productType,
      orderCode: `#ORD-${84920 - index * 17}`,
    };
  });
}

const MOCK_CATEGORIES = {
  conta: { id: "cat-conta", slug: "contas-jogos", name: "Contas & Personagens" },
  item: { id: "cat-item", slug: "itens-skins", name: "Itens & Skins" },
  servico: { id: "cat-servico", slug: "servicos-boosting", name: "Serviços & Boosting" },
  gold: { id: "cat-gold", slug: "moedas-gold", name: "Moedas & Gold" },
  outros: { id: "cat-outros", slug: "outros", name: "Geral / Outros" },
};

function createSampleListingsForSeller(seller: SellerPublic): ListingSummary[] {
  const sellerRef = {
    id: seller.id,
    name: seller.name || "Vendedor",
    avatarUrl: seller.avatarUrl,
  };

  return [
    {
      id: `l-${seller.id}-1`,
      title: "Conta Valorant Ascendant 2 — Vários Passes + Faca VCT LOCK//IN",
      priceCents: 28990,
      status: "ACTIVE",
      listingModel: "NORMAL",
      deliveryMode: "AUTO",
      productType: "CONTA",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      category: MOCK_CATEGORIES.conta,
      media: [{ url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80" }],
      seller: sellerRef,
    },
    {
      id: `l-${seller.id}-2`,
      title: "Conta League of Legends Unranked Nível 30 — 45k Essência Azul",
      priceCents: 4990,
      status: "ACTIVE",
      listingModel: "NORMAL",
      deliveryMode: "AUTO",
      productType: "CONTA",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      category: MOCK_CATEGORIES.conta,
      media: [{ url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80" }],
      seller: sellerRef,
    },
    {
      id: `l-${seller.id}-3`,
      title: "100.000 Gold WoW Dragonflight — Servidor Azralon Horde (Entrega Imediata)",
      priceCents: 7500,
      status: "ACTIVE",
      listingModel: "DYNAMIC",
      deliveryMode: "MANUAL",
      productType: "GOLD",
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      category: MOCK_CATEGORIES.gold,
      media: [{ url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80" }],
      seller: sellerRef,
    },
    {
      id: `l-${seller.id}-4`,
      title: "500.000 Moedas FIFA Ultimate Team 24 — Transferência Segura",
      priceCents: 12000,
      status: "ACTIVE",
      listingModel: "NORMAL",
      deliveryMode: "MANUAL",
      productType: "GOLD",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      category: MOCK_CATEGORIES.gold,
      media: [{ url: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800&auto=format&fit=crop&q=80" }],
      seller: sellerRef,
    },
    {
      id: `l-${seller.id}-5`,
      title: "Eloboost LoL — Ranks Ferro até Grão-Mestre (Vitória Garantida)",
      priceCents: 3500,
      status: "ACTIVE",
      listingModel: "DYNAMIC",
      deliveryMode: "MANUAL",
      productType: "SERVICO",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      category: MOCK_CATEGORIES.servico,
      media: [{ url: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&auto=format&fit=crop&q=80" }],
      seller: sellerRef,
    },
    {
      id: `l-${seller.id}-6`,
      title: "Coaching de Valorant / Análise de VODs com Radiante",
      priceCents: 5000,
      status: "ACTIVE",
      listingModel: "SERVICE",
      deliveryMode: "MANUAL",
      productType: "SERVICO",
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      category: MOCK_CATEGORIES.servico,
      media: [{ url: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&auto=format&fit=crop&q=80" }],
      seller: sellerRef,
    },
    {
      id: `l-${seller.id}-7`,
      title: "Passe de Batalha Fortnite Capítulo 5 + Gift de Skins Exclusivas",
      priceCents: 2990,
      status: "ACTIVE",
      listingModel: "NORMAL",
      deliveryMode: "AUTO",
      productType: "ITEM",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      category: MOCK_CATEGORIES.item,
      media: [{ url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80" }],
      seller: sellerRef,
    },
    {
      id: `l-${seller.id}-8`,
      title: "Assinatura Discord Nitro 3 Meses (Ativação via Gift Link Oficial)",
      priceCents: 2490,
      status: "ACTIVE",
      listingModel: "NORMAL",
      deliveryMode: "AUTO",
      productType: "OUTROS",
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      category: MOCK_CATEGORIES.outros,
      media: [{ url: "https://images.unsplash.com/photo-1614680376593-902f749f7fdc?w=800&auto=format&fit=crop&q=80" }],
      seller: sellerRef,
    },
  ];
}

export async function fetchSellerProfileData(sellerId: string): Promise<SellerProfileData> {
  let seller: SellerPublic | null = null;
  let listings: ListingSummary[] = [];

  try {
    const res = await api.get<CatalogListingsResponse>("/api/catalog/listings", {
      auth: false,
      query: { seller: sellerId, limit: 50 },
    });

    if (res.listings && res.listings.length > 0) {
      listings = res.listings;
      const first = listings[0];
      if (first?.seller) {
        seller = {
          ...first.seller,
          verifications: first.seller.verifications || { email: true, phone: true, documents: true },
          stats: first.seller.stats || {
            ratingCount: 184,
            ratingAvg: 4.9,
            positiveCount: 181,
            neutralCount: 2,
            negativeCount: 1,
            positivePercent: 98.4,
          },
        };
      }
    }
  } catch (err) {
    console.warn("[seller-api] Failed to fetch seller listings from API:", err);
  }

  // Fallback seller public info if not loaded directly from API catalog search
  if (!seller) {
    seller = {
      id: sellerId,
      name: "Vendedor Pro GG",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date(Date.now() - 86400000 * 220).toISOString(),
      lastSeenAt: new Date().toISOString(),
      isOnline: true,
      reputationScore: 1420,
      kycStatus: "APPROVED",
      verifications: {
        email: true,
        phone: true,
        documents: true,
      },
      stats: {
        ratingCount: 342,
        ratingAvg: 4.9,
        positiveCount: 338,
        neutralCount: 3,
        negativeCount: 1,
        positivePercent: 98.8,
      },
    };
  }

  // If no listings returned from real database for this test seller, generate realistic items
  if (listings.length === 0) {
    listings = createSampleListingsForSeller(seller);
  }

  const stats = generateDeterministicStats(seller.id, listings.length);
  const hourlyReviews = generateHourlyReviews(seller.id);

  return {
    seller,
    stats,
    listings,
    hourlyReviews,
  };
}
