"use client";

import { useState } from "react";
import { AlertTriangleIcon, CopyIcon, InfoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatChatDate } from "@/features/conversations/chat-timeline";
import { cn } from "@/lib/utils";

export function ChatDateSeparator({ at }: { at: string }) {
  return (
    <div className="flex justify-center py-1">
      <span className="rounded-full bg-muted/50 px-3 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
        {formatChatDate(at)}
      </span>
    </div>
  );
};

export function ChatSecurityMessage({ listingCover }: { listingCover?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-sm bg-amber-500/10 px-2 py-2.5">
      <div className="min-w-0 space-y-1 text-xs text-pretty text-center">
        <p className="font-medium text-amber-500">Mensagem do Sistema</p>
        <p className="text-muted-foreground">
          Olá! Com a Elloot, sua compra é totalmente segura — é entrega garantida ou seu dinheiro de volta. Por favor, combine a entrega exclusivamente por aqui. Não compartilhe informações pessoais fora do aplicativo.
        </p>
      </div>
    </div>
  );
};

export function ChatAutoDeliveryMessage({ content, listingTitle, }: { content: string; listingTitle: string; }) {
  const [copied, setCopied] = useState(false);

  async function copyContent() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch { }
  }

  return (
    <div className="overflow-hidden rounded-sm bg-emerald-500/10 py-2 text-center items-center justify-center">
      <div className="flex flex-col items-center justify-between gap-1.5 px-3">
        <p className="text-xs font-medium text-emerald-500">Seu produto · {listingTitle}</p>
        <p className="whitespace-pre-wrap text-sm text-foreground/90">{content}</p>
        <p className="max-w-sm text-[11px] text-muted-foreground text-pretty">
          Conteúdo enviado automaticamente. Se não funcionar, relate o problema —
          não confirme o recebimento.
        </p>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          className="mt-0.5 h-7 text-[11px]"
          onClick={() => void copyContent()}
        >
          <CopyIcon className="size-3" />
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
};

export function ChatDisputeOpenedMessage({ openedByName, reason, }: { openedByName: string; reason: string; }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-400" />
      <div className="min-w-0 space-y-1 text-xs text-pretty">
        <p className="font-medium text-amber-100">Sistema · Intervenção</p>
        <p className="text-muted-foreground">
          Uma intervenção foi aberta por{" "}
          <span className="font-medium text-foreground">{openedByName}</span>.
          Motivo: {reason}
        </p>
        <p className="text-muted-foreground/80">
          O valor permanece protegido até a mediação da equipe Elloot.
        </p>
      </div>
    </div>
  );
};

export function ChatDisputeResolvedMessage({ resolutionLabel, notes, }: { resolutionLabel: string; notes: string | null; }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-md border px-3 py-2.5",
        "border-amber-500/30 bg-amber-500/10",
      )}
    >
      <InfoIcon className="mt-0.5 size-4 shrink-0 text-amber-400" />
      <div className="min-w-0 space-y-1 text-xs text-pretty">
        <p className="font-medium text-amber-100">Sistema · Intervenção encerrada</p>
        <p className="text-muted-foreground">{resolutionLabel}</p>
        {notes?.trim() ? (
          <p className="text-muted-foreground/80">
            Nota do mediador: {notes.trim()}
          </p>
        ) : null}
      </div>
    </div>
  );
};