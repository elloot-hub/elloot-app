import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Container({ children, className }: Props) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-content px-4 sm:px-5 md:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
