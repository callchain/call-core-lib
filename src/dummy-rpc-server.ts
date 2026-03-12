/**
 * Dummy RPC Server for Testing
 *
 * Provides a mock HTTP RPC server that mimics the call-core JSON-RPC API
 * for testing the RpcClient without requiring a running devnet.
 *
 * @example
 * ```typescript
 * import { DummyRpcServer } from 'call-core-lib/dummy-rpc-server';
 *
 * const server = new DummyRpcServer({ port: 9999 });
 * await server.start();
 *
 * // Use with RpcClient
 * const client = new RpcClient({ server: 'http://localhost:9999' });
 * const info = await client.serverInfo();
 *
 * // Run tests...
 *
 * await server.stop();
 * ```
 */

import http from 'http';
import type { AccountID, TxHash } from '@/types';

export interface DummyRpcServerOptions {
  port?: number;
  host?: string;
  autoGenerateLedgers?: boolean;
  ledgerInterval?: number;
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
  validatedLedgers: string;
}

interface AccountData {
  account: AccountID;
  balance: string;
  sequence: number;
  ownerCount: number;
  previousTxnID: string;
  previousTxnLgrSeq: number;
  flags?: number;
}

interface TransactionData {
  hash: TxHash;
  transaction: Record<string, unknown>;
  meta: Record<string, unknown>;
  ledgerIndex: number;
  date: number;
  validated: boolean;
}

interface LedgerData {
  ledgerIndex: number;
  ledgerHash: string;
  parentHash: string;
  closeTime: number;
  closed: boolean;
  transactions: TxHash[];
}

/**
 * Dummy RPC Server for testing RpcClient
 */
export class DummyRpcServer {
  private port: number;
  private host: string;
  private autoGenerateLedgers: boolean;
  private ledgerInterval: number;

  private server: http.Server | null = null;
  private ledgerTimer: NodeJS.Timeout | null = null;

  private state: ServerState;
  private accounts: Map<AccountID, AccountData> = new Map();
  private transactions: Map<TxHash, TransactionData> = new Map();
  private ledgers: Map<number, LedgerData> = new Map();
  private txHistory: TxHash[] = [];

  constructor(options: DummyRpcServerOptions = {}) {
    this.port = options.port ?? 9999;
    this.host = options.host ?? 'localhost';
    this.autoGenerateLedgers = options.autoGenerateLedgers ?? true;
    this.ledgerInterval = options.ledgerInterval ?? 5000;

    this.state = {
      ledgerIndex: 1,
      ledgerHash: this.generateHash(),
      parentHash: '0000000000000000000000000000000000000000000000000000000000000000',
      closeTime: Math.floor(Date.now() / 1000),
      buildVersion: '0.1.0-dummy',
      serverState: 'full',
      uptime: 0,
      peers: 2,
      validatedLedgers: '1',
    };

    // Initialize genesis ledger
    this.ledgers.set(1, {
      ledgerIndex: 1,
      ledgerHash: this.state.ledgerHash,
      parentHash: this.state.parentHash,
      closeTime: this.state.closeTime,
      closed: true,
      transactions: [],
    });

    // Initialize with genesis accounts
    this.initializeGenesisAccounts();
  }

  /**
   * Start the RPC server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = http.createServer((req, res) => {
          this.handleRequest(req, res);
        });

        this.server.on('error', (error: Error) => {
          reject(error);
        });

        this.server.listen(this.port, this.host, () => {
          const address = this.server!.address();
          if (typeof address === 'object' && address !== null) {
            this.port = address.port;
          }

          console.log(`Dummy RPC server listening on http://${this.host}:${this.port}`);

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
   * Stop the RPC server
   */
  async stop(): Promise<void> {
    this.stopLedgerGeneration();

    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Dummy RPC server stopped');
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
    return `http://${this.host}:${this.port}`;
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
      validated: true,
    });
    this.txHistory.push(hash);
  }

  /**
   * Close current ledger and start a new one
   */
  closeLedger(): void {
    const currentLedger = this.ledgers.get(this.state.ledgerIndex);
    if (currentLedger) {
      currentLedger.closed = true;
    }

    this.state.ledgerIndex++;
    this.state.parentHash = this.state.ledgerHash;
    this.state.ledgerHash = this.generateHash();
    this.state.closeTime = Math.floor(Date.now() / 1000);
    this.state.uptime += this.ledgerInterval / 1000;
    this.state.validatedLedgers = `1-${this.state.ledgerIndex}`;

    this.ledgers.set(this.state.ledgerIndex, {
      ledgerIndex: this.state.ledgerIndex,
      ledgerHash: this.state.ledgerHash,
      parentHash: this.state.parentHash,
      closeTime: this.state.closeTime,
      closed: false,
      transactions: [],
    });
  }

  // ==================== Private Methods ====================

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const request = JSON.parse(body);
        this.handleRpcRequest(request, res);
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32700, message: 'Parse error' },
          id: null,
        }));
      }
    });
  }

  private handleRpcRequest(request: Record<string, unknown>, res: http.ServerResponse): void {
    const { id, method, params } = request;

    // Validate JSON-RPC
    if (request.jsonrpc !== '2.0') {
      this.sendError(res, id, -32600, 'Invalid Request');
      return;
    }

    // Route to appropriate handler
    switch (method) {
      case 'ping':
        this.handlePing(res, id);
        break;
      case 'server_info':
        this.handleServerInfo(res, id);
        break;
      case 'ledger':
        this.handleLedger(res, id, params as Record<string, unknown>);
        break;
      case 'account_info':
        this.handleAccountInfo(res, id, params as Array<Record<string, unknown>> | Record<string, unknown>);
        break;
      case 'account_tx':
        this.handleAccountTx(res, id, params as Array<Record<string, unknown>> | Record<string, unknown>);
        break;
      case 'tx':
        this.handleTx(res, id, params as Record<string, unknown>);
        break;
      case 'submit':
        this.handleSubmit(res, id, params as Record<string, unknown>);
        break;
      case 'fee':
        this.handleFee(res, id);
        break;
      default:
        this.sendError(res, id, -32601, `Method not found: ${method}`);
    }
  }

  private handlePing(res: http.ServerResponse, id: unknown): void {
    this.sendResponse(res, id, { role: 'admin' });
  }

  private handleServerInfo(res: http.ServerResponse, id: unknown): void {
    this.sendResponse(res, id, {
      info: {
        build_version: this.state.buildVersion,
        complete_ledgers: this.state.validatedLedgers,
        hostid: 'dummy-server',
        io_latency_ms: 1,
        last_close: {
          converge_time_s: 2,
          proposers: 3,
        },
        load_factor: 1,
        peers: this.state.peers,
        pubkey_node: this.generateHash(),
        server_state: this.state.serverState,
        state_accounting: {
          connected: { duration_us: '0', transitions: 0 },
          disconnected: { duration_us: '0', transitions: 0 },
          full: { duration_us: '1000000', transitions: 1 },
          syncing: { duration_us: '0', transitions: 0 },
          proposing: { duration_us: '0', transitions: 0 },
        },
        uptime: this.state.uptime,
        validated_ledger: {
          age: 3,
          base_fee: 10,
          hash: this.state.ledgerHash,
          reserve_base: 10000000,
          reserve_inc: 2000000,
          seq: this.state.ledgerIndex,
        },
        validation_quorum: 3,
      },
    });
  }

  private handleLedger(res: http.ServerResponse, id: unknown, params?: Record<string, unknown>): void {
    let ledgerIndex = this.state.ledgerIndex;

    if (params) {
      if (params.ledger_index === 'current') {
        ledgerIndex = this.state.ledgerIndex;
      } else if (params.ledger_index === 'validated') {
        // Return the most recently validated ledger (current - 1, or at least 1)
        ledgerIndex = Math.max(1, this.state.ledgerIndex - 1);
      } else if (params.ledger_index === 'closed') {
        ledgerIndex = Math.max(1, this.state.ledgerIndex - 1);
      } else if (typeof params.ledger_index === 'number') {
        ledgerIndex = params.ledger_index;
      }
    }

    const ledger = this.ledgers.get(ledgerIndex);

    if (!ledger) {
      this.sendError(res, id, -32602, 'Ledger not found');
      return;
    }

    // A ledger is validated if it's not the current open ledger
    const isValidated = ledgerIndex < this.state.ledgerIndex || ledger.closed;

    this.sendResponse(res, id, {
      ledger: {
        ledger_index: ledgerIndex.toString(),
        ledger_hash: ledger.ledgerHash,
        parent_hash: ledger.parentHash,
        close_time: ledger.closeTime,
        close_time_resolution: 10,
        closed: ledger.closed,
        account_hash: this.generateHash(),
        transaction_hash: this.generateHash(),
        total_coins: '100000000000000000',
        transactions: (params?.transactions || params?.expand) ? ledger.transactions : undefined,
      },
      validated: isValidated,
    });
  }

  private handleAccountInfo(
    res: http.ServerResponse,
    id: unknown,
    params?: Array<Record<string, unknown>> | Record<string, unknown>
  ): void {
    // Handle both array and object params
    const options = Array.isArray(params) ? params[0] : params;
    const account = options?.account as AccountID;

    if (!account) {
      this.sendError(res, id, -32602, 'Missing account parameter');
      return;
    }

    const accountData = this.accounts.get(account);

    if (!accountData) {
      this.sendError(res, id, -32602, 'Account not found', 'actNotFound');
      return;
    }

    this.sendResponse(res, id, {
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

  private handleAccountTx(
    res: http.ServerResponse,
    id: unknown,
    params?: Array<Record<string, unknown>> | Record<string, unknown>
  ): void {
    const options = Array.isArray(params) ? params[0] : params;
    const account = options?.account as AccountID;

    if (!account) {
      this.sendError(res, id, -32602, 'Missing account parameter');
      return;
    }

    // Find transactions for this account
    const transactions: Array<{ tx: Record<string, unknown>; meta: Record<string, unknown>; validated: boolean }> = [];
    for (const hash of this.txHistory) {
      const txData = this.transactions.get(hash);
      if (txData && (txData.transaction.account === account || txData.transaction.Destination === account)) {
        transactions.push({
          tx: txData.transaction,
          meta: txData.meta,
          validated: txData.validated,
        });
      }
    }

    this.sendResponse(res, id, {
      account: account,
      transactions: transactions,
      ledger_index_min: 1,
      ledger_index_max: this.state.ledgerIndex,
      validated: true,
    });
  }

  private handleTx(res: http.ServerResponse, id: unknown, params?: Record<string, unknown>): void {
    const hash = params?.transaction as TxHash;

    if (!hash) {
      this.sendError(res, id, -32602, 'Missing transaction parameter');
      return;
    }

    const txData = this.transactions.get(hash);

    if (!txData) {
      this.sendError(res, id, -32602, 'Transaction not found', 'txnNotFound');
      return;
    }

    this.sendResponse(res, id, {
      tx: {
        transaction: txData.transaction,
        metadata: txData.meta,
        ledger_index: txData.ledgerIndex,
        validated: txData.validated,
      },
      ledger_index: txData.ledgerIndex,
      ledger_hash: this.state.ledgerHash,
      validated: txData.validated,
    });
  }

  private handleSubmit(res: http.ServerResponse, id: unknown, params?: Record<string, unknown>): void {
    const txBlob = params?.tx_blob as string;

    if (!txBlob) {
      this.sendError(res, id, -32602, 'Missing tx_blob parameter');
      return;
    }

    // Generate a fake transaction hash
    const hash = this.generateHash();

    // Create transaction record
    const transaction = {
      hash,
      tx_blob: txBlob,
      // In a real implementation, we'd decode the tx_blob
    };

    this.addTransaction(hash, transaction, { AffectedNodes: [] });

    // Add to current ledger
    const currentLedger = this.ledgers.get(this.state.ledgerIndex);
    if (currentLedger) {
      currentLedger.transactions.push(hash);
    }

    this.sendResponse(res, id, {
      engine_result: 'tesSUCCESS',
      engine_result_code: 0,
      engine_result_message: 'The transaction was applied. Only final in a validated ledger.',
      tx_blob: txBlob,
      tx_json: transaction,
    });
  }

  private handleFee(res: http.ServerResponse, id: unknown): void {
    this.sendResponse(res, id, {
      current_ledger_size: '14',
      expected_ledger_size: '24',
      ledger_current_index: this.state.ledgerIndex,
      levels: {
        median_level: '256000',
        minimum_level: '128000',
        open_ledger_level: '256000',
        reference_level: '256000',
      },
      max_queue_size: '2000',
      min_queue_size: '100',
      queue_data: [],
      drops: {
        base_fee: '10',
        median_fee: '5000',
        minimum_fee: '10',
        open_ledger_fee: '10',
        reference_fee: '10',
      },
    });
  }

  private sendResponse(res: http.ServerResponse, id: unknown, result: Record<string, unknown>): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      id,
      result,
      status: 'success',
    }));
  }

  private sendError(
    res: http.ServerResponse,
    id: unknown,
    code: number,
    message: string,
    errorName?: string
  ): void {
    const error: Record<string, unknown> = { code, message };
    if (errorName) {
      error.error = errorName;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      id,
      error,
      status: 'error',
    }));
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

export default DummyRpcServer;
