import { permanentRedirect } from "next/navigation";
import { routes } from "@/lib/routes";

/**
 * Alias legado de `/market`.
 * Mantido para links antigos — não adicione UI aqui.
 * Rota canônica: `routes.market` → `/market`.
 */
export default function MarketplaceAliasPage() {
  permanentRedirect(routes.market);
}
