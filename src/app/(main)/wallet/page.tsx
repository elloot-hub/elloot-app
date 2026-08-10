import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/** Legacy path — wallet lives under the dashboard hub. */
export default function WalletRedirectPage() {
  redirect(routes.dashboardWallet);
}
