/**
 * WebSocket API types and interfaces
 */

import type { AccountID, LedgerHash, TxHash } from './common';
import type { LedgerHeader, TransactionWithMetadata } from './transactions';
import type { FeeResult, ServerInfoResult } from './rpc';

/**
 * WebSocket command types
 */
export type WsCommand =
  | 'subscribe'
  | 'unsubscribe'
  | 'server_info'
  | 'ledger'
  | 'account_info'
  | 'tx'
  | 'submit'
  | 'ping';

/**
 * Subscription stream types
 */
export type StreamType =
  | 'ledger'
  | 'transactions'
  | 'transaction'
  | 'transactions_proposed'
  | 'validations'
  | 'validation'
  | 'consensus'
  | 'peer'
  | 'manifests'
  | 'server'
  | 'book_changes';

/**
 * Base WebSocket request
 */
export interface WsBaseRequest {
  id?: number | string;
  command: WsCommand;
}

/**
 * Subscribe request
 */
export interface WsSubscribeRequest extends WsBaseRequest {
  command: 'subscribe';
  streams?: StreamType[];
  accounts?: AccountID[];
  accounts_proposed?: AccountID[];
  books?: {
    taker_pays: { currency: string; issuer?: AccountID };
    taker_gets: { currency: string; issuer?: AccountID };
    snapshot?: boolean;
    both?: boolean;
  }[];
}

/**
 * Unsubscribe request
 */
export interface WsUnsubscribeRequest extends WsBaseRequest {
  command: 'unsubscribe';
  streams?: StreamType[];
  accounts?: AccountID[];
  accounts_proposed?: AccountID[];
  books?: {
    taker_pays: { currency: string; issuer?: AccountID };
    taker_gets: { currency: string; issuer?: AccountID };
  }[];
}

/**
 * Server info WebSocket request
 */
export interface WsServerInfoRequest extends WsBaseRequest {
  command: 'server_info';
}

/**
 * Ledger WebSocket request
 */
export interface WsLedgerRequest extends WsBaseRequest {
  command: 'ledger';
  ledger_hash?: string;
  ledger_index?: number | 'current' | 'closed' | 'validated';
  full?: boolean;
  accounts?: boolean;
  transactions?: boolean;
  expand?: boolean;
  owner_funds?: boolean;
  binary?: boolean;
  queue?: boolean;
}

/**
 * Account info WebSocket request
 */
export interface WsAccountInfoRequest extends WsBaseRequest {
  command: 'account_info';
  account: AccountID;
  strict?: boolean;
  ledger_hash?: string;
  ledger_index?: number | 'current' | 'closed' | 'validated';
  queue?: boolean;
  signers?: boolean;
}

/**
 * Transaction WebSocket request
 */
export interface WsTxRequest extends WsBaseRequest {
  command: 'tx';
  transaction: TxHash;
  binary?: boolean;
}

/**
 * Submit WebSocket request
 */
export interface WsSubmitRequest extends WsBaseRequest {
  command: 'submit';
  tx_blob: string;
  fail_hard?: boolean;
}

/**
 * Ping WebSocket request
 */
export interface WsPingRequest extends WsBaseRequest {
  command: 'ping';
}

/**
 * Union type for all WebSocket requests
 */
export type WsRequest =
  | WsSubscribeRequest
  | WsUnsubscribeRequest
  | WsServerInfoRequest
  | WsLedgerRequest
  | WsAccountInfoRequest
  | WsTxRequest
  | WsSubmitRequest
  | WsPingRequest;

/**
 * WebSocket response base
 */
export interface WsBaseResponse {
  id?: number | string;
  status: 'success' | 'error';
  type: 'response' | string;
}

/**
 * WebSocket success response
 */
export interface WsSuccessResponse<T = unknown> extends WsBaseResponse {
  status: 'success';
  type: 'response';
  result: T;
}

/**
 * WebSocket error response
 */
export interface WsErrorResponse extends WsBaseResponse {
  status: 'error';
  type: 'response';
  error: string;
  error_code?: number;
  error_message?: string;
  request?: WsRequest;
}

/**
 * Ledger closed stream message
 */
export interface WsLedgerClosedMessage {
  type: 'ledgerClosed';
  fee_base: number;
  fee_ref: number;
  ledger_hash: LedgerHash;
  ledger_index: number;
  ledger_time: number;
  reserve_base: number;
  reserve_inc: number;
  txn_count: number;
  validated_ledgers: string;
}

/**
 * Transaction stream message
 */
export interface WsTransactionMessage {
  type: 'transaction';
  transaction: TransactionWithMetadata;
  ledger_index?: number;
  ledger_hash?: LedgerHash;
  meta?: {
    affected_nodes: unknown[];
    transaction_index: number;
    transaction_result: string;
    delivered_amount?: string;
  };
  validated?: boolean;
  status?: string;
  engine_result?: string;
  engine_result_code?: number;
  engine_result_message?: string;
}

/**
 * Validation stream message
 */
export interface WsValidationMessage {
  type: 'validationReceived';
  ledger_hash: LedgerHash;
  ledger_index: string;
  signature: string;
  validation_public_key: string;
  full?: boolean;
  flags?: number;
  close_time?: number;
  load_fee?: number;
  reserve_base?: number;
  reserve_inc?: number;
}

/**
 * Consensus phase stream message
 */
export interface WsConsensusMessage {
  type: 'consensusPhase';
  phase: 'open' | 'establish' | 'accept' | 'accepted';
  ledger_index: number;
  ledger_time: number;
  proposers: number;
  consensus: string;
  previous_consensus?: string;
}

/**
 * Peer status change stream message
 */
export interface WsPeerStatusMessage {
  type: 'peerStatusChange';
  action: 'connect' | 'disconnect';
  peer: {
    address: string;
    public_key?: string;
  };
}

/**
 * Path find status message
 */
export interface WsPathFindStatusMessage {
  type: 'path_find_status';
  source_account: AccountID;
  destination_account: AccountID;
  destination_amount: string;
  full_reply: boolean;
}

/**
 * Union type for all WebSocket stream messages
 */
export type WsStreamMessage =
  | WsLedgerClosedMessage
  | WsTransactionMessage
  | WsValidationMessage
  | WsConsensusMessage
  | WsPeerStatusMessage
  | WsPathFindStatusMessage;

/**
 * Union type for all WebSocket messages
 */
export type WsMessage = WsSuccessResponse | WsErrorResponse | WsStreamMessage;

/**
 * WebSocket subscription callback types
 */
export type LedgerClosedCallback = (message: WsLedgerClosedMessage) => void;
export type TransactionCallback = (message: WsTransactionMessage) => void;
export type ValidationCallback = (message: WsValidationMessage) => void;
export type ConsensusCallback = (message: WsConsensusMessage) => void;
export type PeerStatusCallback = (message: WsPeerStatusMessage) => void;

/**
 * WebSocket subscription manager interface
 */
export interface WsSubscriptionManager {
  // Stream subscriptions
  onLedgerClosed: (callback: LedgerClosedCallback) => () => void;
  onTransaction: (callback: TransactionCallback) => () => void;
  onValidation: (callback: ValidationCallback) => () => void;
  onConsensus: (callback: ConsensusCallback) => () => void;
  onPeerStatus: (callback: PeerStatusCallback) => () => void;

  // Account-specific subscriptions
  onAccountTransaction: (
    account: AccountID,
    callback: TransactionCallback
  ) => () => void;

  // Unsubscribe all
  unsubscribeAll: () => Promise<void>;
}

/**
 * WebSocket client state
 */
export type WsClientState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting';

/**
 * WebSocket configuration
 */
export interface WsConfig {
  url: string;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeat?: boolean;
  heartbeatInterval?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Subscribe result
 */
export interface SubscribeResult {
  fee_base?: number;
  fee_ref?: number;
  ledger_hash?: string;
  ledger_index?: number;
  ledger_time?: number;
  reserve_base?: number;
  reserve_inc?: number;
  validated_ledgers?: string;
  server_status?: string;
  load_base?: number;
  load_factor?: number;
}

/**
 * Unsubscribe result
 */
export interface UnsubscribeResult {
  // Empty successful response
}

/**
 * Ping result
 */
export interface PingResult {
  role?: string;
}
