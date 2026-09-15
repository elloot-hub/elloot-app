import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ id: string }>;
};

/** Legacy Portuguese path → canonical `/profile/:id`. */
export default async function VendedoresRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(routes.profile(id));
}
