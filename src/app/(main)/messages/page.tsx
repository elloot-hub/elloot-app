import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/** Legacy path — messages live under the dashboard hub. */
export default function MessagesRedirectPage() {
  redirect(routes.dashboardMessages);
}
