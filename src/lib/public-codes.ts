type WithCode = { code?: string | null; id: string };

function fallbackShort(id: string) {
  return id.slice(-8).toUpperCase();
}

export function formatPublicCode(entity: WithCode): string {
  if (entity.code) return entity.code;
  return fallbackShort(entity.id);
}

export function publicRouteRef(entity: WithCode): string {
  return entity.code ?? entity.id;
}

export const formatOrderCode = formatPublicCode;
export const orderRouteRef = publicRouteRef;

export const formatListingCode = formatPublicCode;
export const listingRouteRef = publicRouteRef;

export const formatDisputeCode = formatPublicCode;
export const disputeRouteRef = publicRouteRef;

export const formatPayoutCode = formatPublicCode;
export const payoutRouteRef = publicRouteRef;
