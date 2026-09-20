"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  readMarketingConsent,
  writeMarketingConsent,
  MARKETING_CONSENT_VERSION,
  type MarketingConsent,
} from "@/features/marketing/api";
import { routes } from "@/lib/routes";

type CategoryState = {
  essential: true;
  marketing: boolean;
};

/**
 * Consentimento por categoria (CMP mínimo in-house).
 * Essenciais sempre ativos; marketing controla pixels.
 */
export function ConsentGate() {
  const [consent, setConsent] = useState<MarketingConsent>(null);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    setConsent(readMarketingConsent());
    setReady(true);
    function onChange() {
      setConsent(readMarketingConsent());
    }
    window.addEventListener("elloot:marketing-consent", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("elloot:marketing-consent", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  if (!ready || consent !== null) return null;

  function apply(choice: "granted" | "denied") {
    writeMarketingConsent(choice);
  }

  function saveCustom() {
    apply(marketing ? "granted" : "denied");
  }

  const categories: CategoryState = {
    essential: true,
    marketing,
  };
  void categories;

  return (
    <div
      role="dialog"
      aria-label="Preferências de cookies"
      aria-modal="true"
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-border/80 bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:p-5"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <p className="text-sm font-medium">Cookies e privacidade</p>
            <p className="text-sm text-muted-foreground">
              Usamos cookies essenciais para o site funcionar e, com o seu
              aceite, cookies de marketing (pixels da Elloot e dos vendedores)
              para medir campanhas. Versão {MARKETING_CONSENT_VERSION}.{" "}
              <Link
                href={routes.privacy}
                className="underline underline-offset-2 hover:text-foreground"
              >
                Política de privacidade
              </Link>
            </p>
          </div>
          {!expanded ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpanded(true)}
              >
                Personalizar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => apply("denied")}
              >
                Só essenciais
              </Button>
              <Button type="button" size="sm" onClick={() => apply("granted")}>
                Aceitar marketing
              </Button>
            </div>
          ) : null}
        </div>

        {expanded ? (
          <div className="space-y-3 rounded-md border border-border/60 bg-muted/30 p-3">
            <label className="flex items-start justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">Essenciais</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Sessão, segurança e carrinho. Sempre ativos.
                </span>
              </span>
              <input
                type="checkbox"
                checked
                disabled
                className="mt-1 size-4 accent-primary"
                aria-label="Cookies essenciais (obrigatórios)"
              />
            </label>
            <label className="flex items-start justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">Marketing</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Facebook Pixel, TikTok, Google Ads/Analytics nos anúncios e
                  na plataforma.
                </span>
              </span>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-1 size-4 accent-primary"
                aria-label="Cookies de marketing"
              />
            </label>
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpanded(false)}
              >
                Voltar
              </Button>
              <Button type="button" size="sm" onClick={saveCustom}>
                Salvar preferências
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
