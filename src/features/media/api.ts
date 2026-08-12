import { api } from "@/lib/api/client";
import { config } from "@/lib/config";
import { ApiError, isApiErrorBody } from "@/lib/api/errors";
import type { MediaAsset } from "@/types/api";

export type UploadMediaInput = {
  file: File;
  purpose?: MediaAsset["purpose"];
  visibility?: MediaAsset["visibility"];
};

export async function uploadMedia(input: UploadMediaInput) {
  const form = new FormData();
  form.append("file", input.file);
  if (input.purpose) form.append("purpose", input.purpose);
  if (input.visibility) form.append("visibility", input.visibility);

  const res = await fetch(`${config.apiUrl}/api/media/upload`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
    body: form,
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    if (isApiErrorBody(data)) {
      throw new ApiError(res.status, data.error.code, data.error.message);
    }
    throw new ApiError(res.status, "REQUEST_FAILED", "Falha no upload");
  }

  return data as { asset: MediaAsset };
}

export async function listMyMedia() {
  return api.get<{ assets: MediaAsset[] }>("/api/media/mine");
}

export async function deleteMedia(id: string) {
  return api.delete<{ ok: true }>(`/api/media/${id}`);
}
