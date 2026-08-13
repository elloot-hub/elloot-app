import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default function CarrinhoRedirectPage() {
  redirect(routes.cart);
}
