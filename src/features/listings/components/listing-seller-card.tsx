"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  BadgeCheckIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  MailIcon,
  PhoneIcon,
  ShieldCheckIcon,
  StarIcon,
  XCircleIcon,
} from "lucide-react";
import type { SellerPublic } from "@/types/api";
import { usePresence } from "@/features/realtime";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  seller: SellerPublic;
  className?: string;
};

function sellerInitial(name: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

function formatMemberSince(createdAt?: string) {
  if (!createdAt) return "—";
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

export function ListingSellerCard({ seller, className }: Props) {
  const name = seller.name?.trim() || "Vendedor";
  const stats = seller.stats;
  const live = usePresence(seller.id);
  const isOnline = live.online || Boolean(seller.isOnline);
  const lastSeenAt = live.lastSeenAt ?? seller.lastSeenAt;
  const verifications = seller.verifications ?? {
    email: false,
    phone: false,
    documents: false,
  };
  const ratingAvg = stats?.ratingAvg;
  const ratingCount = stats?.ratingCount ?? 0;
  const positivePercent = stats?.positivePercent;

  return (
    <section
      className={cn(
        "space-y-3 rounded-md border border-border/60 bg-card/40 p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {seller.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={seller.avatarUrl}
              alt=""
              className="size-11 rounded-full object-cover ring-1 ring-border/60"
            />
          ) : (
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
              {sellerInitial(seller.name)}
            </span>
          )}
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-sm font-semibold">{name}</p>
              {verifications.documents ? (
                <BadgeCheckIcon className="size-3.5 shrink-0 text-sky-400" />
              ) : null}
              {(seller.reputationScore ?? 0) > 0 ? (
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  ({seller.reputationScore})
                </span>
              ) : null}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                  isOnline
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <StarIcon className="size-3 fill-amber-400 text-amber-400" />
                {ratingAvg != null ? (
                  <>
                    <span className="font-medium text-foreground tabular-nums">
                      {ratingAvg.toFixed(1)}
                    </span>
                    <span>({ratingCount})</span>
                  </>
                ) : (
                  <span>Sem avaliações</span>
                )}
              </span>
              <span>·</span>
              <span>{formatMemberSince(seller.createdAt)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {formatLastSeen(lastSeenAt, isOnline)}
              {positivePercent != null
                ? ` · ${positivePercent}% positivas`
                : null}
            </p>
          </div>
        </div>

        <Link
          href={routes.sellerProfile(seller.id)}
          className="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-full border border-border/70 px-3 text-[11px] font-medium transition-colors hover:bg-muted/40 hover:border-primary/50 hover:text-primary"
        >
          Ver perfil
          <ChevronRightIcon className="size-3.5" />
        </Link>
      </div>

      <ul className="grid grid-cols-3 gap-1.5">
        <VerifyChip
          icon={<MailIcon className="size-3" />}
          label="E-mail"
          ok={verifications.email}
        />
        <VerifyChip
          icon={<PhoneIcon className="size-3" />}
          label="Tel."
          ok={verifications.phone}
        />
        <VerifyChip
          icon={<ShieldCheckIcon className="size-3" />}
          label="Docs"
          ok={verifications.documents}
        />
      </ul>
    </section>
  );
}

function VerifyChip({
  icon,
  label,
  ok,
}: {
  icon: ReactNode;
  label: string;
  ok: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center justify-center gap-1 rounded-md border px-1.5 py-1.5 text-[10px] font-medium",
        ok
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-border/50 bg-muted/20 text-muted-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
      {ok ? (
        <CheckCircle2Icon className="size-3" />
      ) : (
        <XCircleIcon className="size-3 opacity-50" />
      )}
    </li>
  );
}
