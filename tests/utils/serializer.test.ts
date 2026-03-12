/**
 * Serializer tests
 */

import { Serializer } from '@/utils/serializer';
import { PaymentBuilder } from '@/transactions/builder';
import type { Transaction } from '@/types';

describe('Serializer', () => {
  let serializer: Serializer;

  beforeEach(() => {
    serializer = new Serializer();
  });

  describe('basic serialization', () => {
    it('should serialize a simple payment', () => {
      const payment = new PaymentBuilder('cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy', 1)
        .setDestination('cDestinationAddressHere')
        .setAmount('1000000')
        .setFee('100')
        .build();

      const serialized = serializer.serialize(payment);
      expect(serialized).toBeInstanceOf(Uint8Array);
      expect(serialized.length).toBeGreaterThan(0);
    });

    it('should deserialize a simple payment', () => {
      const payment = new PaymentBuilder('cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy', 1)
        .setDestination('cDestinationAddressHere')
        .setAmount('1000000')
        .setFee('100')
        .build();

      const serialized = serializer.serialize(payment);
      const deserialized = serializer.deserialize(serialized);

      expect(deserialized.transaction_type).toBe('Payment');
      expect(deserialized.sequence).toBe(1);
    });

    it('should round-trip serialize and deserialize', () => {
      const original = new PaymentBuilder('cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy', 123)
        .setDestination('cDestAddressHere')
        .setAmount('5000000')
        .setFee('120')
        .setDestinationTag(999)
        .build();

      const serialized = serializer.serialize(original);
      const deserialized = serializer.deserialize(serialized);

      expect(deserialized.account).toBe(original.account);
      expect(deserialized.sequence).toBe(original.sequence);
      expect(deserialized.fee).toBe(original.fee);
    });
  });

  describe('hex encoding', () => {
    it('should convert transaction to hex blob', () => {
      const payment = new PaymentBuilder('cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy', 1)
        .setDestination('cDestinationAddressHere')
        .setAmount('1000000')
        .setFee('100')
        .build();

      const hex = serializer.toHex(payment);
      expect(typeof hex).toBe('string');
      expect(hex.length).toBeGreaterThan(0);
      expect(/^[0-9A-F]+$/.test(hex)).toBe(true);
    });

    it('should parse hex blob back to transaction', () => {
      const original = new PaymentBuilder('cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy', 1)
        .setDestination('cDestinationAddressHere')
        .setAmount('1000000')
        .setFee('100')
        .build();

      const hex = serializer.toHex(original);
      const parsed = serializer.fromHex(hex);

      expect(parsed.transaction_type).toBe('Payment');
      expect(parsed.sequence).toBe(1);
    });
  });

  describe('getTransactionHash', () => {
    it('should generate consistent hash for same transaction', () => {
      const payment = new PaymentBuilder('cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy', 1)
        .setDestination('cDestinationAddressHere')
        .setAmount('1000000')
        .setFee('100')
        .build();

      const hash1 = serializer.getTransactionHash(payment);
      const hash2 = serializer.getTransactionHash(payment);

      expect(hash1).toEqual(hash2);
    });

    it('should generate different hash for different transactions', () => {
      const payment1 = new PaymentBuilder('cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy', 1)
        .setDestination('cDestinationAddressHere')
        .setAmount('1000000')
        .setFee('100')
        .build();

      const payment2 = new PaymentBuilder('cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy', 2)
        .setDestination('cDestinationAddressHere')
        .setAmount('1000000')
        .setFee('100')
        .build();

      const hash1 = serializer.getTransactionHash(payment1);
      const hash2 = serializer.getTransactionHash(payment2);

      expect(hash1).not.toEqual(hash2);
    });
  });
});
