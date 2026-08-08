import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col pt-[4.25rem] sm:pt-[4.5rem]">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}