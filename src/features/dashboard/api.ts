import { api } from "@/lib/api/client";
import type { DashboardSummary } from "@/features/dashboard/types";

export async function fetchDashboardSummary() {
  return api.get<{ summary: DashboardSummary }>("/api/dashboard/summary");
}
