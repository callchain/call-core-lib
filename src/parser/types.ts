/**
 * Transaction metadata types for parsing
 */

import type { IssuedCurrencyAmount } from '@/types';

/**
 * Currency amount in parser format
 */
export interface ParsedCurrencyAmount {
  currency: string;
  counterparty?: string;
  value: string;
}

/**
 * Balance change entry
 */
export interface BalanceChange {
  counterparty: string;
  currency: string;
  value: string;
}

/**
 * Balance changes grouped by address
 */
export interface BalanceChanges {
  [address: string]: BalanceChange[];
}

/**
 * Order change entry
 */
export interface OrderChange {
  direction: 'buy' | 'sell';
  quantity: ParsedCurrencyAmount;
  totalPrice: ParsedCurrencyAmount;
  sequence: number;
  status: 'created' | 'partially-filled' | 'filled' | 'cancelled';
  makerExchangeRate: string;
  expirationTime?: string;
  account?: string;
}

/**
 * Orderbook changes grouped by address
 */
export interface OrderbookChanges {
  [address: string]: OrderChange[];
}

/**
 * Raw metadata node fields
 */
export interface NodeFields {
  Account?: string;
  Balance?: string | IssuedCurrencyAmount;
  Flags?: number;
  Sequence?: number;
  TakerPays?: string | IssuedCurrencyAmount;
  TakerGets?: string | IssuedCurrencyAmount;
  Expiration?: number;
  BookDirectory?: string;
  HighLimit?: IssuedCurrencyAmount;
  LowLimit?: IssuedCurrencyAmount;
  [key: string]: unknown;
}

/**
 * Normalized node structure
 */
export interface NormalizedNode {
  diffType: 'CreatedNode' | 'ModifiedNode' | 'DeletedNode';
  entryType: string;
  ledgerIndex: string;
  newFields: NodeFields;
  finalFields: NodeFields;
  previousFields: Partial<NodeFields>;
}

/**
 * Raw affected node from metadata
 */
export interface AffectedNode {
  CreatedNode?: {
    LedgerEntryType: string;
    LedgerIndex: string;
    NewFields?: NodeFields;
  };
  ModifiedNode?: {
    LedgerEntryType: string;
    LedgerIndex: string;
    FinalFields?: NodeFields;
    PreviousFields?: Partial<NodeFields>;
  };
  DeletedNode?: {
    LedgerEntryType: string;
    LedgerIndex: string;
    FinalFields?: NodeFields;
    PreviousFields?: Partial<NodeFields>;
  };
}

/**
 * Raw transaction metadata from ledger (PascalCase format)
 * Use this for parsing metadata from transaction responses
 */
export interface RawMetadata {
  AffectedNodes?: AffectedNode[];
  TransactionIndex?: number;
  TransactionResult?: string;
  delivered_amount?: string | IssuedCurrencyAmount;
}

/**
 * @deprecated Use RawMetadata instead. TransactionMetadata is kept for backward compatibility.
 */
export type TransactionMetadata = RawMetadata;
