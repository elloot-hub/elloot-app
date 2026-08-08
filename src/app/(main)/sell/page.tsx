import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { SellPageContent } from "@/features/listings/components/sell-page-content";

export const metadata: Metadata = {
  title: "Criar anúncio",
};

export default function SellPage() {
  return (
    <RequireAuth>
      <SellPageContent />
    </RequireAuth>
  );
}
