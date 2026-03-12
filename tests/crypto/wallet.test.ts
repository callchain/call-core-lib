/**
 * Wallet tests with local signing
 */

import {
  Wallet,
  signTransaction,
  verifyTransaction,
  decodeTransactionBlob,
  getTransactionHash,
} from '@/crypto/wallet';
import { PaymentBuilder, AccountSetBuilder } from '@/transactions/builder';

describe('Wallet', () => {
  describe('generate', () => {
    it('should generate a new wallet', () => {
      const wallet = Wallet.generate();

      expect(wallet.address).toBeDefined();
      expect(wallet.address.startsWith('c')).toBe(true);
      expect(wallet.publicKey).toBeDefined();
      expect(wallet.publicKey.length).toBe(66);
      expect(wallet.seed).toBeDefined();
      expect(wallet.seed.startsWith('s')).toBe(true);
    });

    it('should generate unique wallets', () => {
      const wallet1 = Wallet.generate();
      const wallet2 = Wallet.generate();

      expect(wallet1.address).not.toBe(wallet2.address);
      expect(wallet1.seed).not.toBe(wallet2.seed);
    });
  });

  describe('fromSeed', () => {
    it('should recreate wallet from seed', () => {
      const wallet1 = Wallet.generate();
      const wallet2 = Wallet.fromSeed(wallet1.seed);

      expect(wallet2.address).toBe(wallet1.address);
      expect(wallet2.publicKey).toBe(wallet1.publicKey);
    });
  });

  describe('sign', () => {
    it('should sign a payment transaction', () => {
      const wallet = Wallet.generate();

      const payment = new PaymentBuilder(wallet.address, 1)
        .setDestination('cDestinationAddressHere')
        .setAmount('1000000')
        .setFee('100')
        .build();

      const signed = wallet.sign(payment);

      expect(signed.tx_blob).toBeDefined();
      expect(signed.tx_blob.length).toBeGreaterThan(0);
      expect(signed.hash).toBeDefined();
      expect(signed.hash.length).toBe(64); // 32 bytes = 64 hex chars
      expect(signed.tx_json.txn_signature).toBeDefined();
    });

    it('should include signing public key in signed tx', () => {
      const wallet = Wallet.generate();

      const payment = new PaymentBuilder(wallet.address, 1)
        .setDestination('cDestinationAddressHere')
        .setAmount('1000000')
        .setFee('100')
        .build();

      const signed = wallet.sign(payment);

      expect(signed.tx_json.signing_pub_key).toBe(wallet.publicKey);
    });

    it('should reject transaction with wrong account', () => {
      const wallet = Wallet.generate();

      const payment = new PaymentBuilder('cOtherAddressHere', 1)
        .setDestination('cDestinationAddressHere')
        .setAmount('1000000')
        .setFee('100')
        .build();

      expect(() => wallet.sign(payment)).toThrow('does not match wallet address');
    });

    it('should reject transaction without type', () => {
      const wallet = Wallet.generate();

      const invalidTx = {
        account: wallet.address,
        sequence: 1,
      } as any;

      expect(() => wallet.sign(invalidTx)).toThrow('Transaction type is required');
    });

    it('should sign AccountSet transaction', () => {
      const wallet = Wallet.generate();

      const accountSet = new AccountSetBuilder(wallet.address, 1)
        .setDomain('example.com')
        .setFee('100')
        .build();

      const signed = wallet.sign(accountSet);

      expect(signed.tx_blob).toBeDefined();
      expect(signed.hash).toBeDefined();
    });
  });

  describe('verify', () => {
    it('should verify a signed transaction', () => {
      const wallet = Wallet.generate();

      const payment = new PaymentBuilder(wallet.address, 1)
        .setDestination('cDestinationAddressHere')
        .setAmount('1000000')
        .setFee('100')
        .build();

      const signed = wallet.sign(payment);

      expect(wallet.verify(signed.tx_json)).toBe(true);
    });

    it('should reject tampered transaction', () => {
      const wallet = Wallet.generate();

      const payment = new PaymentBuilder(wallet.address, 1)
        .setDestination('cDestinationAddressHere')
        .setAmount('1000000')
        .setFee('100')
        .build();

      const signed = wallet.sign(payment);

      // Tamper with the transaction
      signed.tx_json.fee = '200';

      expect(wallet.verify(signed.tx_json)).toBe(false);
    });
  });
});

describe('signTransaction', () => {
  it('should sign with standalone function', () => {
    const wallet = Wallet.generate();

    const payment = new PaymentBuilder(wallet.address, 1)
      .setDestination('cDestinationAddressHere')
      .setAmount('1000000')
      .setFee('100')
      .build();

    const signed = signTransaction(payment, wallet.privateKey, wallet.publicKey);

    expect(signed.tx_blob).toBeDefined();
    expect(signed.hash).toBeDefined();
  });
});

describe('verifyTransaction', () => {
  it('should verify with standalone function', () => {
    const wallet = Wallet.generate();

    const payment = new PaymentBuilder(wallet.address, 1)
      .setDestination('cDestinationAddressHere')
      .setAmount('1000000')
      .setFee('100')
      .build();

    const signed = wallet.sign(payment);

    expect(verifyTransaction(signed.tx_json)).toBe(true);
  });
});

describe('decodeTransactionBlob', () => {
  it('should decode transaction blob', () => {
    const wallet = Wallet.generate();

    const payment = new PaymentBuilder(wallet.address, 1)
      .setDestination('cDestinationAddressHere')
      .setAmount('1000000')
      .setFee('100')
      .build();

    const signed = wallet.sign(payment);
    const decoded = decodeTransactionBlob(signed.tx_blob);

    expect(decoded.transaction_type).toBe('Payment');
    expect(decoded.account).toBe(wallet.address);
    expect(decoded.txn_signature).toBeDefined();
  });
});

describe('getTransactionHash', () => {
  it('should generate transaction hash', () => {
    const wallet = Wallet.generate();

    const payment = new PaymentBuilder(wallet.address, 1)
      .setDestination('cDestinationAddressHere')
      .setAmount('1000000')
      .setFee('100')
      .build();

    const hash = getTransactionHash(payment);

    expect(hash).toBeDefined();
    expect(hash.length).toBe(64);
  });
});
