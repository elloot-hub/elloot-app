"use client";

import { useState, type ReactNode } from "react";
import { Settings2Icon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NotificationPreferencesPanel } from "@/features/notifications/components/notification-preferences-panel";
import { cn } from "@/lib/utils";

type DialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

/** Controlled or uncontrolled dialog with the preferences form. */
export function NotificationPreferencesDialog({
  open,
  onOpenChange,
  children,
}: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const resolvedOpen = isControlled ? open : internalOpen;

  function handleOpenChange(next: boolean) {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  return (
    <Dialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      {children}
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Preferências de notificação</DialogTitle>
          <DialogDescription>
            Escolha o que recebe no app e no navegador. Pedidos e disputas
            permanecem ativos no app.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <NotificationPreferencesPanel active={resolvedOpen} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

type ButtonProps = {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "xs" | "lg" | "icon" | "icon-sm" | "icon-xs";
  label?: string;
  /** Compact icon-only trigger (e.g. popover header). */
  iconOnly?: boolean;
};

/** Ready-to-use trigger + dialog for pages and the navbar inbox. */
export function NotificationPreferencesDialogButton({
  className,
  variant = "outline",
  size = "sm",
  label = "Configurar",
  iconOnly = false,
}: ButtonProps) {
  return (
    <NotificationPreferencesDialog>
      <DialogTrigger
        className={cn(
          buttonVariants({
            variant,
            size: iconOnly ? "icon-sm" : size,
          }),
          !iconOnly && "gap-1.5",
          className,
        )}
        aria-label={iconOnly ? "Configurar notificações" : undefined}
        title={iconOnly ? "Configurar notificações" : undefined}
      >
        <Settings2Icon className="size-3.5" />
        {iconOnly ? null : label}
      </DialogTrigger>
    </NotificationPreferencesDialog>
  );
}
