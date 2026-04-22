const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
const RAW_RE = /^[A-HJ-NP-Z0-9]{8}$/;
const FORMATTED_RE = /^[A-HJ-NP-Z0-9]{4}-[A-HJ-NP-Z0-9]{4}$/;

export function isValidRoomCode(code: string): boolean {
  if (!FORMATTED_RE.test(code)) return false;
  const stripped = code.replace('-', '');
  for (const ch of stripped) if (!ALPHABET.includes(ch)) return false;
  return true;
}

export function normalizeRoomCode(input: string): string | null {
  const cleaned = input.trim().toUpperCase().replace('-', '');
  if (!RAW_RE.test(cleaned)) return null;
  for (const ch of cleaned) if (!ALPHABET.includes(ch)) return null;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}
