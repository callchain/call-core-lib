/**
 * Transaction types and interfaces
 */

import type {
  AccountID,
  Amount,
  Currency,
  Fee,
  HexString,
  Memo,
  PublicKey,
  Sequence,
  Signer,
  SignerEntry,
  TxBlob,
  TxFlags,
  TxHash,
} from './common';

/**
 * Transaction type enum
 */
export enum TxType {
  Invalid = -1,
  Payment = 0,
  AccountSet = 3,
  SetRegularKey = 5,
  NicknameSet = 6,
  OfferCreate = 7,
  OfferCancel = 8,
  SignerListSet = 12,
  IssueSet = 16,
  DepositPreauth = 19,
  TrustSet = 20,

  // Pseudotransactions
  EnableAmendment = 100,
  SetFee = 101,
}

/**
 * Transaction type string
 */
export type TxTypeString =
  | 'Payment'
  | 'AccountSet'
  | 'SetRegularKey'
  | 'NicknameSet'
  | 'OfferCreate'
  | 'OfferCancel'
  | 'SignerListSet'
  | 'IssueSet'
  | 'DepositPreauth'
  | 'TrustSet'
  | 'EnableAmendment'
  | 'SetFee';

/**
 * Base transaction interface
 */
export interface BaseTransaction {
  // Common fields
  account?: AccountID;
  transaction_type?: TxTypeString;
  sequence?: Sequence;
  fee?: Fee;
  flags?: TxFlags;
  source_tag?: number;
  signing_pub_key?: PublicKey;
  txn_signature?: string;
  hash?: TxHash;
  memos?: Memo[];
  signers?: Signer[];
  last_ledger_sequence?: number;
  account_txn_id?: HexString;

  // Transaction blob (when signed)
  tx_blob?: TxBlob;
}

/**
 * Payment transaction
 */
export interface Payment extends BaseTransaction {
  transaction_type: 'Payment';
  destination: AccountID;
  amount: Amount;
  destination_tag?: number;
  send_max?: Amount;
  deliver_min?: Amount;
  invoice_id?: HexString;
  paths?: string;
}

/**
 * AccountSet transaction
 */
export interface AccountSet extends BaseTransaction {
  transaction_type: 'AccountSet';
  domain?: string;
  email_hash?: HexString;
  message_key?: string;
  transfer_rate?: number;
  tick_size?: number;
  set_flag?: number;
  clear_flag?: number;
  wallet_locator?: HexString;
  wallet_size?: number;
}

/**
 * SetRegularKey transaction
 */
export interface SetRegularKey extends BaseTransaction {
  transaction_type: 'SetRegularKey';
  regular_key?: AccountID;
}

/**
 * TrustSet transaction
 */
export interface TrustSet extends BaseTransaction {
  transaction_type: 'TrustSet';
  limit_amount?: Amount;
  quality_in?: number;
  quality_out?: number;
}

/**
 * OfferCreate transaction
 */
export interface OfferCreate extends BaseTransaction {
  transaction_type: 'OfferCreate';
  taker_pays: Amount;
  taker_gets: Amount;
  expiration?: number;
  offer_sequence?: Sequence;
}

/**
 * OfferCancel transaction
 */
export interface OfferCancel extends BaseTransaction {
  transaction_type: 'OfferCancel';
  offer_sequence: Sequence;
}

/**
 * SignerListSet transaction
 */
export interface SignerListSet extends BaseTransaction {
  transaction_type: 'SignerListSet';
  signer_quorum: number;
  signer_entries?: SignerEntry[];
}

/**
 * IssueSet transaction
 */
export interface IssueSet extends BaseTransaction {
  transaction_type: 'IssueSet';
  total_supply?: Amount;
}

/**
 * NicknameSet transaction
 */
export interface NicknameSet extends BaseTransaction {
  transaction_type: 'NicknameSet';
  nickname?: string;
  min_offer?: Amount;
}

/**
 * DepositPreauth transaction
 */
export interface DepositPreauth extends BaseTransaction {
  transaction_type: 'DepositPreauth';
  authorize?: AccountID;
  unauthorize?: AccountID;
}

/**
 * Union type for all transactions
 */
export type Transaction =
  | Payment
  | AccountSet
  | SetRegularKey
  | TrustSet
  | OfferCreate
  | OfferCancel
  | SignerListSet
  | IssueSet
  | NicknameSet
  | DepositPreauth;

/**
 * Transaction metadata
 */
export interface TransactionMetadata {
  affected_nodes: unknown[];
  transaction_index: number;
  transaction_result: string;
  delivered_amount?: Amount;
}

/**
 * Submitted transaction response
 */
export interface SubmittedTransaction {
  tx_blob: TxBlob;
  tx_json?: Transaction;
  engine_result: string;
  engine_result_code: number;
  engine_result_message: string;
}

/**
 * Transaction with metadata
 */
export interface TransactionWithMetadata {
  transaction: Transaction;
  metadata?: TransactionMetadata;
  ledger_index?: number;
  validated?: boolean;
  status?: string;
}

/**
 * Account root ledger entry
 */
export interface AccountRoot {
  account: AccountID;
  balance: string;
  sequence: number;
  owner_count: number;
  flags: number;
  previous_txn_id: string;
  previous_txn_lgr_seq: number;
  account_txn_id?: string;
  wallet_locator?: string;
  wallet_size?: number;
  message_key?: string;
  domain?: string;
  transfer_rate?: number;
  code_garage?: number;
  email_hash?: string;
  regular_key?: AccountID;
  tick_size?: number;
}

/**
 * CallState (trust line) ledger entry
 */
export interface CallState {
  account: AccountID;
  issuer: AccountID;
  currency: Currency;
  balance: string;
  limit: string;
  limit_peer: string;
  quality_in?: number;
  quality_out?: number;
  previous_txn_id: string;
  previous_txn_lgr_seq: number;
  low_node?: string;
  high_node?: string;
}

/**
 * Offer ledger entry
 */
export interface OfferEntry {
  account: AccountID;
  sequence: number;
  taker_pays: Amount;
  taker_gets: Amount;
  expiration?: number;
  book_node?: string;
  owner_node?: string;
  previous_txn_id: string;
  previous_txn_lgr_seq: number;
}

/**
 * SignerList ledger entry
 */
export interface SignerList {
  account: AccountID;
  signer_quorum: number;
  signer_entries: SignerEntry[];
  previous_txn_id: string;
  previous_txn_lgr_seq: number;
  owner_node?: string;
}

/**
 * Ledger entry union type
 */
export type LedgerEntry = AccountRoot | CallState | OfferEntry | SignerList;

/**
 * Ledger header
 */
export interface LedgerHeader {
  ledger_index: number;
  ledger_hash: string;
  parent_hash: string;
  account_hash: string;
  close_time: number;
  close_time_resolution: number;
  close_flags: number;
  closed: boolean;
  total_coins: string;
  transaction_hash?: string;
}

/**
 * Ledger
 */
export interface Ledger {
  ledger_index: number;
  ledger_hash: string;
  parent_hash: string;
  account_hash: string;
  close_time: number;
  closed: boolean;
  transactions?: (string | TransactionWithMetadata)[];
}
