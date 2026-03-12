/**
 * Base58 encoding/decoding implementation
 * Based on Bitcoin's base58 alphabet
 */

import { sha256 } from 'hash.js';

// Base58 alphabet (Bitcoin standard - no 0, O, I, l)
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP: Map<string, number> = new Map();

// Initialize alphabet map
for (let i = 0; i < ALPHABET.length; i++) {
  ALPHABET_MAP.set(ALPHABET[i], i);
}

const BASE = BigInt(58);

/**
 * Encode bytes to base58 string
 * @param bytes - Uint8Array of bytes
 * @returns Base58 encoded string
 */
export function encodeBase58(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';

  // Count leading zeros
  let leadingZeros = 0;
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    leadingZeros++;
  }

  // Convert to big integer
  let num = BigInt(0);
  for (const byte of bytes) {
    num = (num << BigInt(8)) | BigInt(byte);
  }

  // Convert to base58
  let result = '';
  while (num > BigInt(0)) {
    const remainder = Number(num % BASE);
    result = ALPHABET[remainder] + result;
    num = num / BASE;
  }

  // Add leading '1's for leading zeros
  return '1'.repeat(leadingZeros) + result;
}

/**
 * Decode base58 string to bytes
 * @param str - Base58 encoded string
 * @returns Uint8Array of bytes
 */
export function decodeBase58(str: string): Uint8Array {
  if (str.length === 0) return new Uint8Array(0);

  // Count leading '1's (represent leading zeros)
  let leadingOnes = 0;
  for (let i = 0; i < str.length && str[i] === '1'; i++) {
    leadingOnes++;
  }

  // Convert from base58
  let num = BigInt(0);
  for (const char of str) {
    const val = ALPHABET_MAP.get(char);
    if (val === undefined) {
      throw new Error(`Invalid base58 character: ${char}`);
    }
    num = num * BASE + BigInt(val);
  }

  // Convert to bytes
  const bytes: number[] = [];
  while (num > BigInt(0)) {
    bytes.unshift(Number(num & BigInt(0xff)));
    num = num >> BigInt(8);
  }

  // Add leading zeros
  const result = new Uint8Array(leadingOnes + bytes.length);
  result.set(bytes, leadingOnes);

  return result;
}

/**
 * Encode bytes to base58 with checksum (Base58Check)
 * @param bytes - Payload bytes
 * @param version - Version byte(s)
 * @returns Base58Check encoded string
 */
export function encodeBase58Check(bytes: Uint8Array, version?: Uint8Array): string {
  // Add version bytes if provided
  const payload = version ? concatBytes(version, bytes) : bytes;

  // Calculate double SHA-256 checksum
  const checksum = doubleSha256(payload).slice(0, 4);

  // Concatenate payload and checksum
  const data = concatBytes(payload, checksum);

  return encodeBase58(data);
}

/**
 * Decode base58check string
 * @param str - Base58Check encoded string
 * @param versionLength - Expected version byte length
 * @returns Decoded payload (without version and checksum)
 */
export function decodeBase58Check(
  str: string,
  versionLength = 1
): { version: Uint8Array; payload: Uint8Array } {
  const data = decodeBase58(str);

  if (data.length < versionLength + 4) {
    throw new Error('Invalid base58check data: too short');
  }

  // Split into version, payload, and checksum
  const version = data.slice(0, versionLength);
  const payload = data.slice(versionLength, data.length - 4);
  const checksum = data.slice(data.length - 4);

  // Verify checksum
  const payloadWithVersion = data.slice(0, data.length - 4);
  const computedChecksum = doubleSha256(payloadWithVersion).slice(0, 4);

  if (!bytesEqual(checksum, computedChecksum)) {
    throw new Error('Invalid checksum');
  }

  return { version, payload };
}

/**
 * Double SHA-256 hash
 */
function doubleSha256(data: Uint8Array): Uint8Array {
  const first = sha256().update(data).digest();
  return new Uint8Array(sha256().update(first).digest());
}

/**
 * Concatenate multiple Uint8Arrays
 */
function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Compare two Uint8Arrays
 */
function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
