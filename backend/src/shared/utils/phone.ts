/** Normalize user-entered phone values to E.164 for storage and contact links. */
export function normalizePhoneToE164(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  if (trimmed.startsWith('+')) {
    return `+${digits}`;
  }
  const national = digits.replace(/^0+/, '');
  const e164 = national.startsWith('91') && national.length > 10 ? national : `91${national}`;
  return `+${e164}`;
}

export function isValidProfilePhone(input: string): boolean {
  const trimmed = input.trim();
  const e164 = normalizePhoneToE164(input);
  if (!e164) return false;
  if (trimmed.startsWith('+')) {
    return /^\+\d{8,15}$/.test(e164);
  }
  return /^\+91[6-9]\d{9}$/.test(e164);
}
