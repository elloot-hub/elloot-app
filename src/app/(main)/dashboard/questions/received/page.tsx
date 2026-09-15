import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { ReceivedQuestionsClient } from "@/features/dashboard/components/received-questions-client";

export const metadata: Metadata = {
  title: "Perguntas recebidas",
};

export default function DashboardQuestionsReceivedPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Perguntas recebidas"
        description="Perguntas nos seus anúncios — responda para converter mais vendas."
      >
        <ReceivedQuestionsClient />
      </DashboardShell>
    </RequireAuth>
  );
}
