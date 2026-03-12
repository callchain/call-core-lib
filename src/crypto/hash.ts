/**
 * Hash functions using hash.js library
 */

import { sha256 as sha256js, sha512 as sha512js, ripemd160 as ripemd160js } from 'hash.js';

/**
 * SHA-256 hash
 * @param data - Input data
 * @returns 32-byte hash
 */
export function sha256(data: Uint8Array): Uint8Array {
  return new Uint8Array(sha256js().update(data).digest());
}

/**
 * SHA-512 hash
 * @param data - Input data
 * @returns 64-byte hash
 */
export function sha512(data: Uint8Array): Uint8Array {
  return new Uint8Array(sha512js().update(data).digest());
}

/**
 * SHA-512 half (first 32 bytes)
 * Used in Call-Core transaction signing
 */
export function sha512Half(data: Uint8Array): Uint8Array {
  return sha512(data).slice(0, 32);
}

/**
 * RIPEMD160 hash
 * @param data - Input data
 * @returns 20-byte hash
 */
export function ripemd160(data: Uint8Array): Uint8Array {
  return new Uint8Array(ripemd160js().update(data).digest());
}

/**
 * Double SHA-256 hash
 */
export function doubleSha256(data: Uint8Array): Uint8Array {
  return sha256(sha256(data));
}

/**
 * Hash160 = RIPEMD160(SHA-256(data))
 * Used in Bitcoin/Call-Core address generation
 */
export function hash160(data: Uint8Array): Uint8Array {
  return ripemd160(sha256(data));
}

/**
 * HMAC-SHA-512
 */
export function hmacSha512(key: Uint8Array, data: Uint8Array): Uint8Array {
  const blockSize = 128; // SHA-512 block size

  // Normalize key
  let normalizedKey = key;
  if (key.length > blockSize) {
    normalizedKey = sha512(key);
  }
  if (key.length < blockSize) {
    const padded = new Uint8Array(blockSize);
    padded.set(key);
    normalizedKey = padded;
  }

  // Create inner and outer pads
  const innerPad = new Uint8Array(blockSize);
  const outerPad = new Uint8Array(blockSize);

  for (let i = 0; i < blockSize; i++) {
    innerPad[i] = normalizedKey[i] ^ 0x36;
    outerPad[i] = normalizedKey[i] ^ 0x5c;
  }

  // Inner hash
  const inner = new Uint8Array(sha512js().update(innerPad).update(data).digest());

  // Outer hash
  return new Uint8Array(sha512js().update(outerPad).update(inner).digest());
}

/**
 * Concatenate multiple Uint8Arrays
 */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
