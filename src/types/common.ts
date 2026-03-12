/**
 * Common types and interfaces for Call-Core
 */

/**
 * Account ID - typically starts with 'c'
 */
export type AccountID = string;

/**
 * Transaction hash - 64 character hex string
 */
export type TxHash = string;

/**
 * Ledger hash - 64 character hex string
 */
export type LedgerHash = string;

/**
 * Currency code - 3-letter or 20-byte hex
 */
export type Currency = string;

/**
 * Amount in drops (for native CALL) or issued currency format
 */
export type Amount = string | IssuedCurrencyAmount;

/**
 * Issued currency amount structure
 */
export interface IssuedCurrencyAmount {
  value: string;
  currency: Currency;
  issuer: AccountID;
}

/**
 * Native CALL amount (in drops)
 * 1 CALL = 1,000,000 drops
 */
export type Drops = string;

/**
 * Ledger index - can be number or string like "current", "closed", "validated"
 */
export type LedgerIndex = number | 'current' | 'closed' | 'validated';

/**
 * Transaction sequence number
 */
export type Sequence = number;

/**
 * Transaction fee in drops
 */
export type Fee = string;

/**
 * Transaction flags
 */
export type TxFlags = number;

/**
 * Unix timestamp
 */
export type Timestamp = number;

/**
 * Hex string
 */
export type HexString = string;

/**
 * Base58 encoded string
 */
export type Base58String = string;

/**
 * Secret key (seed)
 */
export type Secret = string;

/**
 * Public key (hex)
 */
export type PublicKey = string;

/**
 * Signature (hex)
 */
export type Signature = string;

/**
 * Transaction blob (hex encoded signed transaction)
 */
export type TxBlob = string;

/**
 * Memo structure
 */
export interface Memo {
  memo_type?: HexString;
  memo_data?: HexString;
  memo_format?: HexString;
}

/**
 * Signer entry for multi-sign
 */
export interface SignerEntry {
  account: AccountID;
  weight: number;
}

/**
 * Signer structure for signed transactions
 */
export interface Signer {
  account: AccountID;
  txn_signature: Signature;
  signing_pub_key: PublicKey;
}

/**
 * Path step for payment paths
 */
export interface PathStep {
  account?: AccountID;
  currency?: Currency;
  issuer?: AccountID;
  type?: number;
  type_hex?: HexString;
}

/**
 * Payment path
 */
export type Path = PathStep[];

/**
 * Path set (array of paths)
 */
export type PathSet = Path[];

/**
 * Currency specification
 */
export interface CurrencySpec {
  currency: Currency;
  issuer?: AccountID;
}

/**
 * Book specification for order book
 */
export interface BookSpec {
  taker_pays: Amount;
  taker_gets: Amount;
  taker?: AccountID;
  snapshot?: boolean;
  limit?: number;
}

/**
 * Response status
 */
export type ResponseStatus = 'success' | 'error';

/**
 * Generic API response
 */
export interface ApiResponse<T = unknown> {
  status: ResponseStatus;
  result?: T;
  error?: string;
  error_code?: number;
  error_message?: string;
  id?: number | string;
}

/**
 * Pagination marker
 */
export interface Marker {
  ledger: number;
  seq: number;
}

/**
 * Server state
 */
export type ServerState =
  | 'disconnected'
  | 'connected'
  | 'syncing'
  | 'tracking'
  | 'full';

/**
 * Transaction engine result code
 */
export type EngineResult =
  // Success
  | 'tesSUCCESS'
  // Claimed fee failures
  | 'tecCLAIMED'
  | 'tecPATH_PARTIAL'
  | 'tecUNFUNDED_ADD'
  | 'tecUNFUNDED_OFFER'
  | 'tecUNFUNDED_PAYMENT'
  | 'tecNO_DST'
  | 'tecNO_DST_INSUF_CALL'
  | 'tecNO_LINE_INSUF_RESERVE'
  | 'tecNO_LINE_REDUNDANT'
  | 'tecPATH_DRY'
  | 'tecUNFUNDED'
  | 'tecMASTER_DISABLED'
  | 'tecNO_REGULAR_KEY'
  | 'tecOWNERS'
  | 'tecNO_ISSUER'
  | 'tecNO_AUTH'
  | 'tecNO_LINE'
  | 'tecINSUFF_FEE'
  | 'tecFROZEN'
  | 'tecNO_TARGET'
  | 'tecNO_PERMISSION'
  | 'tecNO_ENTRY'
  | 'tecINSUFFICIENT_RESERVE'
  | 'tecNEED_MASTER_KEY'
  | 'tecDST_TAG_NEEDED'
  | 'tecINTERNAL'
  | 'tecOVERSIZE'
  | 'tecCRYPTOCONDITION_ERROR'
  | 'tecINVARIANT_FAILED'
  | 'tecEXPIRED'
  | 'tecKILLED'
  | 'tecHAS_OBLIGATIONS'
  | 'tecTOO_SOON'
  | 'tecMAX_SEQUENCE_REACHED'
  | 'tecNO_SUITABLE_NFTOKEN_PAGE'
  // Malformed transactions
  | 'temMALFORMED'
  | 'temBAD_AMOUNT'
  | 'temBAD_AUTH_MASTER'
  | 'temBAD_CURRENCY'
  | 'temBAD_EXPIRATION'
  | 'temBAD_FEE'
  | 'temBAD_ISSUER'
  | 'temBAD_LIMIT'
  | 'temBAD_OFFER'
  | 'temBAD_PATH'
  | 'temBAD_PATH_LOOP'
  | 'temBAD_SEND_CALL_LIMIT'
  | 'temBAD_SEQUENCE'
  | 'temBAD_SIGNATURE'
  | 'temBAD_SIGNER'
  | 'temBAD_SRC_ACCOUNT'
  | 'temBAD_TRANSFER_RATE'
  | 'temDST_IS_SRC'
  | 'temDST_NEEDED'
  | 'temINVALID'
  | 'temINVALID_FLAG'
  | 'temREDUNDANT'
  | 'temREDUNDANT_SEND_MAX'
  | 'temRIPPLE_EMPTY'
  | 'temDISABLED'
  | 'temBAD_SIGNER_LIST'
  | 'temBAD_QUORUM'
  | 'temBAD_WEIGHT'
  | 'temBAD_TICK_SIZE'
  | 'temINVALID_ACCOUNT_ID'
  | 'temCANNOT_PREAUTH_SELF'
  // Failed preflight check
  | 'terRETRY'
  | 'terNO_ACCOUNT'
  | 'terNO_AUTH'
  | 'terINSUF_FEE_B'
  | 'terNO_LINE'
  | 'terPRE_SEQ'
  | 'terOWNERS'
  | 'terLAST'
  | 'terNO_RIPPLE'
  | 'terQUEUED';

/**
 * Connection configuration
 */
export interface ConnectionConfig {
  server: string;
  timeout?: number;
  proxy?: string;
}

/**
 * RPC configuration
 */
export interface RpcConfig extends ConnectionConfig {
  headers?: Record<string, string>;
}

/**
 * WebSocket configuration
 */
export interface WebSocketConfig extends ConnectionConfig {
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeat?: boolean;
  heartbeatInterval?: number;
}

/**
 * Client configuration
 */
export interface ClientConfig {
  rpc?: RpcConfig;
  websocket?: WebSocketConfig;
}
