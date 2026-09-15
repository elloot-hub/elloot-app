import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ id: string }>;
};

/** Legacy singular path → canonical `/profile/:id`. */
export default async function VendedorRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(routes.profile(id));
}
