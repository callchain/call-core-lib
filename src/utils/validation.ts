/**
 * Validation utility functions
 */

import { isValidAddress, isValidSecret } from '@/crypto/keypairs';
import type { AccountID, Amount, Currency, LedgerIndex } from '@/types';

export { isValidAddress, isValidSecret };

// Base58 alphabet for validation
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Validate transaction hash
 * @param hash - Hash to validate
 * @returns True if valid
 */
export function isValidTxHash(hash: string): boolean {
  return typeof hash === 'string' && /^[0-9A-Fa-f]{64}$/.test(hash);
}

/**
 * Validate ledger hash
 * @param hash - Hash to validate
 * @returns True if valid
 */
export function isValidLedgerHash(hash: string): boolean {
  return typeof hash === 'string' && /^[0-9A-Fa-f]{64}$/.test(hash);
}

/**
 * Validate public key
 * @param key - Public key to validate
 * @returns True if valid
 */
export function isValidPublicKey(key: string): boolean {
  return typeof key === 'string' && /^[0-9A-Fa-f]{66}$/.test(key);
}

/**
 * Validate hex string
 * @param hex - Hex string to validate
 * @param length - Expected length (optional)
 * @returns True if valid
 */
export function isValidHex(hex: string, length?: number): boolean {
  if (typeof hex !== 'string') return false;
  if (!/^[0-9A-Fa-f]*$/.test(hex)) return false;
  if (length !== undefined && hex.length !== length) return false;
  return true;
}

/**
 * Validate currency code
 * @param currency - Currency code to validate
 * @returns True if valid
 */
export function isValidCurrency(currency: string): boolean {
  if (typeof currency !== 'string') return false;

  // Standard 3-letter currency code
  if (/^[A-Z]{3}$/.test(currency)) {
    return currency !== 'CALL' && currency !== 'CAL';
  }

  // 40-character hex
  if (/^[0-9A-Fa-f]{40}$/.test(currency)) {
    return true;
  }

  return false;
}

/**
 * Validate amount
 * @param amount - Amount to validate
 * @returns True if valid
 */
export function isValidAmount(amount: Amount): boolean {
  if (typeof amount === 'string') {
    // Native amount - must be non-negative integer string
    if (!/^\d+$/.test(amount)) return false;
    const num = BigInt(amount);
    return num >= 0;
  }

  if (typeof amount === 'object' && amount !== null) {
    // Issued currency
    if (!('currency' in amount) || !('issuer' in amount) || !('value' in amount)) {
      return false;
    }

    // Validate currency
    if (!isValidCurrency(amount.currency)) return false;

    // Validate issuer
    if (!isValidAddress(amount.issuer)) return false;

    // Validate value - must be a valid number string
    const value = amount.value;
    if (typeof value !== 'string') return false;

    // Allow scientific notation and decimals
    if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value)) return false;

    return true;
  }

  return false;
}

/**
 * Validate ledger index
 * @param index - Ledger index to validate
 * @returns True if valid
 */
export function isValidLedgerIndex(index: LedgerIndex): boolean {
  if (typeof index === 'number') {
    return Number.isInteger(index) && index >= 0;
  }
  return ['current', 'closed', 'validated'].includes(index);
}

/**
 * Validate sequence number
 * @param sequence - Sequence to validate
 * @returns True if valid
 */
export function isValidSequence(sequence: number): boolean {
  return Number.isInteger(sequence) && sequence >= 0 && sequence <= 0xFFFFFFFF;
}

/**
 * Validate memo
 * @param memo - Memo to validate
 * @returns True if valid
 */
export function isValidMemo(memo: {
  memo_type?: string;
  memo_data?: string;
  memo_format?: string;
}): boolean {
  // Max memo data size is 1KB
  if (memo.memo_data && memo.memo_data.length > 2048) return false;

  // Memos must be hex strings if provided
  if (memo.memo_type && !isValidHex(memo.memo_type)) return false;
  if (memo.memo_data && !isValidHex(memo.memo_data)) return false;
  if (memo.memo_format && !isValidHex(memo.memo_format)) return false;

  return true;
}

/**
 * Validate transaction flags
 * @param flags - Flags to validate
 * @returns True if valid
 */
export function isValidFlags(flags: number): boolean {
  return Number.isInteger(flags) && flags >= 0 && flags <= 0xFFFFFFFF;
}

/**
 * Validate URL
 * @param url - URL to validate
 * @returns True if valid
 */
export function isValidUrl(url: string): boolean {
  if (typeof url !== 'string') return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate websocket URL
 * @param url - WebSocket URL to validate
 * @returns True if valid
 */
export function isValidWsUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  return url.startsWith('ws://') || url.startsWith('wss://');
}

/**
 * Validate email hash (32 bytes = 64 hex chars)
 * @param hash - Email hash to validate
 * @returns True if valid
 */
export function isValidEmailHash(hash: string): boolean {
  return isValidHex(hash, 64);
}

/**
 * Validate domain string
 * @param domain - Domain to validate
 * @returns True if valid
 */
export function isValidDomain(domain: string): boolean {
  if (typeof domain !== 'string') return false;
  if (domain.length === 0 || domain.length > 256) return false;

  // Convert to punycode if needed (basic check)
  try {
    const domainLower = domain.toLowerCase();
    // Basic domain validation
    const parts = domainLower.split('.');
    return parts.every(part => /^[a-z0-9-]+$/.test(part) && part.length > 0);
  } catch {
    return false;
  }
}

/**
 * Validate quality value
 * @param quality - Quality to validate
 * @returns True if valid
 */
export function isValidQuality(quality: number): boolean {
  return Number.isInteger(quality) && quality >= 0 && quality <= 0xFFFFFFFF;
}

/**
 * Validate signer weight
 * @param weight - Weight to validate
 * @returns True if valid
 */
export function isValidSignerWeight(weight: number): boolean {
  return Number.isInteger(weight) && weight >= 1 && weight <= 65535;
}

/**
 * Validate signer quorum
 * @param quorum - Quorum to validate
 * @returns True if valid
 */
export function isValidSignerQuorum(quorum: number): boolean {
  return Number.isInteger(quorum) && quorum >= 0 && quorum <= 65535;
}

/**
 * Validate tick size
 * @param tickSize - Tick size to validate
 * @returns True if valid
 */
export function isValidTickSize(tickSize: number): boolean {
  return Number.isInteger(tickSize) && tickSize >= 3 && tickSize <= 15;
}

/**
 * Validate transfer rate
 * @param rate - Transfer rate to validate
 * @returns True if valid
 */
export function isValidTransferRate(rate: number): boolean {
  return Number.isInteger(rate) && (rate === 0 || (rate >= 1000000000 && rate <= 2000000000));
}
