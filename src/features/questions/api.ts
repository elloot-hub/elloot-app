import { api } from "@/lib/api/client";

export type ListingQuestion = {
  id: string;
  listingId: string;
  askerId: string;
  body: string;
  answer: string | null;
  answeredAt: string | null;
  answeredById: string | null;
  moderated: boolean;
  createdAt: string;
  asker: { id: string; name: string | null; avatarUrl?: string | null };
  answeredBy?: {
    id: string;
    name: string | null;
    avatarUrl?: string | null;
  } | null;
  listing?: {
    id: string;
    title: string;
    sellerId: string;
    media?: Array<{ url: string }>;
  };
};

export async function fetchListingQuestions(
  listingId: string,
  opts?: { cursor?: string; limit?: number },
) {
  const params = new URLSearchParams();
  if (opts?.cursor) params.set("cursor", opts.cursor);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return api.get<{
    questions: ListingQuestion[];
    nextCursor: string | null;
  }>(`/api/questions/by-listing/${listingId}${qs ? `?${qs}` : ""}`, {
    auth: false,
  });
}

export async function askListingQuestion(listingId: string, body: string) {
  return api.post<{ question: ListingQuestion }>(
    `/api/questions/by-listing/${listingId}`,
    { body },
  );
}

export async function answerListingQuestion(id: string, answer: string) {
  return api.post<{ question: ListingQuestion }>(
    `/api/questions/${id}/answer`,
    { answer },
  );
}

export async function fetchMyQuestions() {
  return api.get<{ questions: ListingQuestion[] }>("/api/questions/mine");
}

export async function fetchReceivedQuestions(opts?: { unanswered?: boolean }) {
  const qs = opts?.unanswered ? "?unanswered=1" : "";
  return api.get<{ questions: ListingQuestion[] }>(
    `/api/questions/received${qs}`,
  );
}
