import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function VendedorAliasPage({ params }: Props) {
  const { id } = await params;
  redirect(routes.sellerProfile(id));
}
