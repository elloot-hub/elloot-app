import type { MetadataRoute } from "next";
import { routes } from "@/lib/routes";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://www.elloot.com.br";

const publicPaths = [
  routes.home,
  routes.market,
  routes.howItWorks,
  routes.advantages,
  routes.fees,
  routes.paymentMethods,
  routes.faq,
  routes.help,
  routes.blog,
  routes.terms,
  routes.privacy,
  routes.refund,
  routes.careers,
  routes.contact,
  routes.rewards,
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return publicPaths.map((path) => ({
    url: `${siteUrl}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" || path === "/market" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/market" ? 0.9 : 0.6,
  }));
}
