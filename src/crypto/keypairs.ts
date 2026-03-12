/**
 * Key pair generation and signing using elliptic library
 * Supports secp256k1 and ed25519
 */

import { ec as EC } from 'elliptic';
import { hmacSha512, sha256, hash160 } from '@/crypto/hash';
import { encodeBase58Check, decodeBase58Check } from '@/crypto/base58';

// secp256k1 curve
const secp256k1 = new EC('secp256k1');

// Version bytes for different key types
const VERSION_BYTES = {
  ED25519_SEED: new Uint8Array([0x01, 0xe1, 0x4b]),
  SEED: new Uint8Array([0x21]), // 0x21 is the standard seed version byte
  ACCOUNT_ID: new Uint8Array([0x57]), // 0x57 produces 'c' prefix for addresses
  NODE_PUBLIC: new Uint8Array([0x1c]),
  ACCOUNT_PUBLIC: new Uint8Array([0x23]),
};

/**
 * Generate a random seed
 * @returns 16-byte random seed
 */
export function generateSeed(): Uint8Array {
  const seed = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(seed);
  } else {
    const crypto = require('crypto');
    crypto.randomFillSync(seed);
  }
  return seed;
}

/**
 * Encode seed to family seed string
 * @param seed - 16-byte seed
 * @returns Family seed string (base58check encoded)
 */
export function encodeSeed(seed: Uint8Array): string {
  return encodeBase58Check(seed, VERSION_BYTES.SEED);
}

/**
 * Decode family seed string to seed bytes
 * @param seed - Family seed string
 * @returns Seed bytes
 */
export function decodeSeed(seed: string): Uint8Array {
  const result = decodeBase58Check(seed);
  if (result.version[0] !== VERSION_BYTES.SEED[0]) {
    throw new Error('Invalid seed version');
  }
  return result.payload;
}

/**
 * Derive keypair from seed
 * @param seed - Seed bytes or family seed string
 * @param options - Options including key type
 * @returns Keypair with public and private keys
 */
export function deriveKeypair(
  seed: string | Uint8Array,
  options: { keyType?: 'secp256k1' | 'ed25519' } = {}
): {
  publicKey: string;
  privateKey: string;
} {
  const seedBytes = typeof seed === 'string' ? decodeSeed(seed) : seed;
  const keyType = options.keyType || 'secp256k1';

  if (keyType === 'ed25519') {
    throw new Error('ed25519 not yet implemented');
  }

  // secp256k1 key derivation
  const root = derivePrivateKey(seedBytes, 0);
  const keyPair = secp256k1.keyFromPrivate(root);
  const publicKey = keyPair.getPublic(true, 'hex'); // Compressed

  return {
    publicKey: publicKey.toUpperCase(),
    privateKey: bytesToHex(root).toUpperCase(),
  };
}

/**
 * Derive private key from seed using BIP32-like derivation
 * @param seed - Seed bytes
 * @param account - Account index
 * @returns Private key
 */
function derivePrivateKey(seed: Uint8Array, _account: number): Uint8Array {
  // Use HMAC-SHA-512 with key "Call seed"
  const hmac = hmacSha512(seed, new TextEncoder().encode('Call seed'));

  // First 32 bytes are the private key
  const privateKey = hmac.slice(0, 32);

  // Ensure private key is valid (non-zero and less than curve order)
  const keyBN = BigInt('0x' + Buffer.from(privateKey).toString('hex'));
  if (keyBN === BigInt(0) || keyBN >= BigInt(secp256k1.curve.n.toString())) {
    throw new Error('Invalid private key generated');
  }

  return privateKey;
}

/**
 * Generate address from public key
 * @param publicKey - Compressed public key (hex string)
 * @returns Address starting with 'c'
 */
export function deriveAddress(publicKey: string): string {
  const publicKeyBytes = hexToBytes(publicKey);
  const hash = hash160(publicKeyBytes);
  return encodeBase58Check(hash, VERSION_BYTES.ACCOUNT_ID);
}

/**
 * Sign message with private key
 * @param message - Message to sign (hex string or Uint8Array)
 * @param privateKey - Private key (hex string)
 * @returns Signature (hex string)
 */
export function sign(message: string | Uint8Array, privateKey: string): string {
  const messageBytes = typeof message === 'string' ? hexToBytes(message) : message;
  const privateKeyBytes = hexToBytes(privateKey);

  const keyPair = secp256k1.keyFromPrivate(privateKeyBytes);
  const messageHash = sha256(messageBytes);

  const signature = keyPair.sign(messageHash);

  // Return DER-encoded signature
  return signature.toDER('hex').toUpperCase();
}

/**
 * Verify signature
 * @param message - Original message (hex string or Uint8Array)
 * @param signature - Signature (hex string)
 * @param publicKey - Public key (hex string)
 * @returns True if valid
 */
export function verify(
  message: string | Uint8Array,
  signature: string,
  publicKey: string
): boolean {
  const messageBytes = typeof message === 'string' ? hexToBytes(message) : message;
  const signatureBytes = hexToBytes(signature);
  const publicKeyBytes = hexToBytes(publicKey);

  const keyPair = secp256k1.keyFromPublic(publicKeyBytes);
  const messageHash = sha256(messageBytes);

  return keyPair.verify(messageHash, signatureBytes);
}

/**
 * Generate a new wallet (seed + keypair + address)
 * @param options - Options including key type
 * @returns Wallet info
 */
export function generateWallet(options: { keyType?: 'secp256k1' | 'ed25519' } = {}): {
  seed: string;
  publicKey: string;
  privateKey: string;
  address: string;
} {
  const seedBytes = generateSeed();
  const seed = encodeSeed(seedBytes);
  const keypair = deriveKeypair(seedBytes, options);
  const address = deriveAddress(keypair.publicKey);

  return {
    seed,
    ...keypair,
    address,
  };
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate address
 * @param address - Address to validate
 * @returns True if valid
 */
export function isValidAddress(address: string): boolean {
  if (!address.startsWith('c')) return false;
  try {
    const result = decodeBase58Check(address);
    return result.version[0] === VERSION_BYTES.ACCOUNT_ID[0];
  } catch {
    return false;
  }
}

/**
 * Validate secret (seed)
 * @param secret - Secret to validate
 * @returns True if valid
 */
export function isValidSecret(secret: string): boolean {
  try {
    const result = decodeBase58Check(secret);
    return result.version[0] === VERSION_BYTES.SEED[0];
  } catch {
    return false;
  }
}
