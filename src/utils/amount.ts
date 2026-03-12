/**
 * Amount utility functions
 */

import BigNumber from 'bignumber.js';
import type { Amount, Currency, IssuedCurrencyAmount } from '@/types';

// Constants
export const CALL_DROPS_PER_CALL = 1000000;
export const MAX_DROPS = new BigNumber('1e17'); // Maximum amount in drops

/**
 * Check if amount is native CALL (string format)
 */
export function isNativeAmount(amount: Amount): amount is string {
  return typeof amount === 'string';
}

/**
 * Check if amount is issued currency
 */
export function isIssuedCurrency(amount: Amount): amount is IssuedCurrencyAmount {
  return typeof amount === 'object' && amount !== null && 'currency' in amount;
}

/**
 * Convert CALL to drops
 * @param call - Amount in CALL
 * @returns Amount in drops as string
 */
export function callToDrops(call: string | number): string {
  const bn = new BigNumber(call);
  if (bn.isNegative()) {
    throw new Error('Amount cannot be negative');
  }
  const drops = bn.multipliedBy(CALL_DROPS_PER_CALL);
  if (drops.isGreaterThan(MAX_DROPS)) {
    throw new Error('Amount exceeds maximum');
  }
  return drops.integerValue(BigNumber.ROUND_DOWN).toString();
}

/**
 * Convert drops to CALL
 * @param drops - Amount in drops
 * @returns Amount in CALL as string
 */
export function dropsToCall(drops: string | number): string {
  const bn = new BigNumber(drops);
  if (bn.isNegative()) {
    throw new Error('Amount cannot be negative');
  }
  return bn.dividedBy(CALL_DROPS_PER_CALL).toString();
}

/**
 * Create native CALL amount
 * @param call - Amount in CALL
 * @returns Amount string in drops
 */
export function nativeAmount(call: string | number): string {
  return callToDrops(call);
}

/**
 * Create issued currency amount
 * @param value - Amount value
 * @param currency - Currency code
 * @param issuer - Issuer account ID
 * @returns IssuedCurrencyAmount object
 */
export function issuedCurrencyAmount(
  value: string | number,
  currency: Currency,
  issuer: string
): IssuedCurrencyAmount {
  // Validate currency
  if (!isValidCurrency(currency)) {
    throw new Error(`Invalid currency code: ${currency}`);
  }

  return {
    value: value.toString(),
    currency: currency.toUpperCase(),
    issuer,
  };
}

/**
 * Parse amount to human-readable format
 * @param amount - Amount (native or issued)
 * @returns Human-readable string
 */
export function parseAmount(amount: Amount): string {
  if (isNativeAmount(amount)) {
    return `${dropsToCall(amount)} CALL`;
  }
  return `${amount.value} ${amount.currency}.${amount.issuer}`;
}

/**
 * Compare two amounts
 * @param a - First amount
 * @param b - Second amount
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareAmounts(a: Amount, b: Amount): number {
  // Cannot compare different types
  if (isNativeAmount(a) !== isNativeAmount(b)) {
    throw new Error('Cannot compare native and issued amounts');
  }

  if (isNativeAmount(a) && isNativeAmount(b)) {
    const aBn = new BigNumber(a);
    const bBn = new BigNumber(b);
    return aBn.comparedTo(bBn);
  }

  if (isIssuedCurrency(a) && isIssuedCurrency(b)) {
    // Only compare if same currency and issuer
    if (a.currency !== b.currency || a.issuer !== b.issuer) {
      throw new Error('Cannot compare amounts with different currency/issuer');
    }
    const aBn = new BigNumber(a.value);
    const bBn = new BigNumber(b.value);
    return aBn.comparedTo(bBn);
  }

  throw new Error('Invalid amounts');
}

/**
 * Add two amounts
 * @param a - First amount
 * @param b - Second amount
 * @returns Sum of amounts
 */
export function addAmounts(a: Amount, b: Amount): Amount {
  if (isNativeAmount(a) && isNativeAmount(b)) {
    return new BigNumber(a).plus(b).toString();
  }

  if (isIssuedCurrency(a) && isIssuedCurrency(b)) {
    if (a.currency !== b.currency || a.issuer !== b.issuer) {
      throw new Error('Cannot add amounts with different currency/issuer');
    }
    return {
      value: new BigNumber(a.value).plus(b.value).toString(),
      currency: a.currency,
      issuer: a.issuer,
    };
  }

  throw new Error('Cannot add native and issued amounts');
}

/**
 * Subtract two amounts
 * @param a - First amount
 * @param b - Second amount
 * @returns Difference of amounts
 */
export function subtractAmounts(a: Amount, b: Amount): Amount {
  if (isNativeAmount(a) && isNativeAmount(b)) {
    return new BigNumber(a).minus(b).toString();
  }

  if (isIssuedCurrency(a) && isIssuedCurrency(b)) {
    if (a.currency !== b.currency || a.issuer !== b.issuer) {
      throw new Error('Cannot subtract amounts with different currency/issuer');
    }
    return {
      value: new BigNumber(a.value).minus(b.value).toString(),
      currency: a.currency,
      issuer: a.issuer,
    };
  }

  throw new Error('Cannot subtract native and issued amounts');
}

/**
 * Validate currency code
 * @param currency - Currency code to validate
 * @returns True if valid
 */
export function isValidCurrency(currency: string): boolean {
  // Standard 3-letter currency code
  if (/^[A-Z]{3}$/.test(currency)) {
    return currency !== 'CALL' && currency !== 'CAL'; // Reserved
  }
  // 40-character hex
  if (/^[0-9A-Fa-f]{40}$/.test(currency)) {
    return true;
  }
  return false;
}

/**
 * Normalize currency code
 * @param currency - Currency code
 * @returns Normalized currency code
 */
export function normalizeCurrency(currency: string): string {
  if (/^[A-Z]{3}$/.test(currency)) {
    return currency.toUpperCase();
  }
  return currency.toUpperCase();
}

/**
 * Get currency as hex
 * @param currency - Currency code
 * @returns 40-character hex string
 */
export function currencyToHex(currency: string): string {
  if (/^[0-9A-Fa-f]{40}$/.test(currency)) {
    return currency.toUpperCase();
  }

  // Convert 3-letter code to hex
  const bytes = new Uint8Array(20);
  const code = currency.toUpperCase();
  for (let i = 0; i < 3; i++) {
    bytes[12 + i] = code.charCodeAt(i);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Parse hex currency to readable string
 * @param hex - 40-character hex string
 * @returns Currency code or null if not standard
 */
export function hexToCurrency(hex: string): string | null {
  if (hex.length !== 40) return null;

  // Check if it's a standard 3-letter code
  const bytes = hex.match(/.{2}/g)?.map((b) => parseInt(b, 16));
  if (!bytes) return null;

  // Check if first 12 and last 5 bytes are zeros (standard currency format)
  const isStandard = bytes.slice(0, 12).every((b) => b === 0) &&
    bytes.slice(15).every((b) => b === 0);

  if (isStandard) {
    const code = String.fromCharCode(...bytes.slice(12, 15));
    if (/^[A-Z]{3}$/.test(code)) {
      return code;
    }
  }

  return hex.toUpperCase();
}

/**
 * Calculate percentage of amount
 * @param amount - Base amount
 * @param percent - Percentage (0-100)
 * @returns Calculated amount
 */
export function percentAmount(amount: Amount, percent: number): Amount {
  if (percent < 0 || percent > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }

  if (isNativeAmount(amount)) {
    return new BigNumber(amount)
      .multipliedBy(percent)
      .dividedBy(100)
      .integerValue(BigNumber.ROUND_DOWN)
      .toString();
  }

  return {
    value: new BigNumber(amount.value)
      .multipliedBy(percent)
      .dividedBy(100)
      .toString(),
    currency: amount.currency,
    issuer: amount.issuer,
  };
}
