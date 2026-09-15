import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://www.elloot.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/sell",
        "/orders",
        "/cart",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/auth",
        "/ui",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
