import { RequireAuth } from "@/features/auth/components/require-auth";
import { MessagesInboxClient } from "@/features/conversations/components/messages-inbox-client";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

export default function DashboardMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <DashboardShell title="Mensagens" layout="chat">
        <MessagesInboxClient>{children}</MessagesInboxClient>
      </DashboardShell>
    </RequireAuth>
  );
}
