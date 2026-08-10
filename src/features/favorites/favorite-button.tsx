"use client";

import { HeartIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFavorites } from "@/features/favorites/context";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  className?: string;
  size?: "sm" | "md";
};

export function FavoriteButton({ listingId, className, size = "md" }: Props) {
  const { isFavorite, toggleFavorite, ready } = useFavorites();
  const active = ready && isFavorite(listingId);

  return (
    <Tooltip>
      <TooltipTrigger
        delay={120}
        type="button"
        aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        aria-pressed={active}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(listingId);
        }}
        className={cn(
          "inline-flex items-center justify-center cursor-pointer opacity-0 rounded-full border border-white/10 bg-black/55 text-white shadow-sm backdrop-blur-sm transition-all duration-300 outline-none",
          "hover:bg-black/70 group-hover:opacity-100 hover:text-rose-300 focus-visible:ring-2 focus-visible:ring-ring/50",
          active && "border-rose-400/40 bg-rose-500/90 text-white hover:bg-rose-500 hover:text-white",
          size === "sm" ? "size-8" : "size-9",
          className,
        )}
      >
        <HeartIcon
          className={cn(size === "sm" ? "size-3.5" : "size-4", active && "fill-current")}
          strokeWidth={2.2}
        />
      </TooltipTrigger>
      <TooltipContent side="left">
        {active ? "Remover dos favoritos" : "Salvar nos favoritos"}
      </TooltipContent>
    </Tooltip>
  );
}
