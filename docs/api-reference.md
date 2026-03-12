# API Reference

Complete reference for all call-core-lib exports.

## Table of Contents

- [Types](#types)
- [RPC Client](#rpc-client)
- [WebSocket Client](#websocket-client)
- [Transaction Builders](#transaction-builders)
- [Crypto Functions](#crypto-functions)
- [Utility Functions](#utility-functions)
- [Constants](#constants)

## Types

### Common Types

```typescript
import type {
  AccountID,        // string - Call-Core address (c...)
  TxHash,           // string - 64-char hex transaction hash
  LedgerHash,       // string - 64-char hex ledger hash
  LedgerIndex,      // number | 'current' | 'closed' | 'validated'
  Currency,         // string - 3-letter or 40-char hex
  Amount,           // string | IssuedCurrencyAmount
} from 'call-core-lib';
```

### Issued Currency Amount

```typescript
interface IssuedCurrencyAmount {
  value: string;      // Numeric value as string
  currency: string;   // 3-letter code or 40-char hex
  issuer: string;     // AccountID of issuer
}
```

### Transaction Types

```typescript
import type {
  Transaction,
  Payment,
  AccountSet,
  TrustSet,
  OfferCreate,
  OfferCancel,
  SetRegularKey,
  SignerListSet,
  DepositPreauth,
  TxTypeString,  // 'Payment' | 'AccountSet' | ...
} from 'call-core-lib';
```

## RPC Client

### RpcClient Class

```typescript
class RpcClient {
  constructor(options: RpcClientOptions);

  // Server Info
  serverInfo(): Promise<ServerInfoResult>;
  serverState(): Promise<ServerStateResult>;
  ping(): Promise<PingResult>;

  // Ledger
  ledger(params?: LedgerRequest): Promise<LedgerResult>;
  ledgerClosed(): Promise<LedgerClosedResult>;
  ledgerCurrent(): Promise<LedgerCurrentResult>;
  ledgerData(params?: LedgerDataRequest): Promise<LedgerDataResult>;
  ledgerEntry(params: LedgerEntryRequest): Promise<LedgerEntryResult>;

  // Account
  accountInfo(params: AccountInfoRequest): Promise<AccountInfoResult>;
  accountTx(params: AccountTxRequest): Promise<AccountTxResult>;
  accountLines(params: AccountLinesRequest): Promise<AccountLinesResult>;
  accountObjects(params: AccountObjectsRequest): Promise<AccountObjectsResult>;
  accountOffers(params: AccountOffersRequest): Promise<AccountOffersResult>;
  accountCurrencies(params: AccountCurrenciesRequest): Promise<AccountCurrenciesResult>;
  gatewayBalances(params: GatewayBalancesRequest): Promise<GatewayBalancesResult>;

  // Transactions
  submit(params: SubmitRequest): Promise<SubmitResult>;
  submitMultisigned(params: SubmitMultisignedRequest): Promise<SubmitMultisignedResult>;
  tx(params: TxRequest): Promise<TxResult>;
  transactionEntry(params: TransactionEntryRequest): Promise<TransactionEntryResult>;
  txHistory(params: TxHistoryRequest): Promise<TxHistoryResult>;

  // DEX/Paths
  bookOffers(params: BookOffersRequest): Promise<BookOffersResult>;
  ripplePathFind(params: RipplePathFindRequest): Promise<RipplePathFindResult>;

  // Signing (admin)
  sign(params: SignRequest): Promise<SignResult>;
  signFor(params: SignForRequest): Promise<SignForResult>;

  // Utility
  fee(): Promise<FeeResult>;
  random(): Promise<RandomResult>;
  walletPropose(params?: WalletProposeRequest): Promise<WalletProposeResult>;

  // Network
  peers(): Promise<PeersResult>;
  consensusInfo(): Promise<ConsensusInfoResult>;

  // Management
  setServer(server: string): void;
  getServer(): string;
  request<T>(method: string, params?: unknown): Promise<T>;
}
```

### RpcError Class

```typescript
class RpcError extends Error {
  code: number;
  data?: unknown;
}
```

## WebSocket Client

### WebSocketClient Class

```typescript
class WebSocketClient {
  constructor(options: WebSocketClientOptions);

  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionState(): 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

  // Subscriptions
  subscribe(options: {
    streams?: StreamType[];
    accounts?: AccountID[];
    accounts_proposed?: AccountID[];
    books?: BookSubscription[];
  }): Promise<SubscribeResult>;

  unsubscribe(options: {
    streams?: StreamType[];
    accounts?: AccountID[];
    accounts_proposed?: AccountID[];
    books?: BookSubscription[];
  }): Promise<UnsubscribeResult>;

  unsubscribeAll(): Promise<void>;

  // Event Handlers (return unsubscribe function)
  onLedger(callback: (message: WsLedgerClosedMessage) => void): () => void;
  onTransaction(callback: (message: WsTransactionMessage) => void): () => void;
  onValidation(callback: (message: WsValidationMessage) => void): () => void;
  onConsensus(callback: (message: WsConsensusMessage) => void): () => void;
  onPeerStatus(callback: (message: WsPeerStatusMessage) => void): () => void;
  onAccountTransaction(account: AccountID, callback: (message: WsTransactionMessage) => void): () => void;

  // RPC over WebSocket
  ping(): Promise<{ role?: string }>;
  serverInfo(): Promise<ServerInfoResult>;
  ledger(options?: LedgerRequest): Promise<LedgerResult>;
  accountInfo(options: AccountInfoRequest): Promise<AccountInfoResult>;
  tx(options: TxRequest): Promise<TxResult>;
  submit(options: SubmitRequest): Promise<SubmitResult>;
}
```

### WebSocketClientOptions

```typescript
interface WebSocketClientOptions {
  url: string;                      // Required: ws:// or wss:// URL
  reconnect?: boolean;              // Default: true
  reconnectDelay?: number;          // Default: 5000 (ms)
  maxReconnectAttempts?: number;    // Default: 10
  heartbeat?: boolean;              // Default: true
  heartbeatInterval?: number;       // Default: 30000 (ms)
  timeout?: number;                 // Default: 30000 (ms)
}
```

### WebSocketError Class

```typescript
class WebSocketError extends Error {
  code?: number;
}
```

## Transaction Builders

### TransactionBuilder (Base)

```typescript
class TransactionBuilder {
  constructor(account: AccountID, sequence: number);

  setFee(fee: string): this;
  setFlags(flags: number): this;
  addMemo(memo: Memo): this;
  addTextMemo(text: string): this;
  setLastLedgerSequence(sequence: number): this;
  setSigningPubKey(pubKey: string): this;
  build(): Transaction;
}
```

### PaymentBuilder

```typescript
class PaymentBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number);

  setDestination(destination: AccountID): this;
  setAmount(amount: Amount): this;
  setDestinationTag(tag: number): this;
  setSendMax(amount: Amount): this;
  setInvoiceId(invoiceId: string): this;
  setPartialPayment(): this;
  setNoDirectCall(): this;
}
```

### AccountSetBuilder

```typescript
class AccountSetBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number);

  setDomain(domain: string): this;
  setEmailHash(hash: string): this;
  setMessageKey(key: string): this;
  setTransferRate(rate: number): this;
  setTickSize(size: number): this;
  setFlag(flag: number): this;
  clearFlag(flag: number): this;
  requireDestTag(): this;
  requireAuth(): this;
  disallowCall(): this;
}
```

### TrustSetBuilder

```typescript
class TrustSetBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number);

  setLimitAmount(amount: IssuedCurrencyAmount): this;
  setQualityIn(quality: number): this;
  setQualityOut(quality: number): this;
  setNoCall(): this;
  setFreeze(): this;
}
```

### OfferCreateBuilder

```typescript
class OfferCreateBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number);

  setTakerPays(amount: Amount): this;
  setTakerGets(amount: Amount): this;
  setExpiration(timestamp: number): this;
  setOfferSequence(sequence: number): this;
  setPassive(): this;
  setImmediateOrCancel(): this;
  setFillOrKill(): this;
  setSell(): this;
}
```

### OfferCancelBuilder

```typescript
class OfferCancelBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number);

  setOfferSequence(sequence: number): this;
}
```

### SetRegularKeyBuilder

```typescript
class SetRegularKeyBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number);

  setRegularKey(key: AccountID | null): this;
}
```

### SignerListSetBuilder

```typescript
class SignerListSetBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number);

  setSignerQuorum(quorum: number): this;
  addSigner(account: AccountID, weight: number): this;
  setSignerEntries(entries: SignerEntry[]): this;
}
```

### DepositPreauthBuilder

```typescript
class DepositPreauthBuilder extends TransactionBuilder {
  constructor(account: AccountID, sequence: number);

  authorize(authorized: AccountID): this;
  unauthorize(unauthorized: AccountID): this;
}
```

### createTransaction

```typescript
function createTransaction(
  type: TxTypeString,
  account: AccountID,
  sequence: number
): TransactionBuilder;
```

## Crypto Functions

### Wallet Generation

```typescript
function generateWallet(): {
  seed: string;
  address: string;
  publicKey: string;
  privateKey: string;
};
```

### Key Derivation

```typescript
function generateSeed(): Uint8Array;
function encodeSeed(seed: Uint8Array): string;
function decodeSeed(seed: string): Uint8Array;
function deriveKeypair(seed: Uint8Array): {
  publicKey: string;
  privateKey: string;
};
function deriveAddress(publicKey: string): string;
```

### Signing

```typescript
function sign(messageHex: string, privateKey: string): string;
function verify(messageHex: string, signature: string, publicKey: string): boolean;
```

### Hash Functions

```typescript
function sha256(data: Uint8Array): Uint8Array;
function sha512(data: Uint8Array): Uint8Array;
function sha512Half(data: Uint8Array): Uint8Array;
function ripemd160(data: Uint8Array): Uint8Array;
function doubleSha256(data: Uint8Array): Uint8Array;
function hash160(data: Uint8Array): Uint8Array;
function hmacSha512(key: Uint8Array, data: Uint8Array): Uint8Array;
```

### Base58

```typescript
function encodeBase58(data: Uint8Array): string;
function decodeBase58(data: string): Uint8Array;
function encodeBase58Check(data: Uint8Array, version: Uint8Array): string;
function decodeBase58Check(data: string): {
  version: Uint8Array;
  payload: Uint8Array;
};
```

### Utilities

```typescript
function concatBytes(...arrays: Uint8Array[]): Uint8Array;
```

## Utility Functions

### Amount Utilities

```typescript
function callToDrops(call: string | number): string;
function dropsToCall(drops: string | number): string;
function nativeAmount(call: string | number): string;
function issuedCurrencyAmount(
  value: string | number,
  currency: Currency,
  issuer: string
): IssuedCurrencyAmount;
function isNativeAmount(amount: Amount): amount is string;
function isIssuedCurrency(amount: Amount): amount is IssuedCurrencyAmount;
function parseAmount(amount: Amount): string;
function compareAmounts(a: Amount, b: Amount): number;
function addAmounts(a: Amount, b: Amount): Amount;
function subtractAmounts(a: Amount, b: Amount): Amount;
function percentAmount(amount: Amount, percent: number): Amount;
```

### Currency Utilities

```typescript
function isValidCurrency(currency: string): boolean;
function normalizeCurrency(currency: string): string;
function currencyToHex(currency: string): string;
function hexToCurrency(hex: string): string | null;
```

### Validation

```typescript
function isValidAddress(address: string): boolean;
function isValidSecret(secret: string): boolean;
function isValidTxHash(hash: string): boolean;
function isValidLedgerHash(hash: string): boolean;
function isValidPublicKey(key: string): boolean;
function isValidHex(hex: string, length?: number): boolean;
function isValidAmount(amount: Amount): boolean;
function isValidLedgerIndex(index: LedgerIndex): boolean;
function isValidSequence(sequence: number): boolean;
function isValidUrl(url: string): boolean;
function isValidWsUrl(url: string): boolean;
function isValidDomain(domain: string): boolean;
function isValidQuality(quality: number): boolean;
function isValidSignerWeight(weight: number): boolean;
function isValidSignerQuorum(quorum: number): boolean;
function isValidTickSize(tickSize: number): boolean;
function isValidTransferRate(rate: number): boolean;
```

## Constants

### TxFlags

```typescript
const TxFlags = {
  // Universal
  tfFullyCanonicalSig: 0x80000000,

  // Payment
  tfNoDirectCall: 0x00010000,
  tfPartialPayment: 0x00020000,
  tfLimitQuality: 0x00040000,
  tfNoCallDirect: 0x00080000,

  // AccountSet
  tfRequireDestTag: 0x00010000,
  tfOptionalDestTag: 0x00020000,
  tfRequireAuth: 0x00040000,
  tfOptionalAuth: 0x00080000,
  tfDisallowCall: 0x00100000,
  tfAllowCall: 0x00200000,

  // OfferCreate
  tfPassive: 0x00010000,
  tfImmediateOrCancel: 0x00020000,
  tfFillOrKill: 0x00040000,
  tfSell: 0x00080000,

  // TrustSet
  tfSetAuth: 0x00010000,
  tfSetNoCall: 0x00020000,
  tfClearNoCall: 0x00040000,
  tfSetFreeze: 0x00100000,
  tfClearFreeze: 0x00200000,
} as const;
```

### Amount Constants

```typescript
const CALL_DROPS_PER_CALL = 1000000;
```

### VERSION

```typescript
const VERSION = '1.0.0';
```
