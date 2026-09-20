import { api } from "@/lib/api/client";

export type SellerPluginField = {
  key: string;
  label: string;
  type: "text" | "secret" | "url" | "email";
  value: string;
  placeholder?: string;
  hint?: string;
};

export type SellerPlugin = {
  id: string;
  key: string;
  name: string;
  description: string;
  installed: boolean;
  enabled: boolean;
  status: "ACTIVE" | "INACTIVE" | "ERROR" | "AVAILABLE";
  fields: SellerPluginField[];
};

export async function fetchListingPlugins(listingId: string) {
  const data = await api.get<{
    listingId: string;
    plugins: Array<SellerPlugin & { key: string; installed: boolean }>;
  }>(`/api/listings/${encodeURIComponent(listingId)}/plugins`);
  return {
    listingId: data.listingId,
    plugins: data.plugins.map((p) => ({
      ...p,
      key: p.key,
      id: p.key,
      installed: Boolean(p.installed),
    })),
  };
}

export async function saveListingPlugin(
  listingId: string,
  definitionKey: string,
  input: { enabled: boolean; fields: Record<string, string> },
) {
  return api.put<{ plugin: SellerPlugin }>(
    `/api/listings/${encodeURIComponent(listingId)}/plugins/${encodeURIComponent(definitionKey)}`,
    input,
  );
}

export async function removeListingPlugin(
  listingId: string,
  definitionKey: string,
) {
  return api.delete<{ ok: true }>(
    `/api/listings/${encodeURIComponent(listingId)}/plugins/${encodeURIComponent(definitionKey)}`,
  );
}
