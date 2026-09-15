import type { Metadata } from "next";
import { MessagesEmptyPane } from "@/features/conversations/components/messages-inbox-client";

export const metadata: Metadata = {
  title: "Mensagens",
};

export default function DashboardMessagesPage() {
  return <MessagesEmptyPane />;
}
