/**
 * Dummy WebSocket Server for Testing
 *
 * Provides a mock WebSocket server that mimics the call-core WebSocket API
 * for testing the WebSocket client without requiring a running devnet.
 *
 * @example
 * ```typescript
 * import { DummyWebSocketServer } from 'call-core-lib/dummy-websocket-server';
 *
 * const server = new DummyWebSocketServer({ port: 9999 });
 * await server.start();
 *
 * // Use with WebSocketClient
 * const client = new WebSocketClient({ url: 'ws://localhost:9999' });
 * await client.connect();
 *
 * // Run tests...
 *
 * await server.stop();
 * ```
 */

import { WebSocketServer, WebSocket } from 'ws';
import type {
  AccountID,
  LedgerIndex,
  TxHash,
  WsRequest,
  WsSuccessResponse,
  WsErrorResponse,
} from '@/types';

export interface DummyWebSocketServerOptions {
  port?: number;
  host?: string;
  ledgerInterval?: number;
  autoGenerateLedgers?: boolean;
}

export interface ServerState {
  ledgerIndex: number;
  ledgerHash: string;
  parentHash: string;
  closeTime: number;
  buildVersion: string;
  serverState: string;
  uptime: number;
  peers: number;
}

/**
 * Dummy WebSocket Server for testing WebSocket client
 */
export class DummyWebSocketServer {
  private port: number;
  private host: string;
  private ledgerInterval: number;
  private autoGenerateLedgers: boolean;

  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private ledgerTimer: NodeJS.Timeout | null = null;

  private state: ServerState;
  private accounts: Map<AccountID, AccountData> = new Map();
  private transactions: Map<TxHash, TransactionData> = new Map();
  private subscriptions: Map<string, Set<WebSocket>> = new Map();
  private accountSubscriptions: Map<AccountID, Set<WebSocket>> = new Map();

  constructor(options: DummyWebSocketServerOptions = {}) {
    this.port = options.port ?? 9999;
    this.host = options.host ?? 'localhost';
    this.ledgerInterval = options.ledgerInterval ?? 5000;
    this.autoGenerateLedgers = options.autoGenerateLedgers ?? true;

    this.state = {
      ledgerIndex: 1,
      ledgerHash: this.generateHash(),
      parentHash: '0000000000000000000000000000000000000000000000000000000000000000',
      closeTime: Math.floor(Date.now() / 1000),
      buildVersion: '0.1.0-dummy',
      serverState: 'full',
      uptime: 0,
      peers: 2,
    };

    // Initialize with genesis accounts
    this.initializeGenesisAccounts();
  }

  /**
   * Start the WebSocket server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({
          host: this.host,
          port: this.port,
        });

        this.wss.on('connection', (ws: WebSocket) => {
          this.handleConnection(ws);
        });

        this.wss.on('error', (error: Error) => {
          reject(error);
        });

        this.wss.on('listening', () => {
          // Get the actual port assigned (in case port was 0)
          const address = this.wss!.address();
          if (typeof address === 'object' && address !== null) {
            this.port = address.port;
          }

          console.log(`Dummy WebSocket server listening on ws://${this.host}:${this.port}`);

          if (this.autoGenerateLedgers) {
            this.startLedgerGeneration();
          }

          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the WebSocket server
   */
  async stop(): Promise<void> {
    this.stopLedgerGeneration();

    // Close all client connections
    this.clients.forEach((client) => {
      client.close();
    });
    this.clients.clear();

    // Close the server
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          console.log('Dummy WebSocket server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get server URL
   */
  getUrl(): string {
    return `ws://${this.host}:${this.port}`;
  }

  /**
   * Get current server state
   */
  getState(): ServerState {
    return { ...this.state };
  }

  /**
   * Add an account to the server
   */
  addAccount(account: AccountID, balance: string, sequence: number = 1): void {
    this.accounts.set(account, {
      account,
      balance,
      sequence,
      ownerCount: 0,
      previousTxnID: '0000000000000000000000000000000000000000000000000000000000000000',
      previousTxnLgrSeq: this.state.ledgerIndex,
    });
  }

  /**
   * Add a transaction to the server
   */
  addTransaction(hash: TxHash, transaction: Record<string, unknown>, meta: Record<string, unknown>): void {
    this.transactions.set(hash, {
      hash,
      transaction,
      meta,
      ledgerIndex: this.state.ledgerIndex,
      date: Math.floor(Date.now() / 1000),
    });
  }

  /**
   * Force close a ledger and notify subscribers
   */
  closeLedger(): void {
    this.state.ledgerIndex++;
    this.state.parentHash = this.state.ledgerHash;
    this.state.ledgerHash = this.generateHash();
    this.state.closeTime = Math.floor(Date.now() / 1000);
    this.state.uptime += this.ledgerInterval / 1000;

    // Notify ledger subscribers
    this.broadcast({
      type: 'ledgerClosed',
      ledger_index: this.state.ledgerIndex,
      ledger_hash: this.state.ledgerHash,
      ledger_time: this.state.closeTime,
      tx_count: Math.floor(Math.random() * 10),
    });
  }

  /**
   * Broadcast a transaction to subscribers
   */
  broadcastTransaction(transaction: Record<string, unknown>, meta: Record<string, unknown>): void {
    const message = {
      type: 'transaction',
      transaction: {
        transaction,
        meta,
      },
      ledger_index: this.state.ledgerIndex,
      ledger_hash: this.state.ledgerHash,
      validated: true,
    };

    // Broadcast to transaction stream subscribers
    const txSubscribers = this.subscriptions.get('transactions');
    if (txSubscribers) {
      txSubscribers.forEach((client) => {
        this.send(client, message);
      });
    }

    // Broadcast to account subscribers
    const account = transaction.account as string;
    if (account) {
      const accountSubscribers = this.accountSubscriptions.get(account);
      if (accountSubscribers) {
        accountSubscribers.forEach((client) => {
          this.send(client, message);
        });
      }
    }
  }

  // ==================== Private Methods ====================

  private handleConnection(ws: WebSocket): void {
    this.clients.add(ws);

    ws.on('message', (data: string | Buffer) => {
      this.handleMessage(ws, data.toString());
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      this.removeSubscriptions(ws);
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  }

  private handleMessage(ws: WebSocket, data: string): void {
    try {
      const request: WsRequest = JSON.parse(data);
      const { id, command } = request;

      switch (command) {
        case 'ping':
          this.sendResponse(ws, id, { role: 'admin' });
          break;

        case 'server_info':
          this.handleServerInfo(ws, id);
          break;

        case 'ledger':
          this.handleLedger(ws, id, request);
          break;

        case 'account_info':
          this.handleAccountInfo(ws, id, request);
          break;

        case 'tx':
          this.handleTx(ws, id, request);
          break;

        case 'submit':
          this.handleSubmit(ws, id, request);
          break;

        case 'subscribe':
          this.handleSubscribe(ws, id, request);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(ws, id, request);
          break;

        default:
          this.sendError(ws, id, 'unknownCmd', `Unknown command: ${command}`);
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
      this.sendError(ws, undefined, 'malformed', 'Malformed request');
    }
  }

  private handleServerInfo(ws: WebSocket, id: number | string | undefined): void {
    this.sendResponse(ws, id, {
      info: {
        build_version: this.state.buildVersion,
        complete_ledgers: `1-${this.state.ledgerIndex}`,
        hostid: 'dummy-server',
        io_latency_ms: 1,
        last_close: {
          converge_time_s: 2,
          proposers: 3,
        },
        load_factor: 1,
        peers: this.state.peers,
        server_state: this.state.serverState,
        state_accounting: {
          connected: { duration_us: '0', transitions: 0 },
          disconnected: { duration_us: '0', transitions: 0 },
          full: { duration_us: '1000000', transitions: 1 },
          syncing: { duration_us: '0', transitions: 0 },
          tracking: { duration_us: '0', transitions: 0 },
        },
        uptime: this.state.uptime,
        validated_ledger: {
          seq: this.state.ledgerIndex,
          hash: this.state.ledgerHash,
        },
        validation_quorum: 3,
      },
    });
  }

  private handleLedger(ws: WebSocket, id: number | string | undefined, request: WsRequest): void {
    const ledgerIndex = ((request as { ledger_index?: LedgerIndex }).ledger_index) || this.state.ledgerIndex;

    this.sendResponse(ws, id, {
      ledger: {
        ledger_index: ledgerIndex.toString(),
        ledger_hash: this.state.ledgerHash,
        parent_hash: this.state.parentHash,
        close_time: this.state.closeTime,
        close_time_resolution: 10,
        closed: true,
        account_hash: this.generateHash(),
        transaction_hash: this.generateHash(),
        total_coins: '100000000000000000',
      },
      validated: true,
    });
  }

  private handleAccountInfo(ws: WebSocket, id: number | string | undefined, request: WsRequest): void {
    const account = (request as { account?: AccountID }).account as AccountID;

    if (!account) {
      this.sendError(ws, id, 'invalidParams', 'Missing account parameter');
      return;
    }

    const accountData = this.accounts.get(account);

    if (!accountData) {
      this.sendError(ws, id, 'actNotFound', `Account not found: ${account}`);
      return;
    }

    this.sendResponse(ws, id, {
      account_data: {
        account: accountData.account,
        balance: accountData.balance,
        sequence: accountData.sequence,
        owner_count: accountData.ownerCount,
        previous_txn_id: accountData.previousTxnID,
        previous_txn_lgr_seq: accountData.previousTxnLgrSeq,
        ledger_entry_type: 'AccountRoot',
        index: this.generateHash(),
      },
      ledger_current_index: this.state.ledgerIndex,
      validated: true,
    });
  }

  private handleTx(ws: WebSocket, id: number | string | undefined, request: WsRequest): void {
    const hash = (request as { transaction?: TxHash }).transaction as TxHash;

    if (!hash) {
      this.sendError(ws, id, 'invalidParams', 'Missing transaction parameter');
      return;
    }

    const txData = this.transactions.get(hash);

    if (!txData) {
      this.sendError(ws, id, 'txnNotFound', `Transaction not found: ${hash}`);
      return;
    }

    this.sendResponse(ws, id, {
      transaction: txData.transaction,
      meta: txData.meta,
      ledger_index: txData.ledgerIndex,
      ledger_hash: this.state.ledgerHash,
      validated: true,
    });
  }

  private handleSubmit(ws: WebSocket, id: number | string | undefined, request: WsRequest): void {
    const txBlob = (request as { tx_blob?: string }).tx_blob as string;

    if (!txBlob) {
      this.sendError(ws, id, 'invalidParams', 'Missing tx_blob parameter');
      return;
    }

    // Generate a fake transaction hash
    const hash = this.generateHash();

    this.sendResponse(ws, id, {
      engine_result: 'tesSUCCESS',
      engine_result_code: 0,
      engine_result_message: 'The transaction was applied. Only final in a validated ledger.',
      tx_blob: txBlob,
      tx_json: {
        hash,
        // Other fields would be decoded from tx_blob
      },
    });
  }

  private handleSubscribe(ws: WebSocket, id: number | string | undefined, request: WsRequest): void {
    const streams = (request as { streams?: string[] }).streams || [];
    const accounts = (request as { accounts?: AccountID[] }).accounts || [];

    // Handle stream subscriptions
    streams.forEach((stream) => {
      if (!this.subscriptions.has(stream)) {
        this.subscriptions.set(stream, new Set());
      }
      this.subscriptions.get(stream)!.add(ws);
    });

    // Handle account subscriptions
    accounts.forEach((account) => {
      if (!this.accountSubscriptions.has(account)) {
        this.accountSubscriptions.set(account, new Set());
      }
      this.accountSubscriptions.get(account)!.add(ws);
    });

    this.sendResponse(ws, id, {
      streams,
      accounts,
    });
  }

  private handleUnsubscribe(ws: WebSocket, id: number | string | undefined, request: WsRequest): void {
    const streams = (request as { streams?: string[] }).streams || [];
    const accounts = (request as { accounts?: AccountID[] }).accounts || [];

    // Handle stream unsubscriptions
    streams.forEach((stream) => {
      this.subscriptions.get(stream)?.delete(ws);
    });

    // Handle account unsubscriptions
    accounts.forEach((account) => {
      this.accountSubscriptions.get(account)?.delete(ws);
    });

    this.sendResponse(ws, id, {
      streams,
      accounts,
    });
  }

  private send(ws: WebSocket, message: Record<string, unknown>): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendResponse(ws: WebSocket, id: number | string | undefined, result: Record<string, unknown>): void {
    const response: WsSuccessResponse = {
      type: 'response',
      id,
      status: 'success',
      result,
    };
    this.send(ws, response as unknown as Record<string, unknown>);
  }

  private sendError(
    ws: WebSocket,
    id: number | string | undefined,
    error: string,
    errorMessage: string,
    code?: number
  ): void {
    const response: WsErrorResponse = {
      type: 'response',
      id,
      status: 'error',
      error,
      error_message: errorMessage,
      error_code: code,
    };
    this.send(ws, response as unknown as Record<string, unknown>);
  }

  private broadcast(message: Record<string, unknown>): void {
    this.clients.forEach((client) => {
      this.send(client, message);
    });
  }

  private removeSubscriptions(ws: WebSocket): void {
    // Remove from stream subscriptions
    this.subscriptions.forEach((subscribers) => {
      subscribers.delete(ws);
    });

    // Remove from account subscriptions
    this.accountSubscriptions.forEach((subscribers) => {
      subscribers.delete(ws);
    });
  }

  private startLedgerGeneration(): void {
    this.stopLedgerGeneration();
    this.ledgerTimer = setInterval(() => {
      this.closeLedger();
    }, this.ledgerInterval);
  }

  private stopLedgerGeneration(): void {
    if (this.ledgerTimer) {
      clearInterval(this.ledgerTimer);
      this.ledgerTimer = null;
    }
  }

  private initializeGenesisAccounts(): void {
    // Add genesis accounts with their initial balances
    const genesisAccounts = [
      { account: 'cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy', balance: '50000000000' },
      { account: 'c3K3xXhvsWBnP3TitQfeg2ihAuaYybvtc7', balance: '10000000000' },
      { account: 'cHSFoKcGXFZdbB7EKmWQMTUJbr66dwfMR1', balance: '100000000000' },
      { account: 'cKKeufyrSZymFeGmtF1Vhi11eCSf2i6MhR', balance: '25000000000' },
      { account: 'cUUsn5u9qPq7MiMiEDwdjMPsHHKyaesHPH', balance: '5000000000' },
    ];

    genesisAccounts.forEach(({ account, balance }) => {
      this.addAccount(account, balance);
    });
  }

  private generateHash(): string {
    return Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

interface AccountData {
  account: AccountID;
  balance: string;
  sequence: number;
  ownerCount: number;
  previousTxnID: string;
  previousTxnLgrSeq: number;
}

interface TransactionData {
  hash: TxHash;
  transaction: Record<string, unknown>;
  meta: Record<string, unknown>;
  ledgerIndex: number;
  date: number;
}

export default DummyWebSocketServer;
