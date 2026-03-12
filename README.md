# Call-Core JavaScript/TypeScript Library

A comprehensive TypeScript/JavaScript client library for interacting with the Call-Core blockchain. Supports both JSON-RPC and WebSocket APIs, works in Node.js and browsers.

## Features

- 🔌 **JSON-RPC Client** - Complete implementation of all 80+ Call-Core RPC methods
- 🌐 **WebSocket Client** - Real-time subscriptions with auto-reconnection
- 💰 **Crypto Utilities** - Native address codec, keypair generation, signing (secp256k1)
- 🏗️ **Transaction Builder** - Type-safe transaction construction with fluent API
- 📦 **No External Dependencies** - Uses standard npm crypto libraries (elliptic, hash.js)
- 🌐 **Universal** - Works in Node.js and browsers
- 📘 **TypeScript** - Full TypeScript support with comprehensive types

## Installation

```bash
npm install call-core-lib
```

## Quick Start

### RPC Client

```typescript
import { RpcClient } from 'call-core-lib';

const client = new RpcClient({
  server: 'http://localhost:5005',
  timeout: 30000,
});

// Get server info
const info = await client.serverInfo();
console.log('Server state:', info.info.server_state);

// Get account info
const account = await client.accountInfo({
  account: 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
});
console.log('Balance:', account.account_data.balance);
```

### WebSocket Client

```typescript
import { WebSocketClient } from 'call-core-lib';

const ws = new WebSocketClient({
  url: 'ws://localhost:6005',
  reconnect: true,
  heartbeat: true,
});

await ws.connect();

// Subscribe to new ledgers
const unsubscribe = ws.onLedger((ledger) => {
  console.log('New ledger:', ledger.ledger_index);
});

// Subscribe to transactions for an account
ws.onAccountTransaction('cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy', (tx) => {
  console.log('New transaction:', tx.transaction);
});

// Later: unsubscribe
unsubscribe();
```

### Wallet Generation

```typescript
import { generateWallet, isValidAddress } from 'call-core-lib';

// Generate a new wallet
const wallet = generateWallet();

console.log('Seed:', wallet.seed);
console.log('Address:', wallet.address);
console.log('Public Key:', wallet.publicKey);
console.log('Private Key:', wallet.privateKey);

// Validate address
console.log('Is valid:', isValidAddress(wallet.address));
```

### Transaction Building

```typescript
import {
  PaymentBuilder,
  TrustSetBuilder,
  callToDrops,
} from 'call-core-lib';

// Build a payment transaction
const payment = new PaymentBuilder('cSender...', 1)
  .setDestination('cDestination...')
  .setAmount(callToDrops('10')) // 10 CALL
  .setFee('100')
  .addTextMemo('Hello!')
  .build();

// Build a trust set transaction
const trustSet = new TrustSetBuilder('cAccount...', 2)
  .setLimitAmount({
    currency: 'USD',
    issuer: 'cIssuer...',
    value: '10000',
  })
  .setFee('100')
  .build();
```

## RPC Methods

### Server Info
- `serverInfo()` - Get server information
- `serverState()` - Get detailed server state
- `ping()` - Ping the server

### Ledger
- `ledger()` - Get ledger information
- `ledgerClosed()` - Get closed ledger info
- `ledgerCurrent()` - Get current ledger index
- `ledgerData()` - Get ledger data with pagination
- `ledgerEntry()` - Get specific ledger entry

### Account
- `accountInfo()` - Get account information
- `accountTx()` - Get account transactions
- `accountLines()` - Get account trust lines
- `accountObjects()` - Get account objects
- `accountOffers()` - Get account offers
- `accountCurrencies()` - Get account currencies
- `gatewayBalances()` - Get gateway balances

### Transactions
- `submit()` - Submit signed transaction
- `submitMultisigned()` - Submit multi-signed transaction
- `tx()` - Get transaction by hash
- `transactionEntry()` - Get transaction from ledger
- `txHistory()` - Get transaction history

### DEX/Paths
- `bookOffers()` - Get order book offers
- `pathFind()` - Find payment paths
- `ripplePathFind()` - Ripple-style path finding

### Signing (requires admin)
- `sign()` - Sign transaction
- `signFor()` - Sign for multi-sig

### Utility
- `fee()` - Get fee information
- `random()` - Generate random bytes
- `walletPropose()` - Generate wallet

### Network
- `peers()` - Get peer information
- `consensusInfo()` - Get consensus info

## WebSocket Subscriptions

### Available Streams
- `ledger` - New validated ledgers
- `transactions` - New transactions
- `validations` - Consensus validations
- `consensus` - Consensus phase updates
- `peer` - Peer status changes

### Event Handlers

```typescript
// Ledger stream
ws.onLedger((ledger) => {
  console.log('Ledger:', ledger.ledger_index);
  console.log('Hash:', ledger.ledger_hash);
});

// Transaction stream
ws.onTransaction((tx) => {
  console.log('Transaction:', tx.transaction);
  console.log('Validated:', tx.validated);
});

// Validation stream
ws.onValidation((validation) => {
  console.log('Validation:', validation.ledger_hash);
});

// Account-specific transactions
ws.onAccountTransaction('cAccount...', (tx) => {
  console.log('Account transaction:', tx);
});
```

## Transaction Types

### Payment
```typescript
const tx = new PaymentBuilder(account, sequence)
  .setDestination('cDestination...')
  .setAmount('1000000') // in drops
  .setDestinationTag(12345)
  .setPartialPayment() // flag
  .build();
```

### AccountSet
```typescript
const tx = new AccountSetBuilder(account, sequence)
  .setDomain('example.com')
  .setEmailHash('...')
  .setTransferRate(1000000001)
  .requireDestTag()
  .disallowCall()
  .build();
```

### TrustSet
```typescript
const tx = new TrustSetBuilder(account, sequence)
  .setLimitAmount({
    currency: 'USD',
    issuer: 'cIssuer...',
    value: '10000',
  })
  .setQualityIn(1000000000)
  .setNoCall()
  .build();
```

### OfferCreate
```typescript
const tx = new OfferCreateBuilder(account, sequence)
  .setTakerPays('1000000')
  .setTakerGets({
    currency: 'USD',
    issuer: 'cIssuer...',
    value: '100',
  })
  .setExpiration(timestamp)
  .setPassive()
  .setSell()
  .build();
```

### OfferCancel
```typescript
const tx = new OfferCancelBuilder(account, sequence)
  .setOfferSequence(123)
  .build();
```

### SetRegularKey
```typescript
const tx = new SetRegularKeyBuilder(account, sequence)
  .setRegularKey('cNewKey...')
  .build();
```

### SignerListSet
```typescript
const tx = new SignerListSetBuilder(account, sequence)
  .setSignerQuorum(2)
  .addSigner('cSigner1...', 1)
  .addSigner('cSigner2...', 1)
  .build();
```

### DepositPreauth
```typescript
const tx = new DepositPreauthBuilder(account, sequence)
  .authorize('cAuthorized...')
  .build();
```

## Amount Utilities

```typescript
import {
  callToDrops,
  dropsToCall,
  nativeAmount,
  issuedCurrencyAmount,
  isNativeAmount,
  isIssuedCurrency,
} from 'call-core-lib';

// Convert CALL to drops
const drops = callToDrops('1.5'); // "1500000"

// Convert drops to CALL
const call = dropsToCall('1500000'); // "1.5"

// Create native amount
const native = nativeAmount('10'); // "10000000"

// Create issued currency amount
const issued = issuedCurrencyAmount(
  '100',
  'USD',
  'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy'
);
// { value: "100", currency: "USD", issuer: "c..." }
```

## Crypto Utilities

```typescript
import {
  generateSeed,
  encodeSeed,
  decodeSeed,
  deriveKeypair,
  deriveAddress,
  sign,
  verify,
  sha256,
  sha512,
  sha512Half,
  encodeBase58,
  decodeBase58,
  encodeBase58Check,
  decodeBase58Check,
} from 'call-core-lib';

// Generate seed
const seed = generateSeed();

// Encode/decode seed
const seedString = encodeSeed(seed); // "s..."
const decoded = decodeSeed(seedString);

// Derive keypair
const keypair = deriveKeypair(seed);
const address = deriveAddress(keypair.publicKey);

// Sign and verify
const message = '...';
const signature = sign(message, keypair.privateKey);
const valid = verify(message, signature, keypair.publicKey);

// Hash functions
const hash = sha256(data);
const halfHash = sha512Half(data);

// Base58
const encoded = encodeBase58(data);
const decoded58 = decodeBase58(encoded);
```

## Validation Utilities

```typescript
import {
  isValidAddress,
  isValidSecret,
  isValidTxHash,
  isValidLedgerHash,
  isValidCurrency,
  isValidAmount,
} from 'call-core-lib';

isValidAddress('cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy'); // true
isValidSecret('ss9e7tg3C4NJ3zga9y28gSWhDvhgP'); // true
isValidTxHash('...'); // true/false
isValidCurrency('USD'); // true
isValidCurrency('CALL'); // false (reserved)
```

## Transaction Flags

```typescript
import { TxFlags } from 'call-core-lib';

// Payment flags
TxFlags.tfPartialPayment
TxFlags.tfNoDirectCall
TxFlags.tfLimitQuality

// AccountSet flags
TxFlags.tfRequireDestTag
TxFlags.tfRequireAuth
TxFlags.tfDisallowCall

// OfferCreate flags
TxFlags.tfPassive
TxFlags.tfImmediateOrCancel
TxFlags.tfFillOrKill
TxFlags.tfSell

// TrustSet flags
TxFlags.tfSetNoCall
TxFlags.tfSetFreeze
TxFlags.tfClearFreeze
```

## Browser Usage

```html
<script src="https://unpkg.com/call-core-lib/dist/browser/call-core-lib.min.js"></script>
<script>
  const { RpcClient, generateWallet } = CallCore;

  const client = new RpcClient({ server: 'http://localhost:5005' });
  const wallet = generateWallet();

  console.log('Address:', wallet.address);
</script>
```

## Error Handling

```typescript
import { RpcError, WebSocketError } from 'call-core-lib';

try {
  const info = await client.serverInfo();
} catch (error) {
  if (error instanceof RpcError) {
    console.error('RPC Error:', error.code, error.message);
  } else {
    console.error('Error:', error.message);
  }
}

try {
  await ws.connect();
} catch (error) {
  if (error instanceof WebSocketError) {
    console.error('WebSocket Error:', error.code, error.message);
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Type check
npm run typecheck
```

## Documentation Guides

| Guide | Description |
|-------|-------------|
| [Getting Started](./docs/getting-started.md) | Installation, quick start, and basic concepts |
| [RPC Client](./docs/rpc-client.md) | Complete guide to all 80+ RPC methods |
| [WebSocket Client](./docs/websocket-client.md) | Real-time subscriptions and event handling |
| [Transactions](./docs/transactions.md) | Building and signing all transaction types |
| [Crypto](./docs/crypto.md) | Wallet generation, keys, signing, and validation |
| [API Reference](./docs/api-reference.md) | Complete API reference for all exports |

## API Reference

See the TypeScript definitions for complete API documentation.

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please submit issues and pull requests on GitHub.

## Support

For support, please open an issue on GitHub or contact the Call-Core team.
