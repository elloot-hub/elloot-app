/**
 * Media feature — upload e URLs de assets (listing, avatar, category).
 *
 * STATUS: ativo (client helper)
 *
 * Onde mexer: `api.ts` — upload via `/api/media`.
 * Cliente: `/sell` (LISTING), settings (AVATAR), verification (KYC) —
 * todos enviam só no Salvar/Enviar (preview local blob antes disso).
 */

export * from "./api";
