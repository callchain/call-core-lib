/**
 * WebSocket Client for Call-Core
 * Supports subscriptions and real-time updates
 */

import WebSocket from 'isomorphic-ws';
import type {
  AccountID,
  LedgerHash,
  LedgerIndex,
  TxHash,
  WsRequest,
  WsMessage,
  WsSuccessResponse,
  WsErrorResponse,
  WsStreamMessage,
  WsLedgerClosedMessage,
  WsTransactionMessage,
  WsValidationMessage,
  WsConsensusMessage,
  WsPeerStatusMessage,
  StreamType,
  SubscribeResult,
  UnsubscribeResult,
  ServerInfoResult,
  LedgerResult,
  AccountInfoResult,
  TxResult,
  SubmitResult,
} from '@/types';

export interface WebSocketClientOptions {
  url: string;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeat?: boolean;
  heartbeatInterval?: number;
  timeout?: number;
}

type MessageCallback = (message: WsStreamMessage) => void;

export class WebSocketClient {
  private url: string;
  private reconnect: boolean;
  private reconnectDelay: number;
  private maxReconnectAttempts: number;
  private heartbeat: boolean;
  private heartbeatInterval: number;
  private timeout: number;

  private ws: WebSocket | null = null;
  private requestId: number = 0;
  private pendingRequests: Map<
    number | string,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  > = new Map();
  private subscriptions: Map<string, Set<MessageCallback>> = new Map();
  private accountSubscriptions: Map<AccountID, Set<MessageCallback>> = new Map();
  private reconnectAttempts: number = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';

  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.reconnect = options.reconnect ?? true;
    this.reconnectDelay = options.reconnectDelay ?? 5000;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
    this.heartbeat = options.heartbeat ?? true;
    this.heartbeatInterval = options.heartbeatInterval ?? 30000;
    this.timeout = options.timeout ?? 30000;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return;
    }

    this.connectionState = 'connecting';

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        const timeoutId = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.timeout);

        this.ws.onopen = () => {
          clearTimeout(timeoutId);
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;

          if (this.heartbeat) {
            this.startHeartbeat();
          }

          // Resubscribe to previous subscriptions
          this.resubscribe().catch(console.error);

          resolve();
        };

        this.ws.onmessage = (event: WebSocket.MessageEvent) => {
          this.handleMessage(event.data as string);
        };

        this.ws.onclose = () => {
          clearTimeout(timeoutId);
          this.connectionState = 'disconnected';
          this.stopHeartbeat();

          if (this.reconnect) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error: WebSocket.ErrorEvent) => {
          clearTimeout(timeoutId);
          reject(new Error(`WebSocket error: ${error.message}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  async disconnect(): Promise<void> {
    this.reconnect = false;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connectionState = 'disconnected';

    // Reject all pending requests
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error('WebSocket disconnected'));
    });
    this.pendingRequests.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    return this.connectionState;
  }

  /**
   * Send a request and wait for response
   */
  private async request<T>(request: WsRequest): Promise<T> {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const id = request.id ?? ++this.requestId;
      request.id = id;

      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      }, this.timeout);

      this.pendingRequests.set(id, {
        resolve: (value: unknown) => {
          clearTimeout(timeoutId);
          resolve(value as T);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      });

      this.ws!.send(JSON.stringify(request));
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message: WsMessage = JSON.parse(data);

      // Handle response messages
      if (message.type === 'response') {
        const response = message as WsSuccessResponse | WsErrorResponse;
        const id = response.id;

        if (id !== undefined && this.pendingRequests.has(id)) {
          const { resolve, reject } = this.pendingRequests.get(id)!;
          this.pendingRequests.delete(id);

          if (response.status === 'success') {
            resolve((response as WsSuccessResponse).result);
          } else {
            const error = response as WsErrorResponse;
            reject(new Error(error.error_message || error.error));
          }
        }
        return;
      }

      // Handle stream messages
      const streamMessage = message as WsStreamMessage;
      this.handleStreamMessage(streamMessage);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle stream messages
   */
  private handleStreamMessage(message: WsStreamMessage): void {
    // Ledger closed
    if (message.type === 'ledgerClosed') {
      const callbacks = this.subscriptions.get('ledger');
      callbacks?.forEach((cb) => cb(message));
      return;
    }

    // Transaction
    if (message.type === 'transaction') {
      const txMessage = message as WsTransactionMessage;

      // General transaction callbacks
      const txCallbacks = this.subscriptions.get('transactions');
      txCallbacks?.forEach((cb) => cb(message));

      // Account-specific callbacks
      const account = txMessage.transaction?.transaction?.account;
      if (account) {
        const accountCallbacks = this.accountSubscriptions.get(account);
        accountCallbacks?.forEach((cb) => cb(message));
      }
      return;
    }

    // Validation
    if (message.type === 'validationReceived') {
      const callbacks = this.subscriptions.get('validations');
      callbacks?.forEach((cb) => cb(message));
      return;
    }

    // Consensus
    if (message.type === 'consensusPhase') {
      const callbacks = this.subscriptions.get('consensus');
      callbacks?.forEach((cb) => cb(message));
      return;
    }

    // Peer status
    if (message.type === 'peerStatusChange') {
      const callbacks = this.subscriptions.get('peer');
      callbacks?.forEach((cb) => cb(message));
      return;
    }
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;

    console.log(`Reconnecting... attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, this.reconnectDelay);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.ping().catch(() => {
        // Ping failed, connection might be dead
        if (this.isConnected()) {
          this.ws?.close();
        }
      });
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Resubscribe to previous subscriptions after reconnection
   */
  private async resubscribe(): Promise<void> {
    const streams: StreamType[] = [];
    this.subscriptions.forEach((_, stream) => {
      if (stream !== 'transactions' && stream !== 'ledger' && stream !== 'validations' &&
          stream !== 'consensus' && stream !== 'peer') {
        return;
      }
      streams.push(stream as StreamType);
    });

    if (streams.length > 0) {
      await this.subscribe({ streams });
    }

    // Resubscribe to accounts
    const accounts = Array.from(this.accountSubscriptions.keys());
    if (accounts.length > 0) {
      await this.subscribe({ accounts });
    }
  }

  // ==================== Subscription Methods ====================

  /**
   * Subscribe to streams
   */
  async subscribe(options: {
    streams?: StreamType[];
    accounts?: AccountID[];
    accounts_proposed?: AccountID[];
    books?: {
      taker_pays: { currency: string; issuer?: AccountID };
      taker_gets: { currency: string; issuer?: AccountID };
      snapshot?: boolean;
      both?: boolean;
    }[];
  }): Promise<SubscribeResult> {
    return this.request({
      command: 'subscribe',
      ...options,
    });
  }

  /**
   * Unsubscribe from streams
   */
  async unsubscribe(options: {
    streams?: StreamType[];
    accounts?: AccountID[];
    accounts_proposed?: AccountID[];
    books?: {
      taker_pays: { currency: string; issuer?: AccountID };
      taker_gets: { currency: string; issuer?: AccountID };
    }[];
  }): Promise<UnsubscribeResult> {
    return this.request({
      command: 'unsubscribe',
      ...options,
    });
  }

  /**
   * Subscribe to ledger stream
   * @returns Unsubscribe function
   */
  onLedger(callback: (message: WsLedgerClosedMessage) => void): () => void {
    const wrapped = (msg: WsStreamMessage) => callback(msg as WsLedgerClosedMessage);

    if (!this.subscriptions.has('ledger')) {
      this.subscriptions.set('ledger', new Set());
      if (this.isConnected()) {
        this.subscribe({ streams: ['ledger'] }).catch(console.error);
      }
    }

    this.subscriptions.get('ledger')!.add(wrapped);

    return () => {
      this.subscriptions.get('ledger')?.delete(wrapped);
    };
  }

  /**
   * Subscribe to transaction stream
   * @returns Unsubscribe function
   */
  onTransaction(callback: (message: WsTransactionMessage) => void): () => void {
    const wrapped = (msg: WsStreamMessage) => callback(msg as WsTransactionMessage);

    if (!this.subscriptions.has('transactions')) {
      this.subscriptions.set('transactions', new Set());
      if (this.isConnected()) {
        this.subscribe({ streams: ['transactions'] }).catch(console.error);
      }
    }

    this.subscriptions.get('transactions')!.add(wrapped);

    return () => {
      this.subscriptions.get('transactions')?.delete(wrapped);
    };
  }

  /**
   * Subscribe to validation stream
   * @returns Unsubscribe function
   */
  onValidation(callback: (message: WsValidationMessage) => void): () => void {
    const wrapped = (msg: WsStreamMessage) => callback(msg as WsValidationMessage);

    if (!this.subscriptions.has('validations')) {
      this.subscriptions.set('validations', new Set());
      if (this.isConnected()) {
        this.subscribe({ streams: ['validations'] }).catch(console.error);
      }
    }

    this.subscriptions.get('validations')!.add(wrapped);

    return () => {
      this.subscriptions.get('validations')?.delete(wrapped);
    };
  }

  /**
   * Subscribe to consensus stream
   * @returns Unsubscribe function
   */
  onConsensus(callback: (message: WsConsensusMessage) => void): () => void {
    const wrapped = (msg: WsStreamMessage) => callback(msg as WsConsensusMessage);

    if (!this.subscriptions.has('consensus')) {
      this.subscriptions.set('consensus', new Set());
      if (this.isConnected()) {
        this.subscribe({ streams: ['consensus'] }).catch(console.error);
      }
    }

    this.subscriptions.get('consensus')!.add(wrapped);

    return () => {
      this.subscriptions.get('consensus')?.delete(wrapped);
    };
  }

  /**
   * Subscribe to peer status stream
   * @returns Unsubscribe function
   */
  onPeerStatus(callback: (message: WsPeerStatusMessage) => void): () => void {
    const wrapped = (msg: WsStreamMessage) => callback(msg as WsPeerStatusMessage);

    if (!this.subscriptions.has('peer')) {
      this.subscriptions.set('peer', new Set());
      if (this.isConnected()) {
        this.subscribe({ streams: ['peer'] }).catch(console.error);
      }
    }

    this.subscriptions.get('peer')!.add(wrapped);

    return () => {
      this.subscriptions.get('peer')?.delete(wrapped);
    };
  }

  /**
   * Subscribe to transactions for specific account
   * @returns Unsubscribe function
   */
  onAccountTransaction(account: AccountID, callback: (message: WsTransactionMessage) => void): () => void {
    const wrapped = (msg: WsStreamMessage) => callback(msg as WsTransactionMessage);

    if (!this.accountSubscriptions.has(account)) {
      this.accountSubscriptions.set(account, new Set());
      if (this.isConnected()) {
        this.subscribe({ accounts: [account] }).catch(console.error);
      }
    }

    this.accountSubscriptions.get(account)!.add(wrapped);

    return () => {
      this.accountSubscriptions.get(account)?.delete(wrapped);
    };
  }

  /**
   * Unsubscribe from all streams
   */
  async unsubscribeAll(): Promise<void> {
    const streams = Array.from(this.subscriptions.keys()) as StreamType[];
    const accounts = Array.from(this.accountSubscriptions.keys());

    if (streams.length > 0 || accounts.length > 0) {
      await this.unsubscribe({
        streams: streams.length > 0 ? streams : undefined,
        accounts: accounts.length > 0 ? accounts : undefined,
      });
    }

    this.subscriptions.clear();
    this.accountSubscriptions.clear();
  }

  // ==================== Command Methods ====================

  /**
   * Ping the server
   */
  async ping(): Promise<{ role?: string }> {
    return this.request({ command: 'ping' });
  }

  /**
   * Get server info
   */
  async serverInfo(): Promise<ServerInfoResult> {
    return this.request({ command: 'server_info' });
  }

  /**
   * Get ledger
   */
  async ledger(options?: {
    ledger_hash?: string;
    ledger_index?: LedgerIndex;
    full?: boolean;
    accounts?: boolean;
    transactions?: boolean;
    expand?: boolean;
    owner_funds?: boolean;
    binary?: boolean;
    queue?: boolean;
  }): Promise<LedgerResult> {
    return this.request({
      command: 'ledger',
      ...options,
    });
  }

  /**
   * Get account info
   */
  async accountInfo(options: {
    account: AccountID;
    strict?: boolean;
    ledger_hash?: LedgerHash;
    ledger_index?: LedgerIndex;
    queue?: boolean;
    signers?: boolean;
  }): Promise<AccountInfoResult> {
    return this.request({
      command: 'account_info',
      ...options,
    });
  }

  /**
   * Get transaction
   */
  async tx(options: {
    transaction: TxHash;
    binary?: boolean;
  }): Promise<TxResult> {
    return this.request({
      command: 'tx',
      ...options,
    });
  }

  /**
   * Submit transaction
   */
  async submit(options: {
    tx_blob: string;
    fail_hard?: boolean;
  }): Promise<SubmitResult> {
    return this.request({
      command: 'submit',
      ...options,
    });
  }
}

export class WebSocketError extends Error {
  code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this.name = 'WebSocketError';
    this.code = code;
  }
}
