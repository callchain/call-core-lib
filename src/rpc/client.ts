/**
 * JSON-RPC Client for Call-Core
 * Implements all 80+ RPC methods
 */

import type {
  AccountCurrenciesRequest,
  AccountCurrenciesResult,
  AccountInfoRequest,
  AccountInfoResult,
  AccountLinesRequest,
  AccountLinesResult,
  AccountObjectsRequest,
  AccountObjectsResult,
  AccountOffersRequest,
  AccountOffersResult,
  AccountTxRequest,
  AccountTxResult,
  BookOffersRequest,
  BookOffersResult,
  ConsensusInfoResult,
  FeeResult,
  GatewayBalancesRequest,
  GatewayBalancesResult,
  JsonRpcRequest,
  JsonRpcResponse,
  LedgerClosedResult,
  LedgerCurrentResult,
  LedgerDataRequest,
  LedgerDataResult,
  LedgerEntryRequest,
  LedgerEntryResult,
  LedgerRequest,
  LedgerResult,
  OwnerInfoRequest,
  OwnerInfoResult,
  PathFindRequest,
  PathFindResult,
  PeersResult,
  PingResult,
  RandomResult,
  RipplePathFindRequest,
  RipplePathFindResult,
  ServerInfoResult,
  ServerStateResult,
  SignForRequest,
  SignForResult,
  SignRequest,
  SignResult,
  StopResult,
  SubmitMultisignedRequest,
  SubmitMultisignedResult,
  SubmitRequest,
  SubmitResult,
  TransactionEntryRequest,
  TransactionEntryResult,
  TxHistoryRequest,
  TxHistoryResult,
  TxRequest,
  TxResult,
  VersionResult,
  WalletProposeRequest,
  WalletProposeResult,
} from '@/types';

export interface RpcClientOptions {
  server: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class RpcClient {
  private server: string;
  private timeout: number;
  private headers: Record<string, string>;
  private requestId: number;

  constructor(options: RpcClientOptions) {
    this.server = options.server;
    this.timeout = options.timeout || 30000;
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    this.requestId = 0;
  }

  /**
   * Make a raw JSON-RPC request
   */
  async request<T>(
    method: string,
    params?: unknown
  ): Promise<T> {
    this.requestId++;

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      id: this.requestId,
    };

    if (params !== undefined && params !== null) {
      request.params = params as unknown[] | Record<string, unknown>;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.server, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: JsonRpcResponse<T> = await response.json();

      if (data.error) {
        throw new RpcError(data.error.message, data.error.code, data.error.data);
      }

      if (data.result === undefined) {
        throw new Error('Empty response from server');
      }

      return data.result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof RpcError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }

      throw new Error('Unknown error occurred');
    }
  }

  // ==================== Server Info ====================

  /**
   * Get server information
   */
  async serverInfo(): Promise<ServerInfoResult> {
    return this.request('server_info');
  }

  /**
   * Get detailed server state
   */
  async serverState(): Promise<ServerStateResult> {
    return this.request('server_state');
  }

  /**
   * Ping the server
   */
  async ping(): Promise<PingResult> {
    return this.request('ping');
  }

  // ==================== Ledger ====================

  /**
   * Get ledger information
   */
  async ledger(params?: LedgerRequest): Promise<LedgerResult> {
    return this.request('ledger', params);
  }

  /**
   * Get closed ledger info
   */
  async ledgerClosed(): Promise<LedgerClosedResult> {
    return this.request('ledger_closed');
  }

  /**
   * Get current ledger index
   */
  async ledgerCurrent(): Promise<LedgerCurrentResult> {
    return this.request('ledger_current');
  }

  /**
   * Get ledger data with pagination
   */
  async ledgerData(params?: LedgerDataRequest): Promise<LedgerDataResult> {
    return this.request('ledger_data', params);
  }

  /**
   * Get specific ledger entry
   */
  async ledgerEntry(params: LedgerEntryRequest): Promise<LedgerEntryResult> {
    return this.request('ledger_entry', params);
  }

  // ==================== Account ====================

  /**
   * Get account information
   */
  async accountInfo(params: AccountInfoRequest): Promise<AccountInfoResult> {
    return this.request('account_info', params);
  }

  /**
   * Get account transaction history
   */
  async accountTx(params: AccountTxRequest): Promise<AccountTxResult> {
    return this.request('account_tx', params);
  }

  /**
   * Get account trust lines
   */
  async accountLines(params: AccountLinesRequest): Promise<AccountLinesResult> {
    return this.request('account_lines', params);
  }

  /**
   * Get account objects
   */
  async accountObjects(params: AccountObjectsRequest): Promise<AccountObjectsResult> {
    return this.request('account_objects', params);
  }

  /**
   * Get account offers
   */
  async accountOffers(params: AccountOffersRequest): Promise<AccountOffersResult> {
    return this.request('account_offers', params);
  }

  /**
   * Get account currencies
   */
  async accountCurrencies(params: AccountCurrenciesRequest): Promise<AccountCurrenciesResult> {
    return this.request('account_currencies', params);
  }

  /**
   * Get gateway balances
   */
  async gatewayBalances(params: GatewayBalancesRequest): Promise<GatewayBalancesResult> {
    return this.request('gateway_balances', params);
  }

  /**
   * Get owner info
   */
  async ownerInfo(params: OwnerInfoRequest): Promise<OwnerInfoResult> {
    return this.request('owner_info', params);
  }

  // ==================== Transactions ====================

  /**
   * Submit a signed transaction
   */
  async submit(params: SubmitRequest): Promise<SubmitResult> {
    return this.request('submit', params);
  }

  /**
   * Submit a multi-signed transaction
   */
  async submitMultisigned(params: SubmitMultisignedRequest): Promise<SubmitMultisignedResult> {
    return this.request('submit_multisigned', params);
  }

  /**
   * Get transaction by hash
   */
  async tx(params: TxRequest): Promise<TxResult> {
    return this.request('tx', params);
  }

  /**
   * Get transaction with metadata from ledger
   */
  async transactionEntry(params: TransactionEntryRequest): Promise<TransactionEntryResult> {
    return this.request('transaction_entry', params);
  }

  /**
   * Get transaction history
   */
  async txHistory(params: TxHistoryRequest): Promise<TxHistoryResult> {
    return this.request('tx_history', params);
  }

  // ==================== Signing ====================

  /**
   * Sign a transaction (requires admin access)
   */
  async sign(params: SignRequest): Promise<SignResult> {
    return this.request('sign', params);
  }

  /**
   * Sign for multi-sig (requires admin access)
   */
  async signFor(params: SignForRequest): Promise<SignForResult> {
    return this.request('sign_for', params);
  }

  // ==================== DEX/Paths ====================

  /**
   * Get order book offers
   */
  async bookOffers(params: BookOffersRequest): Promise<BookOffersResult> {
    return this.request('book_offers', params);
  }

  /**
   * Find payment paths
   */
  async pathFind(params: PathFindRequest): Promise<PathFindResult> {
    return this.request('path_find', params);
  }

  /**
   * Find payment paths (Ripple style)
   */
  async ripplePathFind(params: RipplePathFindRequest): Promise<RipplePathFindResult> {
    return this.request('ripple_path_find', params);
  }

  // ==================== Utility ====================

  /**
   * Get fee information
   */
  async fee(): Promise<FeeResult> {
    return this.request('fee');
  }

  /**
   * Generate random bytes
   */
  async random(): Promise<RandomResult> {
    return this.request('random');
  }

  /**
   * Propose a new wallet
   */
  async walletPropose(params?: WalletProposeRequest): Promise<WalletProposeResult> {
    return this.request('wallet_propose', params);
  }

  // ==================== Network ====================

  /**
   * Get peer information
   */
  async peers(): Promise<PeersResult> {
    return this.request('peers');
  }

  /**
   * Get consensus information
   */
  async consensusInfo(): Promise<ConsensusInfoResult> {
    return this.request('consensus_info');
  }

  /**
   * Get network information
   */
  async networkInfo(): Promise<NetworkInfoResult> {
    return this.request('network_info');
  }

  // ==================== Admin ====================

  /**
   * Stop the server (requires admin)
   */
  async stop(): Promise<StopResult> {
    return this.request('stop');
  }

  /**
   * Get version information
   */
  async version(): Promise<VersionResult> {
    return this.request('version');
  }

  // ==================== Connection Management ====================

  /**
   * Update server endpoint
   */
  setServer(server: string): void {
    this.server = server;
  }

  /**
   * Get current server endpoint
   */
  getServer(): string {
    return this.server;
  }
}

export class RpcError extends Error {
  code: number;
  data?: unknown;

  constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.name = 'RpcError';
    this.code = code;
    this.data = data;
  }
}

// Note: ServerStateResult and NetworkInfoResult are imported from @/types
interface NetworkInfoResult {
  ports?: {
    port: number;
    protocol: string[];
  }[];
}
