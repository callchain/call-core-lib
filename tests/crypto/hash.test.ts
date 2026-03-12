/**
 * Hash function tests
 */

import {
  sha256,
  sha512,
  sha512Half,
  ripemd160,
  doubleSha256,
  hash160,
  hmacSha512,
  concatBytes,
} from '@/crypto/hash';

describe('Hash Functions', () => {
  describe('sha256', () => {
    it('should produce correct hash for empty input', () => {
      const result = sha256(new Uint8Array(0));
      expect(result.length).toBe(32);
      expect(Buffer.from(result).toString('hex')).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      );
    });

    it('should produce correct hash for "abc"', () => {
      const data = new TextEncoder().encode('abc');
      const result = sha256(data);
      expect(Buffer.from(result).toString('hex')).toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
      );
    });

    it('should produce 32-byte output', () => {
      const data = new TextEncoder().encode('test');
      const result = sha256(data);
      expect(result.length).toBe(32);
    });
  });

  describe('sha512', () => {
    it('should produce correct hash for empty input', () => {
      const result = sha512(new Uint8Array(0));
      expect(result.length).toBe(64);
    });

    it('should produce correct hash for "abc"', () => {
      const data = new TextEncoder().encode('abc');
      const result = sha512(data);
      expect(Buffer.from(result).toString('hex')).toBe(
        'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'
      );
    });

    it('should produce 64-byte output', () => {
      const data = new TextEncoder().encode('test');
      const result = sha512(data);
      expect(result.length).toBe(64);
    });
  });

  describe('sha512Half', () => {
    it('should produce first 32 bytes of sha512', () => {
      const data = new TextEncoder().encode('test');
      const full = sha512(data);
      const half = sha512Half(data);
      expect(half).toEqual(full.slice(0, 32));
    });

    it('should produce 32-byte output', () => {
      const data = new TextEncoder().encode('test');
      const result = sha512Half(data);
      expect(result.length).toBe(32);
    });
  });

  describe('ripemd160', () => {
    it('should produce correct hash for empty input', () => {
      const result = ripemd160(new Uint8Array(0));
      expect(result.length).toBe(20);
      expect(Buffer.from(result).toString('hex')).toBe(
        '9c1185a5c5e9fc54612808977ee8f548b2258d31'
      );
    });

    it('should produce 20-byte output', () => {
      const data = new TextEncoder().encode('test');
      const result = ripemd160(data);
      expect(result.length).toBe(20);
    });
  });

  describe('doubleSha256', () => {
    it('should produce different result than single sha256', () => {
      const data = new TextEncoder().encode('test');
      const single = sha256(data);
      const double = doubleSha256(data);
      expect(double).not.toEqual(single);
    });

    it('should still produce 32-byte output', () => {
      const data = new TextEncoder().encode('test');
      const result = doubleSha256(data);
      expect(result.length).toBe(32);
    });
  });

  describe('hash160', () => {
    it('should produce 20-byte output', () => {
      const data = new TextEncoder().encode('test');
      const result = hash160(data);
      expect(result.length).toBe(20);
    });

    it('should be RIPEMD160(SHA256(data))', () => {
      const data = new TextEncoder().encode('test');
      const shaResult = sha256(data);
      const expected = ripemd160(shaResult);
      const result = hash160(data);
      expect(result).toEqual(expected);
    });
  });

  describe('hmacSha512', () => {
    it('should produce 64-byte output', () => {
      const key = new TextEncoder().encode('key');
      const data = new TextEncoder().encode('data');
      const result = hmacSha512(key, data);
      expect(result.length).toBe(64);
    });

    it('should produce different results for different keys', () => {
      const data = new TextEncoder().encode('data');
      const key1 = new TextEncoder().encode('key1');
      const key2 = new TextEncoder().encode('key2');
      const result1 = hmacSha512(key1, data);
      const result2 = hmacSha512(key2, data);
      expect(result1).not.toEqual(result2);
    });

    it('should handle key longer than block size', () => {
      const key = new Uint8Array(200).fill(0xab);
      const data = new TextEncoder().encode('data');
      const result = hmacSha512(key, data);
      expect(result.length).toBe(64);
    });

    it('should handle key shorter than block size', () => {
      const key = new Uint8Array([0xab]);
      const data = new TextEncoder().encode('data');
      const result = hmacSha512(key, data);
      expect(result.length).toBe(64);
    });
  });

  describe('concatBytes', () => {
    it('should concatenate two arrays', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([4, 5, 6]);
      const result = concatBytes(a, b);
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
    });

    it('should concatenate multiple arrays', () => {
      const a = new Uint8Array([1]);
      const b = new Uint8Array([2]);
      const c = new Uint8Array([3]);
      const result = concatBytes(a, b, c);
      expect(result).toEqual(new Uint8Array([1, 2, 3]));
    });

    it('should handle empty arrays', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array(0);
      const result = concatBytes(a, b);
      expect(result).toEqual(new Uint8Array([1, 2, 3]));
    });
  });
});
