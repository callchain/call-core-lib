/**
 * Transaction builder for Call-Core
 * Creates and serializes transactions
 */

import type {
  AccountID,
  Amount,
  Currency,
  Memo,
  SignerEntry,
  Transaction,
  Payment,
  AccountSet,
  TrustSet,
  OfferCreate,
  OfferCancel,
  SetRegularKey,
  SignerListSet,
  IssueSet,
  NicknameSet,
  DepositPreauth,
  TxTypeString,
} from '@/types';

// Transaction type mapping
const TX_TYPES: Record<TxTypeString, number> = {
  'Payment': 0,
  'AccountSet': 3,
  'SetRegularKey': 5,
  'NicknameSet': 6,
  'OfferCreate': 7,
  'OfferCancel': 8,
  'SignerListSet': 12,
  'IssueSet': 16,
  'DepositPreauth': 19,
  'TrustSet': 20,
  'EnableAmendment': 100,
  'SetFee': 101,
};

// Transaction flags
export const TxFlags = {
  // Universal flags
  tfFullyCanonicalSig: 0x80000000,

  // Payment flags
  tfNoDirectCall: 0x00010000,
  tfPartialPayment: 0x00020000,
  tfLimitQuality: 0x00040000,
  tfNoCallDirect: 0x00080000,

  // AccountSet flags
  tfRequireDestTag: 0x00010000,
  tfOptionalDestTag: 0x00020000,
  tfRequireAuth: 0x00040000,
  tfOptionalAuth: 0x00080000,
  tfDisallowCall: 0x00100000,
  tfAllowCall: 0x00200000,

  // OfferCreate flags
  tfPassive: 0x00010000,
  tfImmediateOrCancel: 0x00020000,
  tfFillOrKill: 0x00040000,
  tfSell: 0x00080000,

  // TrustSet flags
  tfSetAuth: 0x00010000,
  tfSetNoCall: 0x00020000,
  tfClearNoCall: 0x00040000,
  tfSetFreeze: 0x00100000,
  tfClearFreeze: 0x00200000,
} as const;

/**
 * Base transaction builder
 */
export class TransactionBuilder {
  protected tx: Partial<Transaction> = {};

  constructor(account: AccountID, sequence: number) {
    this.tx.account = account;
    this.tx.sequence = sequence;
  }

  /**
   * Set fee
   */
  setFee(fee: string): this {
    this.tx.fee = fee;
    return this;
  }

  /**
   * Set flags
   */
  setFlags(flags: number): this {
    this.tx.flags = flags;
    return this;
  }

  /**
   * Add memo
   */
  addMemo(memo: Memo): this {
    if (!this.tx.memos) {
      this.tx.memos = [];
    }
    this.tx.memos.push(memo);
    return this;
  }

  /**
   * Add text memo
   */
  addTextMemo(text: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return this.addMemo({ memo_data: hex.toUpperCase() });
  }

  /**
   * Set last ledger sequence
   */
  setLastLedgerSequence(sequence: number): this {
    this.tx.last_ledger_sequence = sequence;
    return this;
  }

  /**
   * Set signing public key
   */
  setSigningPubKey(pubKey: string): this {
    this.tx.signing_pub_key = pubKey;
    return this;
  }

  /**
   * Build the transaction
   */
  build(): Transaction {
    if (!this.tx.transaction_type) {
      throw new Error('Transaction type not set');
    }
    return this.tx as Transaction;
  }
}

/**
 * Payment transaction builder
 */
export class PaymentBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number) {
    super(account, sequence);
    this.tx.transaction_type = 'Payment';
  }

  /**
   * Set destination
   */
  setDestination(destination: AccountID): this {
    (this.tx as Payment).destination = destination;
    return this;
  }

  /**
   * Set amount
   */
  setAmount(amount: Amount): this {
    (this.tx as Payment).amount = amount;
    return this;
  }

  /**
   * Set destination tag
   */
  setDestinationTag(tag: number): this {
    (this.tx as Payment).destination_tag = tag;
    return this;
  }

  /**
   * Set send max
   */
  setSendMax(amount: Amount): this {
    (this.tx as Payment).send_max = amount;
    return this;
  }

  /**
   * Set invoice ID
   */
  setInvoiceId(invoiceId: string): this {
    (this.tx as Payment).invoice_id = invoiceId;
    return this;
  }

  /**
   * Set partial payment flag
   */
  setPartialPayment(): this {
    this.tx.flags = (this.tx.flags || 0) | TxFlags.tfPartialPayment;
    return this;
  }

  /**
   * Set no direct call flag
   */
  setNoDirectCall(): this {
    this.tx.flags = (this.tx.flags || 0) | TxFlags.tfNoDirectCall;
    return this;
  }
}

/**
 * AccountSet transaction builder
 */
export class AccountSetBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number) {
    super(account, sequence);
    this.tx.transaction_type = 'AccountSet';
  }

  /**
   * Set domain
   */
  setDomain(domain: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(domain);
    (this.tx as AccountSet).domain = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    return this;
  }

  /**
   * Set email hash
   */
  setEmailHash(hash: string): this {
    (this.tx as AccountSet).email_hash = hash;
    return this;
  }

  /**
   * Set message key
   */
  setMessageKey(key: string): this {
    (this.tx as AccountSet).message_key = key;
    return this;
  }

  /**
   * Set transfer rate
   */
  setTransferRate(rate: number): this {
    (this.tx as AccountSet).transfer_rate = rate;
    return this;
  }

  /**
   * Set tick size
   */
  setTickSize(size: number): this {
    (this.tx as AccountSet).tick_size = size;
    return this;
  }

  /**
   * Set flag
   */
  setFlag(flag: number): this {
    (this.tx as AccountSet).set_flag = flag;
    return this;
  }

  /**
   * Clear flag
   */
  clearFlag(flag: number): this {
    (this.tx as AccountSet).clear_flag = flag;
    return this;
  }

  /**
   * Require destination tag
   */
  requireDestTag(): this {
    return this.setFlag(TxFlags.tfRequireDestTag);
  }

  /**
   * Require authorization
   */
  requireAuth(): this {
    return this.setFlag(TxFlags.tfRequireAuth);
  }

  /**
   * Disallow call
   */
  disallowCall(): this {
    return this.setFlag(TxFlags.tfDisallowCall);
  }
}

/**
 * TrustSet transaction builder
 */
export class TrustSetBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number) {
    super(account, sequence);
    this.tx.transaction_type = 'TrustSet';
  }

  /**
   * Set limit amount
   */
  setLimitAmount(amount: Amount): this {
    (this.tx as TrustSet).limit_amount = amount;
    return this;
  }

  /**
   * Set quality in
   */
  setQualityIn(quality: number): this {
    (this.tx as TrustSet).quality_in = quality;
    return this;
  }

  /**
   * Set quality out
   */
  setQualityOut(quality: number): this {
    (this.tx as TrustSet).quality_out = quality;
    return this;
  }

  /**
   * Set no call flag
   */
  setNoCall(): this {
    this.tx.flags = (this.tx.flags || 0) | TxFlags.tfSetNoCall;
    return this;
  }

  /**
   * Set freeze flag
   */
  setFreeze(): this {
    this.tx.flags = (this.tx.flags || 0) | TxFlags.tfSetFreeze;
    return this;
  }
}

/**
 * OfferCreate transaction builder
 */
export class OfferCreateBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number) {
    super(account, sequence);
    this.tx.transaction_type = 'OfferCreate';
  }

  /**
   * Set taker pays
   */
  setTakerPays(amount: Amount): this {
    (this.tx as OfferCreate).taker_pays = amount;
    return this;
  }

  /**
   * Set taker gets
   */
  setTakerGets(amount: Amount): this {
    (this.tx as OfferCreate).taker_gets = amount;
    return this;
  }

  /**
   * Set expiration
   */
  setExpiration(timestamp: number): this {
    (this.tx as OfferCreate).expiration = timestamp;
    return this;
  }

  /**
   * Set offer sequence
   */
  setOfferSequence(sequence: number): this {
    (this.tx as OfferCreate).offer_sequence = sequence;
    return this;
  }

  /**
   * Set passive flag
   */
  setPassive(): this {
    this.tx.flags = (this.tx.flags || 0) | TxFlags.tfPassive;
    return this;
  }

  /**
   * Set immediate or cancel flag
   */
  setImmediateOrCancel(): this {
    this.tx.flags = (this.tx.flags || 0) | TxFlags.tfImmediateOrCancel;
    return this;
  }

  /**
   * Set fill or kill flag
   */
  setFillOrKill(): this {
    this.tx.flags = (this.tx.flags || 0) | TxFlags.tfFillOrKill;
    return this;
  }

  /**
   * Set sell flag
   */
  setSell(): this {
    this.tx.flags = (this.tx.flags || 0) | TxFlags.tfSell;
    return this;
  }
}

/**
 * OfferCancel transaction builder
 */
export class OfferCancelBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number) {
    super(account, sequence);
    this.tx.transaction_type = 'OfferCancel';
  }

  /**
   * Set offer sequence to cancel
   */
  setOfferSequence(sequence: number): this {
    (this.tx as OfferCancel).offer_sequence = sequence;
    return this;
  }
}

/**
 * SetRegularKey transaction builder
 */
export class SetRegularKeyBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number) {
    super(account, sequence);
    this.tx.transaction_type = 'SetRegularKey';
  }

  /**
   * Set regular key
   */
  setRegularKey(key: AccountID | null): this {
    if (key) {
      (this.tx as SetRegularKey).regular_key = key;
    } else {
      delete (this.tx as SetRegularKey).regular_key;
    }
    return this;
  }
}

/**
 * SignerListSet transaction builder
 */
export class SignerListSetBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number) {
    super(account, sequence);
    this.tx.transaction_type = 'SignerListSet';
  }

  /**
   * Set signer quorum
   */
  setSignerQuorum(quorum: number): this {
    (this.tx as SignerListSet).signer_quorum = quorum;
    return this;
  }

  /**
   * Add signer entry
   */
  addSigner(account: AccountID, weight: number): this {
    if (!(this.tx as SignerListSet).signer_entries) {
      (this.tx as SignerListSet).signer_entries = [];
    }
    (this.tx as SignerListSet).signer_entries!.push({ account, weight });
    return this;
  }

  /**
   * Set signer entries
   */
  setSignerEntries(entries: SignerEntry[]): this {
    (this.tx as SignerListSet).signer_entries = entries;
    return this;
  }
}

/**
 * DepositPreauth transaction builder
 */
export class DepositPreauthBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number) {
    super(account, sequence);
    this.tx.transaction_type = 'DepositPreauth';
  }

  /**
   * Authorize an account
   */
  authorize(authorized: AccountID): this {
    (this.tx as DepositPreauth).authorize = authorized;
    delete (this.tx as DepositPreauth).unauthorize;
    return this;
  }

  /**
   * Unauthorize an account
   */
  unauthorize(unauthorized: AccountID): this {
    (this.tx as DepositPreauth).unauthorize = unauthorized;
    delete (this.tx as DepositPreauth).authorize;
    return this;
  }
}

/**
 * Create transaction builder based on type
 */
export function createTransaction(
  type: TxTypeString,
  account: AccountID,
  sequence: number
): TransactionBuilder {
  switch (type) {
    case 'Payment':
      return new PaymentBuilder(account, sequence);
    case 'AccountSet':
      return new AccountSetBuilder(account, sequence);
    case 'TrustSet':
      return new TrustSetBuilder(account, sequence);
    case 'OfferCreate':
      return new OfferCreateBuilder(account, sequence);
    case 'OfferCancel':
      return new OfferCancelBuilder(account, sequence);
    case 'SetRegularKey':
      return new SetRegularKeyBuilder(account, sequence);
    case 'SignerListSet':
      return new SignerListSetBuilder(account, sequence);
    case 'DepositPreauth':
      return new DepositPreauthBuilder(account, sequence);
    default:
      return new TransactionBuilder(account, sequence);
  }
}
