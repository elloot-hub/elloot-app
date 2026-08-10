import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/** Legacy path — account settings live under the dashboard hub. */
export default function AccountRedirectPage() {
  redirect(routes.dashboardSettings);
}
