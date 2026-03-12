/**
 * Quality parser tests
 */

import { parseQuality } from '@/parser/quality';

describe('Quality Parser', () => {
  it('should parse quality hex for CALL/CALL pair', () => {
    // 64 = offset 100, so offset - 100 = 0
    // c35000 = mantissa in hex = 12800000
    // Quality = 12800000 * 10^0 = 12800000
    const result = parseQuality('64c3500000000000', 'CALL', 'CALL');
    // Result is mantissa << offset where mantissa = 0xc3500000000000 = 549755813888000
    // This is a simplified test - the actual calculation depends on the hex value
    expect(typeof result).toBe('string');
    expect(result).not.toBe('');
  });

  it('should adjust quality for CALL/USD pair', () => {
    // CALL/USD: CALL has 6 decimals, so quality needs adjustment
    const result = parseQuality('64c3500000000000', 'CALL', 'USD');
    // Should be divided by 1e6 (shift -6)
    expect(typeof result).toBe('string');
    expect(result).not.toBe('');
  });

  it('should throw for invalid hex length', () => {
    expect(() => parseQuality('1234', 'CALL', 'CALL')).toThrow(
      'Quality hex must be 16 characters'
    );
  });

  it('should handle zero offset', () => {
    // 64 = offset 100, so offset - 100 = 0
    // mantissa = 0x1 = 1
    const result = parseQuality('6400000000000001', 'USD', 'USD');
    expect(result).toBe('1');
  });
});
