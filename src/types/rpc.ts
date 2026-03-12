/**
 * RPC API types and interfaces
 */

import type {
  AccountID,
  Amount,
  Currency,
  EngineResult,
  IssuedCurrencyAmount,
  LedgerHash,
  LedgerIndex,
  Marker,
  ResponseStatus,
  ServerState,
  TxHash,
} from './common';
import type {
  AccountRoot,
  CallState,
  Ledger,
  LedgerEntry,
  LedgerHeader,
  OfferEntry,
  SignerEntry,
  SignerList,
  Transaction,
  TransactionMetadata,
  TransactionWithMetadata,
} from './transactions';

// ==================== Request Params ====================

/**
 * Base RPC request params
 */
export interface BaseRequestParams {
  [key: string]: unknown;
}

/**
 * Account info request params
 */
export interface AccountInfoRequest {
  account: AccountID;
  strict?: boolean;
  ledger_hash?: LedgerHash;
  ledger_index?: LedgerIndex;
  queue?: boolean;
  signers?: boolean;
}

/**
 * Account transactions request params
 */
export interface AccountTxRequest {
  account: AccountID;
  ledger_index_min?: number;
  ledger_index_max?: number;
  ledger_hash?: LedgerHash;
  ledger_index?: LedgerIndex;
  binary?: boolean;
  forward?: boolean;
  limit?: number;
  marker?: Marker;
}

/**
 * Account lines request params
 */
export interface AccountLinesRequest {
  account: AccountID;
  peer?: AccountID;
  ledger_hash?: LedgerHash;
  ledger_index?: LedgerIndex;
  limit?: number;
  marker?: Marker;
}

/**
 * Account objects request params
 */
export interface AccountObjectsRequest {
  account: AccountID;
  type?: 'check' | 'deposit_preauth' | 'escrow' | 'nft_offer' | 'offer' | 'payment_channel' | 'signer_list' | 'state';
  ledger_hash?: LedgerHash;
  ledger_index?: LedgerIndex;
  limit?: number;
  marker?: Marker;
  deletion_blockers_only?: boolean;
}

/**
 * Account offers request params
 */
export interface AccountOffersRequest {
  account: AccountID;
  ledger_hash?: LedgerHash;
  ledger_index?: LedgerIndex;
  limit?: number;
  marker?: Marker;
}

/**
 * Account currencies request params
 */
export interface AccountCurrenciesRequest {
  account: AccountID;
  ledger_hash?: LedgerHash;
  ledger_index?: LedgerIndex;
}

/**
 * Ledger request params
 */
export interface LedgerRequest {
  ledger_hash?: LedgerHash;
  ledger_index?: LedgerIndex;
  full?: boolean;
  accounts?: boolean;
  transactions?: boolean;
  expand?: boolean;
  owner_funds?: boolean;
  binary?: boolean;
  queue?: boolean;
}

/**
 * Ledger data request params
 */
export interface LedgerDataRequest {
  ledger_hash?: LedgerHash;
  ledger_index?: LedgerIndex;
  binary?: boolean;
  limit?: number;
  marker?: unknown;
  type?: string;
  out_of_order?: boolean;
  diff?: boolean;
}

/**
 * Ledger entry request params
 */
export interface LedgerEntryRequest {
  index?: string;
  account_root?: AccountID;
  directory?: unknown;
  offer?: unknown;
  call_state?: { currency: Currency; accounts: [AccountID, AccountID] };
  signer_list?: AccountID;
  escrow?: unknown;
  payment_channel?: string;
  deposit_preauth?: { owner: AccountID; authorized: AccountID };
  nft_page?: string;
  ledger_hash?: LedgerHash;
  ledger_index?: LedgerIndex;
  binary?: boolean;
}

/**
 * Submit request params
 */
export interface SubmitRequest {
  tx_blob: string;
  fail_hard?: boolean;
}

/**
 * Submit multi-signed request params
 */
export interface SubmitMultisignedRequest {
  tx_json: Transaction;
  fail_hard?: boolean;
}

/**
 * Transaction request params
 */
export interface TxRequest {
  transaction: TxHash;
  binary?: boolean;
  min_ledger?: number;
  max_ledger?: number;
}

/**
 * Transaction entry request params
 */
export interface TransactionEntryRequest {
  tx_hash: TxHash;
  ledger_hash: LedgerHash;
  ledger_index: LedgerIndex;
}

/**
 * Tx history request params
 */
export interface TxHistoryRequest {
  start: number;
}

/**
 * Sign request params
 */
export interface SignRequest {
  tx_json: Transaction;
  secret?: string;
  seed?: string;
  seed_hex?: string;
  passphrase?: string;
  key_type?: 'secp256k1' | 'ed25519';
  offline?: boolean;
  fee_mult_max?: number;
  fee_div_max?: number;
}

/**
 * Sign for request params
 */
export interface SignForRequest extends SignRequest {
  account: AccountID;
}

/**
 * Book offers request params
 */
export interface BookOffersRequest {
  taker_gets: { currency: Currency; issuer?: AccountID };
  taker_pays: { currency: Currency; issuer?: AccountID };
  taker?: AccountID;
  ledger_hash?: LedgerHash;
  ledger_index?: LedgerIndex;
  limit?: number;
  marker?: Marker;
}

/**
 * Path find request params
 */
export interface PathFindRequest {
  source_account: AccountID;
  destination_account: AccountID;
  destination_amount: Amount;
  send_max?: Amount;
  paths?: unknown[][];
  ledger_hash?: LedgerHash;
  ledger_index?: LedgerIndex;
}

/**
 * Ripple path find request params
 */
export interface RipplePathFindRequest {
  source_account: AccountID;
  destination_account: AccountID;
  destination_amount: Amount;
  source_currencies?: { currency: Currency; issuer?: AccountID }[];
  ledger_hash?: LedgerHash;
  ledger_index?: LedgerIndex;
}

/**
 * Wallet propose request params
 */
export interface WalletProposeRequest {
  passphrase?: string;
  seed?: string;
  seed_hex?: string;
  key_type?: 'secp256k1' | 'ed25519';
}

/**
 * Gateway balances request params
 */
export interface GatewayBalancesRequest {
  account: AccountID;
  strict?: boolean;
  hotwallet?: AccountID | AccountID[];
  ledger_hash?: LedgerHash;
  ledger_index?: LedgerIndex;
}

/**
 * No admin rippling request params
 */
export interface NoAdminRipplingRequest {
  account: AccountID;
}

/**
 * Owner info request params
 */
export interface OwnerInfoRequest {
  account: AccountID;
  ledger_hash?: LedgerHash;
  ledger_index?: LedgerIndex;
  queue?: boolean;
}

/**
 * Channel authorize request params
 */
export interface ChannelAuthorizeRequest {
  channel_id: string;
  amount: string;
  secret?: string;
  seed?: string;
  seed_hex?: string;
  passphrase?: string;
  key_type?: 'secp256k1' | 'ed25519';
}

/**
 * Channel verify request params
 */
export interface ChannelVerifyRequest {
  amount: string;
  channel_id: string;
  public_key: string;
  signature: string;
}

// ==================== Response Results ====================

/**
 * Server info response
 */
export interface ServerInfoResult {
  info: {
    build_version: string;
    complete_ledgers: string;
    hostid?: string;
    io_latency_ms: number;
    last_close: {
      converge_time_s: number;
      proposers: number;
    };
    load_factor: number;
    peers: number;
    pubkey_node?: string;
    server_state: ServerState;
    server_state_duration_us?: string;
    state_accounting: Record<
      ServerState,
      { duration_us: string; transitions: number }
    >;
    time?: string;
    uptime: number;
    validated_ledger: {
      age: number;
      base_fee: number;
      hash: string;
      reserve_base: number;
      reserve_inc: number;
      seq: number;
    } | null;
    validation_quorum?: number;
  };
}

/**
 * Server state response
 */
export interface ServerStateResult {
  state: {
    build_version: string;
    complete_ledgers: string;
    io_latency_ms: number;
    load_base: number;
    load_factor: number;
    load_factor_fee_escalation: number;
    load_factor_fee_queue: number;
    load_factor_fee_reference: number;
    load_factor_server: number;
    peers: number;
    server_state: ServerState;
    state_accounting: Record<
      ServerState,
      { duration_us: string; transitions: number }
    >;
    validated_ledger: {
      base_fee: number;
      close_time: number;
      hash: string;
      reserve_base: number;
      reserve_inc: number;
      seq: number;
    };
    validation_quorum: number;
  };
}

/**
 * Account info response
 */
export interface AccountInfoResult {
  account_data: AccountRoot;
  signer_lists?: SignerList[];
  ledger_current_index?: number;
  ledger_index?: number;
  queue_data?: {
    txn_count: number;
    auth_change_queued?: boolean;
    lowest_sequence?: number;
    highest_sequence?: number;
    max_spend_drops_total?: string;
    transactions?: unknown[];
  };
  validated?: boolean;
}

/**
 * Account lines response
 */
export interface AccountLinesResult {
  account: AccountID;
  lines: {
    account: AccountID;
    balance: string;
    currency: Currency;
    limit: string;
    limit_peer: string;
    quality_in: number;
    quality_out: number;
    no_call_direct?: boolean;
    freeze?: boolean;
    freeze_peer?: boolean;
  }[];
  ledger_current_index?: number;
  ledger_index?: number;
  marker?: Marker;
  validated?: boolean;
}

/**
 * Account objects response
 */
export interface AccountObjectsResult {
  account: AccountID;
  account_objects: LedgerEntry[];
  ledger_current_index?: number;
  ledger_index?: number;
  marker?: Marker;
  limit?: number;
  validated?: boolean;
}

/**
 * Account offers response
 */
export interface AccountOffersResult {
  account: AccountID;
  offers: {
    seq: number;
    flags: number;
    taker_gets: Amount;
    taker_pays: Amount;
    expiration?: number;
  }[];
  ledger_current_index?: number;
  ledger_index?: number;
  marker?: Marker;
  validated?: boolean;
}

/**
 * Account transactions response
 */
export interface AccountTxResult {
  account: AccountID;
  transactions: {
    meta?: TransactionMetadata;
    tx?: TransactionWithMetadata;
    tx_blob?: string;
    validated?: boolean;
  }[];
  ledger_index_min?: number;
  ledger_index_max?: number;
  marker?: {
    ledger: number;
    seq: number;
  };
  limit?: number;
  offset?: number;
  validated?: boolean;
}

/**
 * Account currencies response
 */
export interface AccountCurrenciesResult {
  ledger_hash?: string;
  ledger_index?: number;
  receive_currencies: Currency[];
  send_currencies: Currency[];
  validated?: boolean;
}

/**
 * Gateway balances response
 */
export interface GatewayBalancesResult {
  account: AccountID;
  obligations?: Record<Currency, string>;
  balances?: Record<AccountID, IssuedCurrencyAmount[]>;
  assets?: Record<AccountID, IssuedCurrencyAmount[]>;
  hotwallets?: AccountID[];
  ledger_current_index?: number;
  ledger_index?: number;
  validated?: boolean;
}

/**
 * Ledger response
 */
export interface LedgerResult {
  ledger: Ledger;
  ledger_hash?: string;
  ledger_index?: number;
  validated?: boolean;
  queue_data?: unknown;
}

/**
 * Ledger closed response
 */
export interface LedgerClosedResult {
  ledger_hash: LedgerHash;
  ledger_index: number;
}

/**
 * Ledger current response
 */
export interface LedgerCurrentResult {
  ledger_current_index: number;
}

/**
 * Ledger data response
 */
export interface LedgerDataResult {
  ledger_hash: LedgerHash;
  ledger_index: number;
  validated?: boolean;
  state?: {
    data?: string;
    index: string;
  }[];
  marker?: unknown;
}

/**
 * Ledger entry response
 */
export interface LedgerEntryResult {
  index: string;
  ledger_hash?: LedgerHash;
  ledger_index?: number;
  node_binary?: string;
  node?: LedgerEntry;
  validated?: boolean;
}

/**
 * Submit response
 */
export interface SubmitResult {
  engine_result: EngineResult;
  engine_result_code: number;
  engine_result_message: string;
  tx_blob: string;
  tx_json?: Transaction;
}

/**
 * Submit multi-signed response
 */
export interface SubmitMultisignedResult extends SubmitResult {}

/**
 * Transaction response
 */
export interface TxResult {
  tx: TransactionWithMetadata;
  ledger_index?: number;
  ledger_hash?: LedgerHash;
  meta?: TransactionMetadata;
  validated?: boolean;
  inLedger?: number;
  in_ledgers?: number[];
  status?: ResponseStatus;
}

/**
 * Transaction entry response
 */
export interface TransactionEntryResult {
  tx_json: TransactionWithMetadata;
  metadata?: TransactionMetadata;
  ledger_hash: LedgerHash;
  ledger_index: number;
  validated?: boolean;
}

/**
 * Tx history response
 */
export interface TxHistoryResult {
  index: number;
  transactions: (string | { tx: TransactionWithMetadata })[];
}

/**
 * Sign response
 */
export interface SignResult {
  tx_blob: string;
  tx_json: Transaction;
}

/**
 * Sign for response
 */
export interface SignForResult extends SignResult {}

/**
 * Book offers response
 */
export interface BookOffersResult {
  ledger_current_index?: number;
  ledger_index?: number;
  ledger_hash?: string;
  offers: {
    account: AccountID;
    book_directory: string;
    book_node: string;
    flags: number;
    ledger_entry_type: string;
    owner_node: string;
    previous_txn_id: string;
    previous_txn_lgr_seq: number;
    sequence: number;
    taker_gets: Amount;
    taker_pays: Amount;
    index: string;
    quality?: string;
    expiration?: number;
  }[];
  marker?: Marker;
  validated?: boolean;
}

/**
 * Path find response
 */
export interface PathFindResult {
  alternatives: {
    paths_computed?: unknown[][];
    source_amount: Amount;
    destination_amount?: Amount;
    paths_canonical?: unknown[][];
    paths_expanded?: unknown[][];
  }[];
  destination_account: AccountID;
  destination_amount: Amount;
  source_account: AccountID;
  full_reply?: boolean;
  id?: number;
}

/**
 * Ripple path find response
 */
export interface RipplePathFindResult {
  alternatives: {
    paths_computed: unknown[][];
    source_amount: Amount;
  }[];
  destination_account: AccountID;
  destination_amount: Amount;
  destination_currencies?: Currency[];
  source_account: AccountID;
}

/**
 * Fee response
 */
export interface FeeResult {
  current_ledger_size: string;
  current_queue_size: string;
  expected_ledger_size: string;
  minimum_tx_cost: string;
  open_ledger_fee: string;
  drops: {
    base_fee: string;
    median_fee: string;
    minimum_fee: string;
    open_ledger_fee: string;
  };
  levels: {
    median_level: string;
    minimum_level: string;
    open_ledger_level: string;
    reference_level: string;
  };
  max_queue_size: string;
  status?: ResponseStatus;
}

/**
 * Wallet propose response
 */
export interface WalletProposeResult {
  account_id: AccountID;
  key_type: 'secp256k1' | 'ed25519';
  master_key?: string;
  master_seed: string;
  master_seed_hex: string;
  public_key: string;
  public_key_hex: string;
  warning?: string;
}

/**
 * Wallet seed response
 */
export interface WalletSeedResult {
  key_type?: 'secp256k1' | 'ed25519';
  master_seed?: string;
  master_seed_hex?: string;
  master_key?: string;
  public_key?: string;
  public_key_hex?: string;
}

/**
 * Wallet verify response
 */
export interface WalletVerifyResult {
  signature_verified: boolean;
}

/**
 * Validation create response
 */
export interface ValidationCreateResult {
  validation_key?: string;
  validation_seed?: string;
  validation_public_key?: string;
  validation_seed_hex?: string;
  validation_private_key?: string;
}

/**
 * Consensus info response
 */
export interface ConsensusInfoResult {
  info: {
    consensus?: string;
    efc?: number;
    epc?: number;
    fc?: number;
    pc?: number;
    proposers?: number;
    phase?: string;
    synched?: boolean;
    valid?: boolean;
  };
}

/**
 * Peer info
 */
export interface PeerInfo {
  address: string;
  complete_ledgers?: string;
  latency: number;
  load?: number;
  public_key?: string;
  inbound?: boolean;
  protocol?: string;
  last_close?: {
    converge_time: number;
    proposers: number;
  };
  version?: string;
}

/**
 * Peers response
 */
export interface PeersResult {
  cluster?: {
    [key: string]: {
      tag?: string;
      fee?: number;
      expiration?: string;
    };
  };
  peers: PeerInfo[];
}

/**
 * Network info response
 */
export interface NetworkInfoResult {
  ports?: {
    port: number;
    protocol: string[];
  }[];
}

/**
 * Channel authorize response
 */
export interface ChannelAuthorizeResult {
  signature: string;
}

/**
 * Channel verify response
 */
export interface ChannelVerifyResult {
  signature_verified: boolean;
}

/**
 * Random response
 */
export interface RandomResult {
  random: string;
}

/**
 * Version response
 */
export interface VersionResult {
  first: number;
  good: number;
  last: number;
}

/**
 * Owner info response
 */
export interface OwnerInfoResult {
  validated?: boolean;
  account: string;
  index?: string;
  ledger_current_index?: number;
  ledger_index?: number;
  owner_count: number;
  queue_data?: unknown;
  signer_lists?: SignerList[];
}

/**
 * Ping response
 */
export interface PingResult {
  role?: 'admin' | 'proposing' | 'observing';
  unlimited?: boolean;
}

/**
 * Stop response
 */
export interface StopResult {
  message: 'call-core stopping.';
}

// ==================== JSON-RPC Request/Response ====================

/**
 * JSON-RPC 2.0 request
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown[] | Record<string, unknown>;
  id?: number | string | null;
}

/**
 * JSON-RPC 2.0 response
 */
export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id?: number | string | null;
}

/**
 * RPC method mapping for type-safe requests
 */
export interface RpcMethods {
  // Server info
  server_info: { params: undefined; result: ServerInfoResult };
  server_state: { params: undefined; result: ServerStateResult };
  ping: { params: undefined; result: PingResult };

  // Ledger
  ledger: { params: LedgerRequest; result: LedgerResult };
  ledger_closed: { params: undefined; result: LedgerClosedResult };
  ledger_current: { params: undefined; result: LedgerCurrentResult };
  ledger_data: { params: LedgerDataRequest; result: LedgerDataResult };
  ledger_entry: { params: LedgerEntryRequest; result: LedgerEntryResult };

  // Account
  account_info: { params: AccountInfoRequest; result: AccountInfoResult };
  account_tx: { params: AccountTxRequest; result: AccountTxResult };
  account_lines: { params: AccountLinesRequest; result: AccountLinesResult };
  account_objects: { params: AccountObjectsRequest; result: AccountObjectsResult };
  account_offers: { params: AccountOffersRequest; result: AccountOffersResult };
  account_currencies: { params: AccountCurrenciesRequest; result: AccountCurrenciesResult };
  gateway_balances: { params: GatewayBalancesRequest; result: GatewayBalancesResult };
  owner_info: { params: OwnerInfoRequest; result: OwnerInfoResult };

  // Transactions
  submit: { params: SubmitRequest; result: SubmitResult };
  submit_multisigned: { params: SubmitMultisignedRequest; result: SubmitMultisignedResult };
  tx: { params: TxRequest; result: TxResult };
  transaction_entry: { params: TransactionEntryRequest; result: TransactionEntryResult };
  tx_history: { params: TxHistoryRequest; result: TxHistoryResult };

  // Signing
  sign: { params: SignRequest; result: SignResult };
  sign_for: { params: SignForRequest; result: SignForResult };

  // DEX/Paths
  book_offers: { params: BookOffersRequest; result: BookOffersResult };
  path_find: { params: PathFindRequest; result: PathFindResult };
  ripple_path_find: { params: RipplePathFindRequest; result: RipplePathFindResult };

  // Utility
  fee: { params: undefined; result: FeeResult };
  random: { params: undefined; result: RandomResult };

  // Wallet
  wallet_propose: { params: WalletProposeRequest; result: WalletProposeResult };

  // Network
  peers: { params: undefined; result: PeersResult };
  network_info: { params: undefined; result: NetworkInfoResult };
  consensus_info: { params: undefined; result: ConsensusInfoResult };

  // Admin
  stop: { params: undefined; result: StopResult };
  version: { params: undefined; result: VersionResult };
}
