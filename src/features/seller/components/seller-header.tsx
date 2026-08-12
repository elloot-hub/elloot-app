"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheckIcon,
  CheckCircle2Icon,
  ClockIcon,
  MailIcon,
  MessageSquareIcon,
  PhoneIcon,
  Share2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  XCircleIcon,
} from "lucide-react";
import type { SellerPublic } from "@/types/api";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  seller: SellerPublic;
  totalListingsCount: number;
};

function formatMemberSince(createdAt?: string) {
  if (!createdAt) return "Membro recente";
  const created = new Date(createdAt);
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
}

function formatLastSeen(lastSeenAt?: string | null, isOnline?: boolean) {
  if (isOnline) return "Online agora";
  if (!lastSeenAt) return "Visto recentemente";
  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Visto agora há pouco";
  if (mins < 60) return `Visto há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24)
    return hours === 1 ? "Visto há 1 hora" : `Visto há ${hours} horas`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Visto há 1 dia" : `Visto há ${days} dias`;
}

function sellerInitial(name?: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) return "V";
  return trimmed.charAt(0).toUpperCase();
}

export function SellerHeader({ seller, totalListingsCount }: Props) {
  const [copied, setCopied] = useState(false);
  const name = seller.name?.trim() || "Vendedor GGMAX";
  const verifications = seller.verifications || {
    email: true,
    phone: true,
    documents: true,
  };
  const isOnline = seller.isOnline ?? true;
  const ratingAvg = seller.stats?.ratingAvg ?? 4.9;
  const ratingCount = seller.stats?.ratingCount ?? 142;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-md border border-border/60 bg-card/40">
      {/* Top Banner Gradient */}
      <div className="h-32 w-full bg-gradient-to-r from-primary/30 via-violet-600/20 to-sky-500/20 sm:h-40 relative">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-95"
          >
            <Share2Icon className="size-3.5" />
            {copied ? "Link Copiado!" : "Compartilhar"}
          </button>
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="relative px-4 pb-5 pt-0 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {/* Avatar & Main Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-14 sm:-mt-16">
            <div className="relative">
              {seller.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={seller.avatarUrl}
                  alt={name}
                  className="size-24 rounded-full border-4 border-background bg-card object-cover shadow-md ring-2 ring-primary/40 sm:size-28"
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full border-4 border-background bg-primary/20 text-3xl font-black text-primary shadow-md ring-2 ring-primary/40 sm:size-28">
                  {sellerInitial(seller.name)}
                </div>
              )}
              <span
                className={cn(
                  "absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full border-2 border-background font-bold shadow-sm",
                  isOnline ? "bg-emerald-500" : "bg-muted-foreground",
                )}
                title={isOnline ? "Vendedor Online" : "Vendedor Offline"}
              >
                <span className={cn("size-2 rounded-full", isOnline ? "animate-pulse bg-white" : "bg-white/60")} />
              </span>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl truncate">
                  {name}
                </h1>
                {verifications.documents && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/30">
                    <BadgeCheckIcon className="size-3.5" />
                    Vendedor Verificado
                  </span>
                )}
                {(seller.reputationScore ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
                    <SparklesIcon className="size-3" />
                    Reputação {seller.reputationScore} XP
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
                  {ratingAvg.toFixed(1)}
                  <span className="text-muted-foreground font-normal">
                    ({ratingCount} avaliações)
                  </span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="size-3.5" />
                  {formatMemberSince(seller.createdAt)}
                </span>
                <span>•</span>
                <span className={cn("font-medium", isOnline ? "text-emerald-400" : "text-muted-foreground")}>
                  {formatLastSeen(seller.lastSeenAt, isOnline)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            <Link
              href={routes.messages}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground shadow transition-all hover:bg-primary/90 active:scale-95"
            >
              <MessageSquareIcon className="size-4" />
              Conversar com Vendedor
            </Link>
            <div className="rounded-md border border-border/60 bg-card/40 px-3 py-2 text-center">
              <span className="block text-[10px] uppercase font-semibold text-muted-foreground">Anúncios Ativos</span>
              <span className="text-sm font-bold text-foreground tabular-nums">{totalListingsCount}</span>
            </div>
          </div>
        </div>

        {/* Verifications Chips */}
        <div className="mt-5 pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Status de Verificação do Vendedor:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <VerificationChip label="E-mail" ok={verifications.email} icon={<MailIcon className="size-3" />} />
            <VerificationChip label="Telefone" ok={verifications.phone} icon={<PhoneIcon className="size-3" />} />
            <VerificationChip label="Documento Identidade" ok={verifications.documents} icon={<ShieldCheckIcon className="size-3" />} />
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationChip({ label, ok, icon }: { label: string; ok: boolean; icon: React.ReactNode }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors",
        ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-border/60 bg-muted/30 text-muted-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
      {ok ? (
        <CheckCircle2Icon className="size-3 text-emerald-400" />
      ) : (
        <XCircleIcon className="size-3 opacity-60" />
      )}
    </div>
  );
}
