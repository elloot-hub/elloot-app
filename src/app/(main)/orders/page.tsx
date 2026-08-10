import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/** Legacy path — purchases live under the dashboard hub. */
export default function OrdersRedirectPage() {
  redirect(routes.dashboardPurchases);
}
