/**
 * Transaction builder tests
 */

import {
  TransactionBuilder,
  PaymentBuilder,
  AccountSetBuilder,
  TrustSetBuilder,
  OfferCreateBuilder,
  OfferCancelBuilder,
  SetRegularKeyBuilder,
  SignerListSetBuilder,
  DepositPreauthBuilder,
  createTransaction,
  TxFlags,
} from '@/transactions/builder';
import type { Payment, AccountSet, TrustSet, OfferCreate, OfferCancel, SetRegularKey, SignerListSet, DepositPreauth } from '@/types';

describe('TransactionBuilder', () => {
  describe('base builder', () => {
    it('should create basic transaction', () => {
      const tx = new PaymentBuilder('c1234567890ABCDEF', 1)
        .setDestination('c0987654321FEDCBA')
        .setAmount('1000000')
        .setFee('100')
        .setFlags(TxFlags.tfFullyCanonicalSig)
        .build();

      expect(tx.account).toBe('c1234567890ABCDEF');
      expect(tx.sequence).toBe(1);
      expect(tx.fee).toBe('100');
      expect(tx.flags).toBe(TxFlags.tfFullyCanonicalSig);
    });

    it('should add memo', () => {
      const tx = new PaymentBuilder('c1234567890ABCDEF', 1)
        .setDestination('c0987654321FEDCBA')
        .setAmount('1000000')
        .addMemo({ memo_data: 'ABCDEF' })
        .build();

      expect(tx.memos).toHaveLength(1);
      expect(tx.memos![0].memo_data).toBe('ABCDEF');
    });

    it('should add text memo', () => {
      const tx = new PaymentBuilder('c1234567890ABCDEF', 1)
        .setDestination('c0987654321FEDCBA')
        .setAmount('1000000')
        .addTextMemo('Hello')
        .build();

      expect(tx.memos).toHaveLength(1);
      expect(tx.memos![0].memo_data).toBe('48656C6C6F');
    });

    it('should set last ledger sequence', () => {
      const tx = new PaymentBuilder('c1234567890ABCDEF', 1)
        .setDestination('c0987654321FEDCBA')
        .setAmount('1000000')
        .setLastLedgerSequence(1000)
        .build();

      expect(tx.last_ledger_sequence).toBe(1000);
    });

    it('should throw if transaction type not set', () => {
      const builder = new TransactionBuilder('c1234567890ABCDEF', 1);
      expect(() => builder.build()).toThrow('Transaction type not set');
    });
  });

  describe('PaymentBuilder', () => {
    it('should create payment transaction', () => {
      const tx = new PaymentBuilder('c1234567890ABCDEF', 1)
        .setDestination('c0987654321FEDCBA')
        .setAmount('1000000')
        .setFee('100')
        .build() as Payment;

      expect(tx.transaction_type).toBe('Payment');
      expect(tx.destination).toBe('c0987654321FEDCBA');
      expect(tx.amount).toBe('1000000');
    });

    it('should set destination tag', () => {
      const tx = new PaymentBuilder('c1234567890ABCDEF', 1)
        .setDestination('c0987654321FEDCBA')
        .setAmount('1000000')
        .setDestinationTag(12345)
        .build() as Payment;

      expect(tx.destination_tag).toBe(12345);
    });

    it('should set send max', () => {
      const tx = new PaymentBuilder('c1234567890ABCDEF', 1)
        .setDestination('c0987654321FEDCBA')
        .setAmount('1000000')
        .setSendMax('1500000')
        .build() as Payment;

      expect(tx.send_max).toBe('1500000');
    });

    it('should set partial payment flag', () => {
      const tx = new PaymentBuilder('c1234567890ABCDEF', 1)
        .setDestination('c0987654321FEDCBA')
        .setAmount('1000000')
        .setPartialPayment()
        .build();

      expect(tx.flags! & TxFlags.tfPartialPayment).toBe(TxFlags.tfPartialPayment);
    });

    it('should set no direct call flag', () => {
      const tx = new PaymentBuilder('c1234567890ABCDEF', 1)
        .setDestination('c0987654321FEDCBA')
        .setAmount('1000000')
        .setNoDirectCall()
        .build();

      expect(tx.flags! & TxFlags.tfNoDirectCall).toBe(TxFlags.tfNoDirectCall);
    });
  });

  describe('AccountSetBuilder', () => {
    it('should create account set transaction', () => {
      const tx = new AccountSetBuilder('c1234567890ABCDEF', 1)
        .setDomain('example.com')
        .setFee('100')
        .build() as AccountSet;

      expect(tx.transaction_type).toBe('AccountSet');
      expect(tx.domain).toBe('6578616D706C652E636F6D');
    });

    it('should set email hash', () => {
      const tx = new AccountSetBuilder('c1234567890ABCDEF', 1)
        .setEmailHash('ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890')
        .build() as AccountSet;

      expect(tx.email_hash).toBe('ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890');
    });

    it('should set transfer rate', () => {
      const tx = new AccountSetBuilder('c1234567890ABCDEF', 1)
        .setTransferRate(1000000001)
        .build() as AccountSet;

      expect(tx.transfer_rate).toBe(1000000001);
    });

    it('should require destination tag', () => {
      const tx = new AccountSetBuilder('c1234567890ABCDEF', 1)
        .requireDestTag()
        .build() as AccountSet;

      expect(tx.set_flag).toBe(TxFlags.tfRequireDestTag);
    });

    it('should disallow call', () => {
      const tx = new AccountSetBuilder('c1234567890ABCDEF', 1)
        .disallowCall()
        .build() as AccountSet;

      expect(tx.set_flag).toBe(TxFlags.tfDisallowCall);
    });
  });

  describe('TrustSetBuilder', () => {
    it('should create trust set transaction', () => {
      const tx = new TrustSetBuilder('c1234567890ABCDEF', 1)
        .setLimitAmount({
          currency: 'USD',
          issuer: 'c0987654321FEDCBA',
          value: '1000',
        })
        .setFee('100')
        .build() as TrustSet;

      expect(tx.transaction_type).toBe('TrustSet');
      expect(tx.limit_amount).toEqual({
        currency: 'USD',
        issuer: 'c0987654321FEDCBA',
        value: '1000',
      });
    });

    it('should set quality in/out', () => {
      const tx = new TrustSetBuilder('c1234567890ABCDEF', 1)
        .setLimitAmount({ currency: 'USD', issuer: 'c0987654321FEDCBA', value: '1000' })
        .setQualityIn(1000000000)
        .setQualityOut(1000000000)
        .build() as TrustSet;

      expect(tx.quality_in).toBe(1000000000);
      expect(tx.quality_out).toBe(1000000000);
    });

    it('should set no call flag', () => {
      const tx = new TrustSetBuilder('c1234567890ABCDEF', 1)
        .setLimitAmount({ currency: 'USD', issuer: 'c0987654321FEDCBA', value: '1000' })
        .setNoCall()
        .build();

      expect(tx.flags! & TxFlags.tfSetNoCall).toBe(TxFlags.tfSetNoCall);
    });
  });

  describe('OfferCreateBuilder', () => {
    it('should create offer create transaction', () => {
      const tx = new OfferCreateBuilder('c1234567890ABCDEF', 1)
        .setTakerPays('1000000')
        .setTakerGets({
          currency: 'USD',
          issuer: 'c0987654321FEDCBA',
          value: '100',
        })
        .setFee('100')
        .build() as OfferCreate;

      expect(tx.transaction_type).toBe('OfferCreate');
      expect(tx.taker_pays).toBe('1000000');
      expect(tx.taker_gets).toEqual({
        currency: 'USD',
        issuer: 'c0987654321FEDCBA',
        value: '100',
      });
    });

    it('should set expiration', () => {
      const tx = new OfferCreateBuilder('c1234567890ABCDEF', 1)
        .setTakerPays('1000000')
        .setTakerGets('1000000')
        .setExpiration(1234567890)
        .build() as OfferCreate;

      expect(tx.expiration).toBe(1234567890);
    });

    it('should set passive flag', () => {
      const tx = new OfferCreateBuilder('c1234567890ABCDEF', 1)
        .setTakerPays('1000000')
        .setTakerGets('1000000')
        .setPassive()
        .build();

      expect(tx.flags! & TxFlags.tfPassive).toBe(TxFlags.tfPassive);
    });

    it('should set sell flag', () => {
      const tx = new OfferCreateBuilder('c1234567890ABCDEF', 1)
        .setTakerPays('1000000')
        .setTakerGets('1000000')
        .setSell()
        .build();

      expect(tx.flags! & TxFlags.tfSell).toBe(TxFlags.tfSell);
    });
  });

  describe('OfferCancelBuilder', () => {
    it('should create offer cancel transaction', () => {
      const tx = new OfferCancelBuilder('c1234567890ABCDEF', 1)
        .setOfferSequence(123)
        .setFee('100')
        .build() as OfferCancel;

      expect(tx.transaction_type).toBe('OfferCancel');
      expect(tx.offer_sequence).toBe(123);
    });
  });

  describe('SetRegularKeyBuilder', () => {
    it('should create set regular key transaction', () => {
      const tx = new SetRegularKeyBuilder('c1234567890ABCDEF', 1)
        .setRegularKey('c0987654321FEDCBA')
        .setFee('100')
        .build() as SetRegularKey;

      expect(tx.transaction_type).toBe('SetRegularKey');
      expect(tx.regular_key).toBe('c0987654321FEDCBA');
    });

    it('should clear regular key', () => {
      const tx = new SetRegularKeyBuilder('c1234567890ABCDEF', 1)
        .setRegularKey(null)
        .setFee('100')
        .build() as SetRegularKey;

      expect(tx.regular_key).toBeUndefined();
    });
  });

  describe('SignerListSetBuilder', () => {
    it('should create signer list set transaction', () => {
      const tx = new SignerListSetBuilder('c1234567890ABCDEF', 1)
        .setSignerQuorum(2)
        .addSigner('c1111111111111111', 1)
        .addSigner('c2222222222222222', 1)
        .setFee('100')
        .build() as SignerListSet;

      expect(tx.transaction_type).toBe('SignerListSet');
      expect(tx.signer_quorum).toBe(2);
      expect(tx.signer_entries).toHaveLength(2);
      expect(tx.signer_entries![0]).toEqual({ account: 'c1111111111111111', weight: 1 });
    });

    it('should set signer entries', () => {
      const entries = [
        { account: 'c1111111111111111', weight: 1 },
        { account: 'c2222222222222222', weight: 2 },
      ];

      const tx = new SignerListSetBuilder('c1234567890ABCDEF', 1)
        .setSignerQuorum(3)
        .setSignerEntries(entries)
        .build() as SignerListSet;

      expect(tx.signer_entries).toEqual(entries);
    });
  });

  describe('DepositPreauthBuilder', () => {
    it('should create authorize transaction', () => {
      const tx = new DepositPreauthBuilder('c1234567890ABCDEF', 1)
        .authorize('c0987654321FEDCBA')
        .setFee('100')
        .build() as DepositPreauth;

      expect(tx.transaction_type).toBe('DepositPreauth');
      expect(tx.authorize).toBe('c0987654321FEDCBA');
    });

    it('should create unauthorize transaction', () => {
      const tx = new DepositPreauthBuilder('c1234567890ABCDEF', 1)
        .unauthorize('c0987654321FEDCBA')
        .setFee('100')
        .build() as DepositPreauth;

      expect(tx.transaction_type).toBe('DepositPreauth');
      expect(tx.unauthorize).toBe('c0987654321FEDCBA');
    });
  });

  describe('createTransaction', () => {
    it('should create Payment builder', () => {
      const builder = createTransaction('Payment', 'c1234567890ABCDEF', 1);
      expect(builder).toBeInstanceOf(PaymentBuilder);
    });

    it('should create AccountSet builder', () => {
      const builder = createTransaction('AccountSet', 'c1234567890ABCDEF', 1);
      expect(builder).toBeInstanceOf(AccountSetBuilder);
    });

    it('should create TrustSet builder', () => {
      const builder = createTransaction('TrustSet', 'c1234567890ABCDEF', 1);
      expect(builder).toBeInstanceOf(TrustSetBuilder);
    });

    it('should create OfferCreate builder', () => {
      const builder = createTransaction('OfferCreate', 'c1234567890ABCDEF', 1);
      expect(builder).toBeInstanceOf(OfferCreateBuilder);
    });

    it('should create OfferCancel builder', () => {
      const builder = createTransaction('OfferCancel', 'c1234567890ABCDEF', 1);
      expect(builder).toBeInstanceOf(OfferCancelBuilder);
    });
  });
});
