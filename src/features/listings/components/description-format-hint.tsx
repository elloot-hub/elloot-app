"use client";

import { CircleHelpIcon } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function DescriptionFormatHint({ className }: Props) {
  return (
    <HoverCard>
      <HoverCardTrigger
        delay={80}
        closeDelay={120}
        render={
          <button
            type="button"
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              className,
            )}
            aria-label="Formatação da descrição"
          />
        }
      >
        <CircleHelpIcon className="size-4" />
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="end"
        className="w-72 space-y-2.5 p-3"
      >
        <p className="text-sm font-medium text-foreground">
          Formatação na descrição
        </p>
        <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
          <li>
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
              **negrito**
            </code>{" "}
            → <strong className="font-semibold text-foreground">negrito</strong>
          </li>
          <li>
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
              *itálico*
            </code>{" "}
            → <em className="italic text-foreground">itálico</em>
          </li>
          <li>
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
              ## Título
            </code>{" "}
            → título grande (no início da linha)
          </li>
        </ul>
        <p className="text-[11px] text-muted-foreground/90">
          Escreva os símbolos no texto; a formatação aparece no anúncio.
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}
