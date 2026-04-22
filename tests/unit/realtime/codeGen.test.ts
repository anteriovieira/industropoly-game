import { describe, it, expect } from 'vitest';
import { isValidRoomCode, normalizeRoomCode } from '@/realtime/codeGen';

describe('isValidRoomCode', () => {
  it('accepts properly formatted codes', () => {
    expect(isValidRoomCode('ABCD-1234')).toBe(true);
    expect(isValidRoomCode('XKQR-7H29')).toBe(true);
  });

  it('rejects malformed codes', () => {
    expect(isValidRoomCode('ABCD1234')).toBe(false);
    expect(isValidRoomCode('AB-CD-1234')).toBe(false);
    expect(isValidRoomCode('abcd-1234')).toBe(false);
    expect(isValidRoomCode('')).toBe(false);
    expect(isValidRoomCode('ABC-1234')).toBe(false);
  });

  it('rejects look-alike characters', () => {
    expect(isValidRoomCode('AAAA-OOOO')).toBe(false);
    expect(isValidRoomCode('IIII-1111')).toBe(false);
  });
});

describe('normalizeRoomCode', () => {
  it('uppercases and inserts a hyphen if missing', () => {
    expect(normalizeRoomCode('abcd1234')).toBe('ABCD-1234');
    expect(normalizeRoomCode('  abcd-1234  ')).toBe('ABCD-1234');
    expect(normalizeRoomCode('AbCd1234')).toBe('ABCD-1234');
  });

  it('returns null for unrecoverable input', () => {
    expect(normalizeRoomCode('abc')).toBeNull();
    expect(normalizeRoomCode('')).toBeNull();
    expect(normalizeRoomCode('ABCD-OOOO')).toBeNull();
  });
});
