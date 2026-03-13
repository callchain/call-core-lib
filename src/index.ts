/**
 * Call-Core JavaScript/TypeScript Library
 *
 * A comprehensive client library for interacting with Call-Core blockchain.
 * Supports both JSON-RPC and WebSocket APIs.
 *
 * @example
 * ```typescript
 * import { RpcClient, WebSocketClient, Wallet } from 'call-core-lib';
 *
 * // RPC Client
 * const rpc = new RpcClient({ server: 'http://localhost:5005' });
 * const info = await rpc.serverInfo();
 *
 * // WebSocket Client
 * const ws = new WebSocketClient({ url: 'ws://localhost:6005' });
 * await ws.connect();
 * ws.onLedger((ledger) => console.log('New ledger:', ledger));
 *
 * // Wallet with Local Signing
 * const wallet = Wallet.generate();
 * console.log('Address:', wallet.address);
 *
 * // Sign transaction locally (no node required)
 * const signed = wallet.sign(payment);
 * console.log('Tx Blob:', signed.tx_blob);
 * console.log('Hash:', signed.hash);
 *
 * // Submit signed transaction
 * await rpc.submit({ tx_blob: signed.tx_blob });
 * ```
 */

// Types
export * from '@/types';

// Crypto
export * from '@/crypto';

// Utils
export * from '@/utils';

// RPC Client
export { RpcClient, RpcClientOptions, RpcError } from '@/rpc';

// WebSocket Client
export {
  WebSocketClient,
  WebSocketClientOptions,
  WebSocketError,
} from '@/websocket';

// Transactions
export * from '@/transactions';

// Transaction Parser
export {
  parseBalanceChanges,
  parseFinalBalances,
  parseOrderbookChanges,
  getAffectedAccounts,
  parseCurrencyAmount,
  parseQuality,
} from '@/parser';
export type {
  BalanceChange,
  BalanceChanges,
  OrderChange,
  OrderbookChanges,
  ParsedCurrencyAmount,
  NormalizedNode,
  NodeFields,
  AffectedNode,
  RawMetadata,
} from '@/parser';

// Wallet Types
export type { SignedTransaction } from '@/crypto/wallet';
export {
  Wallet,
  signTransaction,
  verifyTransaction,
  decodeTransactionBlob,
  getTransactionHash,
} from '@/crypto/wallet';

export { Serializer } from '@/utils/serializer';

// Version
export const VERSION = '1.0.0';
