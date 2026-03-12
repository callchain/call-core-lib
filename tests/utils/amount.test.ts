/**
 * Amount utility tests
 */

import {
  callToDrops,
  dropsToCall,
  isNativeAmount,
  isIssuedCurrency,
  nativeAmount,
  issuedCurrencyAmount,
  addAmounts,
  subtractAmounts,
  compareAmounts,
  parseAmount,
  isValidCurrency,
  normalizeCurrency,
  currencyToHex,
  hexToCurrency,
  percentAmount,
} from '@/utils/amount';

describe('Amount Utils', () => {
  describe('callToDrops', () => {
    it('should convert CALL to drops', () => {
      expect(callToDrops('1')).toBe('1000000');
      expect(callToDrops('0.5')).toBe('500000');
      expect(callToDrops('100')).toBe('100000000');
    });

    it('should handle number input', () => {
      expect(callToDrops(1)).toBe('1000000');
      expect(callToDrops(0.5)).toBe('500000');
    });

    it('should throw on negative amount', () => {
      expect(() => callToDrops('-1')).toThrow('Amount cannot be negative');
    });
  });

  describe('dropsToCall', () => {
    it('should convert drops to CALL', () => {
      expect(dropsToCall('1000000')).toBe('1');
      expect(dropsToCall('500000')).toBe('0.5');
      expect(dropsToCall('100000000')).toBe('100');
    });

    it('should handle number input', () => {
      expect(dropsToCall(1000000)).toBe('1');
    });

    it('should throw on negative amount', () => {
      expect(() => dropsToCall('-1000000')).toThrow('Amount cannot be negative');
    });
  });

  describe('isNativeAmount', () => {
    it('should return true for string amounts', () => {
      expect(isNativeAmount('1000000')).toBe(true);
    });

    it('should return false for issued currency', () => {
      expect(isNativeAmount({
        currency: 'USD',
        issuer: 'c1234567890ABCDEF',
        value: '100',
      })).toBe(false);
    });
  });

  describe('isIssuedCurrency', () => {
    it('should return true for issued currency objects', () => {
      expect(isIssuedCurrency({
        currency: 'USD',
        issuer: 'c1234567890ABCDEF',
        value: '100',
      })).toBe(true);
    });

    it('should return false for native amounts', () => {
      expect(isIssuedCurrency('1000000')).toBe(false);
    });
  });

  describe('nativeAmount', () => {
    it('should create native amount', () => {
      expect(nativeAmount('1')).toBe('1000000');
      expect(nativeAmount('0.5')).toBe('500000');
    });
  });

  describe('issuedCurrencyAmount', () => {
    it('should create issued currency amount', () => {
      const amount = issuedCurrencyAmount('100', 'USD', 'c1234567890ABCDEF');
      expect(amount).toEqual({
        value: '100',
        currency: 'USD',
        issuer: 'c1234567890ABCDEF',
      });
    });

    it('should normalize currency code', () => {
      const amount = issuedCurrencyAmount('100', 'usd', 'c1234567890ABCDEF');
      expect(amount.currency).toBe('USD');
    });

    it('should throw on invalid currency', () => {
      expect(() => issuedCurrencyAmount('100', 'CALL', 'c1234567890ABCDEF'))
        .toThrow('Invalid currency code');
    });
  });

  describe('parseAmount', () => {
    it('should parse native amount', () => {
      expect(parseAmount('1000000')).toBe('1 CALL');
    });

    it('should parse issued currency', () => {
      const amount = issuedCurrencyAmount('100', 'USD', 'c1234567890ABCDEF');
      expect(parseAmount(amount)).toBe('100 USD.c1234567890ABCDEF');
    });
  });

  describe('addAmounts', () => {
    it('should add native amounts', () => {
      expect(addAmounts('1000000', '2000000')).toBe('3000000');
    });

    it('should add issued currency amounts', () => {
      const a = issuedCurrencyAmount('100', 'USD', 'c1234567890ABCDEF');
      const b = issuedCurrencyAmount('50', 'USD', 'c1234567890ABCDEF');
      expect(addAmounts(a, b)).toEqual({
        value: '150',
        currency: 'USD',
        issuer: 'c1234567890ABCDEF',
      });
    });

    it('should throw when adding different currencies', () => {
      const a = issuedCurrencyAmount('100', 'USD', 'c1234567890ABCDEF');
      const b = issuedCurrencyAmount('50', 'EUR', 'c1234567890ABCDEF');
      expect(() => addAmounts(a, b)).toThrow();
    });

    it('should throw when adding native and issued', () => {
      const a = '1000000';
      const b = issuedCurrencyAmount('50', 'USD', 'c1234567890ABCDEF');
      expect(() => addAmounts(a, b)).toThrow();
    });
  });

  describe('subtractAmounts', () => {
    it('should subtract native amounts', () => {
      expect(subtractAmounts('3000000', '1000000')).toBe('2000000');
    });

    it('should subtract issued currency amounts', () => {
      const a = issuedCurrencyAmount('100', 'USD', 'c1234567890ABCDEF');
      const b = issuedCurrencyAmount('30', 'USD', 'c1234567890ABCDEF');
      expect(subtractAmounts(a, b)).toEqual({
        value: '70',
        currency: 'USD',
        issuer: 'c1234567890ABCDEF',
      });
    });
  });

  describe('compareAmounts', () => {
    it('should compare native amounts', () => {
      expect(compareAmounts('1000000', '2000000')).toBe(-1);
      expect(compareAmounts('2000000', '1000000')).toBe(1);
      expect(compareAmounts('1000000', '1000000')).toBe(0);
    });

    it('should compare issued currency amounts', () => {
      const a = issuedCurrencyAmount('100', 'USD', 'c1234567890ABCDEF');
      const b = issuedCurrencyAmount('200', 'USD', 'c1234567890ABCDEF');
      expect(compareAmounts(a, b)).toBe(-1);
    });
  });

  describe('isValidCurrency', () => {
    it('should validate 3-letter currency codes', () => {
      expect(isValidCurrency('USD')).toBe(true);
      expect(isValidCurrency('EUR')).toBe(true);
      expect(isValidCurrency('BTC')).toBe(true);
    });

    it('should reject reserved codes', () => {
      expect(isValidCurrency('CALL')).toBe(false);
      expect(isValidCurrency('CAL')).toBe(false);
    });

    it('should validate 40-character hex codes', () => {
      expect(isValidCurrency('A'.repeat(40))).toBe(true);
      expect(isValidCurrency('0123456789ABCDEF'.repeat(2) + '012345678')).toBe(true);
    });

    it('should reject invalid codes', () => {
      expect(isValidCurrency('US')).toBe(false);
      expect(isValidCurrency('USDC')).toBe(false);
      expect(isValidCurrency('')).toBe(false);
    });
  });

  describe('normalizeCurrency', () => {
    it('should uppercase 3-letter codes', () => {
      expect(normalizeCurrency('usd')).toBe('USD');
    });

    it('should uppercase hex codes', () => {
      expect(normalizeCurrency('a'.repeat(40))).toBe('A'.repeat(40));
    });
  });

  describe('currencyToHex', () => {
    it('should convert 3-letter code to hex', () => {
      const hex = currencyToHex('USD');
      expect(hex.length).toBe(40);
      expect(hex.startsWith('0000000000000000000000000000000000000000')).toBe(true);
    });

    it('should pass through 40-character hex', () => {
      const hex = 'A'.repeat(40);
      expect(currencyToHex(hex)).toBe(hex);
    });
  });

  describe('hexToCurrency', () => {
    it('should convert standard hex to 3-letter code', () => {
      const hex = currencyToHex('USD');
      expect(hexToCurrency(hex)).toBe('USD');
    });

    it('should return null for non-standard hex', () => {
      expect(hexToCurrency('A'.repeat(40))).toBeNull();
    });

    it('should return null for invalid length', () => {
      expect(hexToCurrency('A'.repeat(20))).toBeNull();
    });
  });

  describe('percentAmount', () => {
    it('should calculate percentage of native amount', () => {
      expect(percentAmount('1000000', 50)).toBe('500000');
    });

    it('should calculate percentage of issued amount', () => {
      const amount = issuedCurrencyAmount('100', 'USD', 'c1234567890ABCDEF');
      const result = percentAmount(amount, 25) as { value: string; currency: string; issuer: string };
      expect(result.value).toBe('25');
    });

    it('should throw on invalid percentage', () => {
      expect(() => percentAmount('1000000', -1)).toThrow();
      expect(() => percentAmount('1000000', 101)).toThrow();
    });
  });
});
