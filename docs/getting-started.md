# Getting Started with Call-Core-Lib

This guide will help you get up and running with the Call-Core JavaScript/TypeScript library.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Basic Concepts](#basic-concepts)
- [Next Steps](#next-steps)

## Installation

### npm

```bash
npm install call-core-lib
```

### yarn

```bash
yarn add call-core-lib
```

### pnpm

```bash
pnpm add call-core-lib
```

### Browser (CDN)

```html
<script src="https://unpkg.com/call-core-lib/dist/browser/call-core-lib.min.js"></script>
```

## Quick Start

### 1. Create a Wallet

```typescript
import { generateWallet, isValidAddress } from 'call-core-lib';

// Generate a new wallet
const wallet = generateWallet();

console.log('Seed:', wallet.seed);           // sxxxxxxxxxx...
console.log('Address:', wallet.address);     // cxxxxxxxxxx...
console.log('Public Key:', wallet.publicKey);
console.log('Private Key:', wallet.privateKey);

// Validate the address
console.log('Valid:', isValidAddress(wallet.address)); // true
```

### 2. Connect to a Node (RPC)

```typescript
import { RpcClient } from 'call-core-lib';

const client = new RpcClient({
  server: 'http://localhost:5005',  // Your Call-Core node
  timeout: 30000,                    // 30 second timeout
});

// Get server info
const info = await client.serverInfo();
console.log('Server State:', info.info.server_state);
console.log('Build Version:', info.info.build_version);
```

### 3. Query Account Information

```typescript
// Get account info
const accountInfo = await client.accountInfo({
  account: 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
  ledger_index: 'validated',
});

console.log('Balance:', accountInfo.account_data.balance, 'drops');
console.log('Sequence:', accountInfo.account_data.sequence);
```

### 4. Subscribe to Real-time Updates (WebSocket)

```typescript
import { WebSocketClient } from 'call-core-lib';

const ws = new WebSocketClient({
  url: 'ws://localhost:6005',
  reconnect: true,      // Auto-reconnect on disconnect
  heartbeat: true,      // Keep connection alive
});

await ws.connect();

// Subscribe to new ledgers
ws.onLedger((ledger) => {
  console.log('New ledger:', ledger.ledger_index);
  console.log('Hash:', ledger.ledger_hash);
});

// Subscribe to account transactions
ws.onAccountTransaction('cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy', (tx) => {
  console.log('New transaction for account:', tx.transaction);
});
```

### 5. Build a Transaction

```typescript
import { PaymentBuilder, callToDrops } from 'call-core-lib';

// Build a payment transaction
const payment = new PaymentBuilder('cSenderAddress...', 1)  // account, sequence
  .setDestination('cDestinationAddress...')
  .setAmount(callToDrops('10'))  // 10 CALL in drops
  .setFee('100')
  .addTextMemo('Hello from call-core-lib!')
  .build();

console.log('Transaction:', JSON.stringify(payment, null, 2));
```

## Basic Concepts

### Amounts

Call-Core uses "drops" as the smallest unit (1 CALL = 1,000,000 drops):

```typescript
import { callToDrops, dropsToCall, nativeAmount } from 'call-core-lib';

// Convert CALL to drops
const drops = callToDrops('1.5');     // "1500000"

// Convert drops to CALL
const call = dropsToCall('1500000');  // "1.5"

// Create native amount
const amount = nativeAmount('10');    // "10000000"
```

For issued currencies:

```typescript
import { issuedCurrencyAmount } from 'call-core-lib';

const usdAmount = issuedCurrencyAmount(
  '100',                          // value
  'USD',                          // currency code
  'cIssuerAddress...'            // issuer
);
// Result: { value: "100", currency: "USD", issuer: "c..." }
```

### Addresses

Call-Core addresses:
- Start with 'c' (e.g., `cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy`)
- Are Base58Check encoded
- Contain a version byte, payload, and checksum

Seeds (private keys):
- Start with 's' (e.g., `ss9e7tg3C4NJ3zga9y28gSWhDvhgP`)
- Are Base58Check encoded
- Used to derive keypairs

### Transaction Sequence Numbers

Each account has a sequence number that increments with each transaction:

```typescript
// Get current sequence
const accountInfo = await client.accountInfo({ account: 'c...' });
const sequence = accountInfo.account_data.sequence;

// Build transaction with correct sequence
const tx = new PaymentBuilder('c...', sequence)
  .setDestination('c...')
  .setAmount('1000000')
  .build();
```

### Ledgers

Three special ledger indices:
- `'validated'` - The most recent validated ledger
- `'current'` - The current in-progress ledger
- `'closed'` - The most recently closed ledger

```typescript
// Get validated ledger
const ledger = await client.ledger({ ledger_index: 'validated' });

// Get specific ledger by number
const ledger500 = await client.ledger({ ledger_index: 500 });
```

## Error Handling

Always wrap calls in try-catch:

```typescript
import { RpcError, WebSocketError } from 'call-core-lib';

try {
  const info = await client.serverInfo();
} catch (error) {
  if (error instanceof RpcError) {
    console.error('RPC Error Code:', error.code);
    console.error('RPC Error Message:', error.message);
  } else {
    console.error('Other Error:', error.message);
  }
}
```

## Next Steps

- [RPC Client Guide](./rpc-client.md) - Detailed RPC documentation
- [WebSocket Client Guide](./websocket-client.md) - Real-time subscriptions
- [Transaction Guide](./transactions.md) - Building and signing transactions
- [Crypto Utilities](./crypto.md) - Key management and signing
- [API Reference](./api-reference.md) - Complete API documentation
