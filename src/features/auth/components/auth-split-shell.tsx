import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthTestimonialPanel } from "@/features/auth/components/auth-testimonial-panel";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  topRight?: React.ReactNode;
  className?: string;
};

export function AuthSplitShell({ children, topRight, className }: Props) {
  return (
    <div
      className={cn(
        "flex min-h-svh flex-1 items-stretch bg-muted/40 p-3 sm:p-4",
        className,
      )}
    >
      <div className="mx-auto grid w-full max-w-full flex-1 overflow-hidden rounded-2xl border border-border/80 bg-background shadow-[0_30px_80px_-40px_hsl(220_40%_10%/0.55)] lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="relative flex min-h-[calc(100svh-1.5rem)] flex-col lg:min-h-0">
          <header className="flex items-center justify-between gap-3 px-5 py-5 sm:px-8">
            <Link
              href={routes.home}
              className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Elloot home"
            >
              <Image
                src="/elloot-navbar.png"
                alt="Elloot"
                width={140}
                height={32}
                priority
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex items-center gap-3">
              {topRight}
              <ThemeToggle />
            </div>
          </header>

          <div className="flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 lg:px-14">
            <div className="mx-auto w-full max-w-[400px] animate-rise">
              {children}
            </div>
          </div>

          <footer className="px-5 py-5 text-xs text-muted-foreground sm:px-8">
            © {new Date().getFullYear()} Elloot
          </footer>
        </section>

        <AuthTestimonialPanel />
      </div>
    </div>
  );
}
