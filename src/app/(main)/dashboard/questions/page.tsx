import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { MyQuestionsClient } from "@/features/dashboard/components/my-questions-client";

export const metadata: Metadata = {
  title: "Minhas perguntas",
};

export default function DashboardQuestionsMinePage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Minhas perguntas"
        description="Perguntas que você fez em anúncios e as respostas dos vendedores."
      >
        <MyQuestionsClient />
      </DashboardShell>
    </RequireAuth>
  );
}
