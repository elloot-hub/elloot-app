"use client";

import Image from "next/image";
import Link from "next/link";
import { FaDiscord, FaInstagram, FaYoutube, FaXTwitter, } from "react-icons/fa6";
import { MessageCircleIcon } from "lucide-react";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const DISCORD_URL = "https://discord.gg/";
const SOCIAL = [
  { href: DISCORD_URL, label: "Discord", Icon: FaDiscord },
  { href: "https://youtube.com/", label: "YouTube", Icon: FaYoutube },
  { href: "https://x.com/", label: "X", Icon: FaXTwitter },
  { href: "https://instagram.com/", label: "Instagram", Icon: FaInstagram },
] as const;

const QUICK_LINKS = [
  { href: routes.sell, label: "Anunciar" },
  { href: routes.blog, label: "Blog" },
  { href: routes.faq, label: "Perguntas frequentes" },
  { href: routes.market, label: "Categorias" },
  { href: routes.help, label: "Central de ajuda" },
] as const;

const INSTITUTIONAL_LINKS = [
  { href: routes.howItWorks, label: "Como funciona" },
  { href: routes.advantages, label: "Vantagens" },
  { href: routes.fees, label: "Tarifas e prazos" },
  { href: routes.paymentMethods, label: "Formas de pagamento" },
  { href: routes.accountVerifier, label: "Verificador de contas" },
] as const;

const LEGAL_LINKS = [
  { href: routes.terms, label: "Termos de Uso" },
  { href: routes.rewards, label: "Programa de Recompensa" },
  { href: routes.privacy, label: "Política de Privacidade" },
  { href: routes.refund, label: "Política de Reembolso" },
  { href: routes.careers, label: "Trabalhe Conosco" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/50 bg-card/40">
      <Container className="py-12 sm:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <Link
              href={routes.home}
              className="inline-flex outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Elloot início"
            >
              <Image
                src="/elloot-navbar.png"
                alt="Elloot"
                width={140}
                height={32}
                className="h-10 w-auto object-contain select-none"
              />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Somos a solução para o mercado digital: uma plataforma moderna para
              o comprador receber o produto desejado e o vendedor receber pela
              venda — com praticidade e segurança via escrow.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {SOCIAL.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Acesso rápido">
            {QUICK_LINKS.map((link) => (
              <FooterLink key={link.href} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Institucional">
            {INSTITUTIONAL_LINKS.map((link) => (
              <FooterLink key={link.href} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <div className="space-y-4">
            <p className="font-heading text-xs font-semibold tracking-[0.16em] text-foreground uppercase">
              Precisa de ajuda?
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Estamos aqui para ajudar. Nossa equipe de suporte especializada
              está à sua disposição.
            </p>
            <div className="flex flex-col gap-2.5">
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "default" }),
                  "h-11 justify-center rounded-xl bg-[#5865F2] text-white hover:bg-[#4752C4]",
                )}
              >
                <FaDiscord className="size-4" />
                Junte-se ao Discord
              </a>
              <Link
                href={routes.contact}
                className={cn(
                  buttonVariants({ variant: "secondary", size: "default" }),
                  "h-11 justify-center rounded-xl",
                )}
              >
                <MessageCircleIcon className="size-4" />
                Vamos conversar
              </Link>
            </div>
          </div>
        </div>
      </Container>

      <div className="border-t border-border/50">
        <Container className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="shrink-0 space-y-0.5 text-xs text-muted-foreground sm:text-right">
            <p>Copyright © Elloot {new Date().getFullYear()}</p>
            <p>Marketplace com intermediação segura</p>
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children, }: { title: string; children: React.ReactNode; }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">
        {title}
      </p>
      <div className="flex flex-col gap-2 text-sm">{children}</div>
    </div>
  );
}

function FooterLink({ href, children, }: { href: string; children: React.ReactNode; }) {
  return (
    <Link
      href={href}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}
