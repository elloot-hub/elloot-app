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
};

export function DashboardShell({
  title,
  description,
  breadcrumb,
  actions,
  children,
}: Props) {
  return (
    <Container className="py-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <div className="flex max-h-[calc(100vh-7rem)] flex-col rounded-md border border-border/60 bg-card/30 p-3">
            <DashboardNav />
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 lg:hidden">
            <DashboardMobileMenu />
            {breadcrumb && breadcrumb.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {breadcrumb.join(" › ")}
              </p>
            ) : null}
          </div>

          {breadcrumb && breadcrumb.length > 0 ? (
            <p className="hidden text-xs text-muted-foreground lg:block">
              {breadcrumb.join(" › ")}
            </p>
          ) : null}

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
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
          {children}
        </div>
      </div>
    </Container>
  );
}
