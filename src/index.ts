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
 * // Wallet
 * const wallet = Wallet.generate();
 * console.log('Address:', wallet.address);
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

// Version
export const VERSION = '1.0.0';
