import { api } from "@/lib/api/client";
import type { KycStatus } from "@/types/api";

export type KycSubmissionDto = {
  id: string;
  fullName: string;
  documentMasked: string;
  status: KycStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  hasDocuments: boolean;
};

export type KycMineResponse = {
  kycStatus: KycStatus;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  submission: KycSubmissionDto | null;
};

export async function fetchMyKyc() {
  return api.get<KycMineResponse>("/api/kyc/mine");
}

export async function submitKyc(input: {
  fullName: string;
  documentNumber: string;
  frontAssetId: string;
  backAssetId: string;
  selfieAssetId: string;
}) {
  return api.post<{ submission: KycSubmissionDto; kycStatus: KycStatus }>(
    "/api/kyc",
    input,
  );
}
