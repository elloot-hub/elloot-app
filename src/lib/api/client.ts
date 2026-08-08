import { config } from "@/lib/config";
import { ApiError, isApiErrorBody } from "@/lib/api/errors";
import { getAccessToken } from "@/features/auth/storage";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  auth?: boolean;
  headers?: HeadersInit;
  signal?: AbortSignal;
  /** Query string object (GET). */
  query?: Record<string, string | number | undefined | null>;
};

function buildUrl(path: string, query?: ApiRequestOptions["query"]) {
  const url = new URL(
    path.startsWith("http") ? path : `${config.apiUrl}${path}`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    auth = true,
    headers,
    signal,
    query,
  } = options;

  const token =
    options.token !== undefined
      ? options.token
      : auth
        ? getAccessToken()
        : null;

  const res = await fetch(buildUrl(path, query), {
    method,
    signal,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
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
    throw new ApiError(
      res.status,
      "REQUEST_FAILED",
      `Request failed with status ${res.status}`,
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "GET" }),

  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) => apiRequest<T>(path, { ...options, method: "POST", body }),

  patch: <T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) => apiRequest<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(
    path: string,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) => apiRequest<T>(path, { ...options, method: "DELETE" }),
};
