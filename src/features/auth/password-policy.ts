/** Client-side mirror of API password rules (elloot-api/src/lib/password-policy.ts). */

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72;

export function passwordPolicyHint() {
  return `Mínimo ${PASSWORD_MIN_LENGTH} caracteres, com letras e números.`;
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`;
  }
  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) {
    return "A senha precisa ter letras e pelo menos um número.";
  }
  return null;
}
