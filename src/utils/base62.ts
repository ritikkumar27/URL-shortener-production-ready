import { randomBytes } from 'crypto';

const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHABET_LENGTH = BASE62_ALPHABET.length;

export function encodeBase62(num: number | bigint): string {
  let n = BigInt(num);
  if (n === 0n) return BASE62_ALPHABET[0];

  let result = '';
  while (n > 0n) {
    const remainder = Number(n % BigInt(ALPHABET_LENGTH));
    result = BASE62_ALPHABET[remainder] + result;
    n = n / BigInt(ALPHABET_LENGTH);
  }
  return result;
}

export function generateShortCode(length = 6): string {
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE62_ALPHABET[bytes[i] % ALPHABET_LENGTH];
  }
  return result;
}