/**
 * Base58 encoding/decoding tests
 */

import {
  encodeBase58,
  decodeBase58,
  encodeBase58Check,
  decodeBase58Check,
} from '@/crypto/base58';

describe('Base58', () => {
  describe('encodeBase58', () => {
    it('should encode empty array to empty string', () => {
      expect(encodeBase58(new Uint8Array(0))).toBe('');
    });

    it('should encode zero bytes to 1s', () => {
      expect(encodeBase58(new Uint8Array([0, 0, 0]))).toBe('111');
    });

    it('should encode simple values correctly', () => {
      expect(encodeBase58(new Uint8Array([0]))).toBe('1');
      expect(encodeBase58(new Uint8Array([1]))).toBe('2');
      expect(encodeBase58(new Uint8Array([57]))).toBe('z');
      expect(encodeBase58(new Uint8Array([58]))).toBe('21');
    });

    it('should encode test vectors correctly', () => {
      // Test vector: "Hello World" -> "JxF12TrwUP45BMd"
      const hello = new TextEncoder().encode('Hello World');
      expect(encodeBase58(hello)).toBe('JxF12TrwUP45BMd');
    });
  });

  describe('decodeBase58', () => {
    it('should decode empty string to empty array', () => {
      expect(decodeBase58('')).toEqual(new Uint8Array(0));
    });

    it('should decode 1s to zero bytes', () => {
      expect(decodeBase58('111')).toEqual(new Uint8Array([0, 0, 0]));
    });

    it('should decode simple values correctly', () => {
      expect(decodeBase58('1')).toEqual(new Uint8Array([0]));
      expect(decodeBase58('2')).toEqual(new Uint8Array([1]));
      expect(decodeBase58('z')).toEqual(new Uint8Array([57]));
      expect(decodeBase58('21')).toEqual(new Uint8Array([58]));
    });

    it('should decode test vectors correctly', () => {
      const decoded = decodeBase58('JxF12TrwUP45BMd');
      expect(new TextDecoder().decode(decoded)).toBe('Hello World');
    });

    it('should throw on invalid characters', () => {
      expect(() => decodeBase58('0')).toThrow('Invalid base58 character');
      expect(() => decodeBase58('O')).toThrow('Invalid base58 character');
      expect(() => decodeBase58('I')).toThrow('Invalid base58 character');
      expect(() => decodeBase58('l')).toThrow('Invalid base58 character');
    });
  });

  describe('round-trip', () => {
    it('should encode and decode correctly', () => {
      const testData = [
        new Uint8Array([0]),
        new Uint8Array([1, 2, 3]),
        new Uint8Array([255, 255, 255]),
        new Uint8Array(20).fill(0xab),
        new TextEncoder().encode('The quick brown fox jumps over the lazy dog'),
      ];

      for (const data of testData) {
        const encoded = encodeBase58(data);
        const decoded = decodeBase58(encoded);
        expect(decoded).toEqual(data);
      }
    });
  });

  describe('encodeBase58Check', () => {
    it('should encode with version byte', () => {
      const data = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      const version = new Uint8Array([0x00]);
      const encoded = encodeBase58Check(data, version);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should produce valid base58check strings', () => {
      const data = new Uint8Array(20).fill(0xab);
      const version = new Uint8Array([0x00]);
      const encoded = encodeBase58Check(data, version);
      // Should start with '1' for version 0
      expect(encoded.startsWith('1')).toBe(true);
    });
  });

  describe('decodeBase58Check', () => {
    it('should decode with version byte', () => {
      const data = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      const version = new Uint8Array([0x00]);
      const encoded = encodeBase58Check(data, version);
      const decoded = decodeBase58Check(encoded);
      expect(decoded.version).toEqual(version);
      expect(decoded.payload).toEqual(data);
    });

    it('should throw on invalid checksum', () => {
      // Corrupt the encoded string
      const data = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      const version = new Uint8Array([0x00]);
      const encoded = encodeBase58Check(data, version);
      const corrupted = encoded.slice(0, -1) + '1'; // Change last char
      expect(() => decodeBase58Check(corrupted)).toThrow('Invalid checksum');
    });

    it('should throw on too short data', () => {
      expect(() => decodeBase58Check('1')).toThrow('too short');
    });
  });
});
