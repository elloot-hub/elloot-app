"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheckIcon, ClockIcon, SettingsIcon, Share2Icon, SparklesIcon, StarIcon, StoreIcon, } from "lucide-react";
import { useAuth } from "@/features/auth/context";
import type { SellerPublic } from "@/types/api";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  seller: SellerPublic;
  totalListingsCount: number;
};

function formatMemberSince(createdAt?: string) {
  if (!createdAt) return "Membro recente";
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime()) || created.getTime() <= 0) {
    return "Membro recente";
  }
  const days = Math.max(
    0,
    Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)),
  );
  if (days < 1) return "Membro desde hoje";
  if (days === 1) return "Membro há 1 dia";
  if (days < 30) return `Membro há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1 ? "Membro há 1 mês" : `Membro há ${months} meses`;
  }
  const years = Math.floor(months / 12);
  return years === 1 ? "Membro há 1 ano" : `Membro há ${years} anos`;
};

function formatLastSeen(lastSeenAt?: string | null, isOnline?: boolean) {
  if (isOnline) return "Online agora";
  if (!lastSeenAt) return "Visto recentemente";
  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "Visto recentemente";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Visto agora há pouco";
  if (mins < 60) return `Visto há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24)
    return hours === 1 ? "Visto há 1 hora" : `Visto há ${hours} horas`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Visto há 1 dia" : `Visto há ${days} dias`;
};

function sellerInitial(name?: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
};

export function SellerHeader({ seller, totalListingsCount }: Props) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const username = seller.username?.trim() || null;
  const name = seller.name?.trim() || username || "Usuário";
  const bio = seller.bio?.trim() || `Perfil público na Elloot, com reputação, avaliações recebidas e ${totalListingsCount} anúncio${totalListingsCount === 1 ? "" : "s"} ativo${totalListingsCount === 1 ? "" : "s"}.`;
  const isOwnProfile = Boolean(user?.id && user.id === seller.id);
  const isOnline = seller.isOnline ?? false;
  const ratingAvg = seller.stats?.ratingAvg;
  const ratingCount = seller.stats?.ratingCount ?? 0;

  const verifications = seller.verifications ?? {
    email: false,
    phone: false,
    documents: false,
  };

  const handleShare = () => {
    if (typeof window === "undefined") return;
    void navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-md border border-border/60 bg-card/50 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row items-center justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="relative shrink-0">
            {seller.avatarUrl ? (
              <img
                src={seller.avatarUrl}
                alt={name}
                className="size-16 rounded-sm border border-border/60 bg-card object-cover select-none pointer-events-none sm:size-20"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-xl border border-border/60 bg-primary/15 text-2xl font-semibold text-primary sm:size-20">
                {sellerInitial(name)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-heading text-2xl font-semibold text-foreground">
                {username || name}
              </h1>

              {verifications.documents ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  <BadgeCheckIcon className="size-3.5" />
                  Verificado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Não verificado
                </span>
              )}

              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                  isOnline
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {isOnline ? "online" : "offline"}
              </span>

              {(seller.reputationScore ?? 0) > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <SparklesIcon className="size-3" />
                  {seller.reputationScore} XP
                </span>
              ) : null}
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {bio}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {/* <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
                {ratingAvg != null ? ratingAvg.toFixed(1) : "—"}
                <span className="font-normal text-muted-foreground">
                  ({ratingCount}{" "}
                  {ratingCount === 1 ? "avaliação" : "avaliações"})
                </span>
              </span> */}
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="size-3.5" />
                {formatMemberSince(seller.createdAt)}
              </span>
              <span aria-hidden>•</span>
              <span
                className={cn(
                  "font-medium",
                  isOnline
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground",
                )}
              >
                {formatLastSeen(seller.lastSeenAt, isOnline)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 gap-2 rounded-md",
            )}
          >
            <Share2Icon className="size-3.5" />
            {copied ? "Link copiado" : "Compartilhar"}
          </button>
          {isOwnProfile ? (
            <Link
              href={routes.dashboardSettings}
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-9 gap-2 rounded-md",
              )}
            >
              <SettingsIcon className="size-4" />
              Editar perfil
            </Link>
          ) : (
            <a
              href="#anuncios"
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-9 gap-2 rounded-md",
              )}
            >
              <StoreIcon className="size-4" />
              Ver anúncios
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
