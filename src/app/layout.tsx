import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, Geist_Mono, Sora } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/context";
import { CartProvider } from "@/features/cart";
import { FavoritesProvider } from "@/features/favorites";
import { ConsentGate } from "@/features/marketing/components/consent-gate";
import { MarketingScripts } from "@/features/marketing/components/marketing-scripts";
import { NotificationsProvider } from "@/features/notifications";
import { RealtimeProvider } from "@/features/realtime";
import { cn } from "@/lib/utils";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Elloot - Compre com segurança e praticidade",
    template: "%s - Elloot - Compre com segurança e praticidade",
  },
  description:
    "Compre e venda contas e itens digitais com escrow. Pagamento seguro até a entrega.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        dmSans.variable,
        sora.variable,
        geistMono.variable,
        "font-sans",
      )}
    >
      <body className="flex min-h-full flex-col" data-nonce={nonce}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <TooltipProvider delay={200}>
            <AuthProvider>
              <RealtimeProvider>
                <NotificationsProvider>
                  <FavoritesProvider>
                    <CartProvider>
                      <MarketingScripts
                        includeScopes={["platform"]}
                        event={{ name: "page_view" }}
                        nonce={nonce}
                      />
                      {children}
                      <ConsentGate />
                    </CartProvider>
                  </FavoritesProvider>
                </NotificationsProvider>
              </RealtimeProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
