/**
 * Validation utility tests
 */

import {
  isValidAddress,
  isValidSecret,
  isValidTxHash,
  isValidLedgerHash,
  isValidPublicKey,
  isValidHex,
  isValidCurrency,
  isValidAmount,
  isValidLedgerIndex,
  isValidSequence,
  isValidUrl,
  isValidWsUrl,
  isValidDomain,
  isValidQuality,
  isValidSignerWeight,
  isValidSignerQuorum,
  isValidTickSize,
  isValidTransferRate,
} from '@/utils/validation';

describe('Validation Utils', () => {
  describe('isValidAddress', () => {
    it('should return false for empty', () => {
      expect(isValidAddress('')).toBe(false);
    });

    it('should return false for non-base58 chars', () => {
      expect(isValidAddress('c0OIl')).toBe(false);
    });

    it('should return false for wrong prefix', () => {
      expect(isValidAddress('rN7n7otQDd6FczFgLdlqtyMVrn3HMfHgFj')).toBe(false);
    });

    it('should return false for too short', () => {
      expect(isValidAddress('c')).toBe(false);
    });
  });

  describe('isValidSecret', () => {
    it('should return false for empty', () => {
      expect(isValidSecret('')).toBe(false);
    });

    it('should return false for wrong prefix', () => {
      expect(isValidSecret('notasecret')).toBe(false);
    });

    it('should return false for too short', () => {
      expect(isValidSecret('s')).toBe(false);
    });
  });

  describe('isValidTxHash', () => {
    it('should validate 64-character hex', () => {
      expect(isValidTxHash('A'.repeat(64))).toBe(true);
      expect(isValidTxHash('0'.repeat(64))).toBe(true);
      expect(isValidTxHash('F'.repeat(64))).toBe(true);
    });

    it('should reject non-hex characters', () => {
      expect(isValidTxHash('G'.repeat(64))).toBe(false);
    });

    it('should reject wrong length', () => {
      expect(isValidTxHash('A'.repeat(63))).toBe(false);
      expect(isValidTxHash('A'.repeat(65))).toBe(false);
    });
  });

  describe('isValidLedgerHash', () => {
    it('should validate 64-character hex', () => {
      expect(isValidLedgerHash('A'.repeat(64))).toBe(true);
    });
  });

  describe('isValidPublicKey', () => {
    it('should validate 66-character hex (33 bytes compressed)', () => {
      expect(isValidPublicKey('0'.repeat(66))).toBe(true);
    });

    it('should reject wrong length', () => {
      expect(isValidPublicKey('0'.repeat(64))).toBe(false);
      expect(isValidPublicKey('0'.repeat(68))).toBe(false);
    });
  });

  describe('isValidHex', () => {
    it('should validate hex strings', () => {
      expect(isValidHex('AABBCC')).toBe(true);
      expect(isValidHex('001122')).toBe(true);
      expect(isValidHex('abcdef')).toBe(true);
    });

    it('should validate with specific length', () => {
      expect(isValidHex('AABB', 4)).toBe(true);
      expect(isValidHex('AABB', 6)).toBe(false);
    });

    it('should reject non-hex', () => {
      expect(isValidHex('GGHH')).toBe(false);
    });
  });

  describe('isValidCurrency', () => {
    it('should validate 3-letter codes', () => {
      expect(isValidCurrency('USD')).toBe(true);
      expect(isValidCurrency('EUR')).toBe(true);
    });

    it('should reject reserved codes', () => {
      expect(isValidCurrency('CALL')).toBe(false);
      expect(isValidCurrency('CAL')).toBe(false);
    });

    it('should validate 40-character hex', () => {
      expect(isValidCurrency('A'.repeat(40))).toBe(true);
    });
  });

  describe('isValidAmount', () => {
    it('should validate native amounts', () => {
      expect(isValidAmount('1000000')).toBe(true);
      expect(isValidAmount('0')).toBe(true);
    });

    it('should reject negative native amounts', () => {
      expect(isValidAmount('-1000000')).toBe(false);
    });

    it('should validate issued currency amounts', () => {
      expect(isValidAmount({
        currency: 'USD',
        issuer: 'c1234567890ABCDEF',
        value: '100',
      })).toBe(true);
    });

    it('should reject invalid issued amounts', () => {
      expect(isValidAmount({
        currency: 'INVALID',
        issuer: 'c1234567890ABCDEF',
        value: '100',
      })).toBe(false);
    });
  });

  describe('isValidLedgerIndex', () => {
    it('should validate numbers', () => {
      expect(isValidLedgerIndex(0)).toBe(true);
      expect(isValidLedgerIndex(1000)).toBe(true);
    });

    it('should validate special values', () => {
      expect(isValidLedgerIndex('current')).toBe(true);
      expect(isValidLedgerIndex('closed')).toBe(true);
      expect(isValidLedgerIndex('validated')).toBe(true);
    });

    it('should reject negative numbers', () => {
      expect(isValidLedgerIndex(-1)).toBe(false);
    });
  });

  describe('isValidSequence', () => {
    it('should validate positive integers', () => {
      expect(isValidSequence(0)).toBe(true);
      expect(isValidSequence(1)).toBe(true);
      expect(isValidSequence(0xFFFFFFFF)).toBe(true);
    });

    it('should reject negative', () => {
      expect(isValidSequence(-1)).toBe(false);
    });

    it('should reject too large', () => {
      expect(isValidSequence(0xFFFFFFFF + 1)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate URLs', () => {
      expect(isValidUrl('http://localhost:5005')).toBe(true);
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('isValidWsUrl', () => {
    it('should validate WebSocket URLs', () => {
      expect(isValidWsUrl('ws://localhost:6005')).toBe(true);
      expect(isValidWsUrl('wss://example.com')).toBe(true);
    });

    it('should reject HTTP URLs', () => {
      expect(isValidWsUrl('http://localhost:5005')).toBe(false);
    });
  });

  describe('isValidDomain', () => {
    it('should validate domains', () => {
      expect(isValidDomain('example.com')).toBe(true);
      expect(isValidDomain('sub.example.com')).toBe(true);
    });

    it('should reject empty', () => {
      expect(isValidDomain('')).toBe(false);
    });

    it('should reject too long', () => {
      expect(isValidDomain('a'.repeat(257))).toBe(false);
    });
  });

  describe('isValidQuality', () => {
    it('should validate valid quality', () => {
      expect(isValidQuality(0)).toBe(true);
      expect(isValidQuality(1000000000)).toBe(true);
    });

    it('should reject negative', () => {
      expect(isValidQuality(-1)).toBe(false);
    });
  });

  describe('isValidSignerWeight', () => {
    it('should validate valid weight', () => {
      expect(isValidSignerWeight(1)).toBe(true);
      expect(isValidSignerWeight(65535)).toBe(true);
    });

    it('should reject 0', () => {
      expect(isValidSignerWeight(0)).toBe(false);
    });

    it('should reject too large', () => {
      expect(isValidSignerWeight(65536)).toBe(false);
    });
  });

  describe('isValidSignerQuorum', () => {
    it('should validate valid quorum', () => {
      expect(isValidSignerQuorum(0)).toBe(true);
      expect(isValidSignerQuorum(65535)).toBe(true);
    });
  });

  describe('isValidTickSize', () => {
    it('should validate valid tick size', () => {
      expect(isValidTickSize(3)).toBe(true);
      expect(isValidTickSize(10)).toBe(true);
      expect(isValidTickSize(15)).toBe(true);
    });

    it('should reject too small', () => {
      expect(isValidTickSize(2)).toBe(false);
    });

    it('should reject too large', () => {
      expect(isValidTickSize(16)).toBe(false);
    });
  });

  describe('isValidTransferRate', () => {
    it('should allow 0', () => {
      expect(isValidTransferRate(0)).toBe(true);
    });

    it('should validate valid rate', () => {
      expect(isValidTransferRate(1000000000)).toBe(true);
      expect(isValidTransferRate(1000000001)).toBe(true);
      expect(isValidTransferRate(2000000000)).toBe(true);
    });

    it('should reject invalid rates', () => {
      expect(isValidTransferRate(999999999)).toBe(false);
      expect(isValidTransferRate(2000000001)).toBe(false);
    });
  });
});
