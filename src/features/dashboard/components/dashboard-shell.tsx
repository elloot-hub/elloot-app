import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import {
  DashboardMobileMenu,
  DashboardNav,
} from "@/features/dashboard/components/dashboard-nav";

type Props = {
  title: string;
  description?: string;
  breadcrumb?: string[];
  actions?: ReactNode;
  children: ReactNode;
  layout?: "default" | "chat";
};

export function DashboardShell({
  title,
  description,
  breadcrumb,
  actions,
  children,
  layout = "default",
}: Props) {
  const isChat = layout === "chat";

  return (
    <Container className={isChat ? "py-3 sm:py-4" : "py-6 sm:py-8"}>
      <div
        className={
          isChat
            ? "grid gap-4 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:h-[calc(100dvh-var(--site-header-height)-1.75rem)] lg:items-stretch lg:gap-6"
            : "grid gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-8"
        }
      >
        <aside
          className={
            isChat
              ? "hidden lg:block lg:min-h-0"
              : "hidden lg:sticky lg:top-24 lg:block lg:self-start"
          }
        >
          <div
            className={
              isChat
                ? "flex h-full max-h-[calc(100dvh-var(--site-header-height)-1.75rem)] flex-col rounded-md border border-border/60 bg-card/30 p-3"
                : "flex max-h-[calc(100vh-7rem)] flex-col rounded-md border border-border/60 bg-card/30 p-3"
            }
          >
            <DashboardNav />
          </div>
        </aside>

        <div
          className={
            isChat
              ? "flex min-h-0 min-w-0 flex-col gap-2 h-[calc(100dvh-var(--site-header-height)-1.5rem)] lg:h-auto"
              : "min-w-0 space-y-3"
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3 lg:hidden">
            <DashboardMobileMenu />
            {breadcrumb && breadcrumb.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {breadcrumb.join(" › ")}
              </p>
            ) : null}
          </div>

          {!isChat && breadcrumb && breadcrumb.length > 0 ? (
            <p className="hidden text-xs text-muted-foreground lg:block">
              {breadcrumb.join(" › ")}
            </p>
          ) : null}

          {!isChat ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0">
                <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  {title}
                </h1>
                {description ? (
                  <p className="text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
              {actions ? (
                <div className="flex flex-wrap gap-2">{actions}</div>
              ) : null}
            </div>
          ) : (
            <h1 className="sr-only">{title}</h1>
          )}

          <div className={isChat ? "min-h-0 flex-1" : undefined}>{children}</div>
        </div>
      </div>
    </Container>
  );
}
