# Call-Core-Lib Documentation

Welcome to the call-core-lib documentation. This library provides a comprehensive TypeScript/JavaScript client for interacting with the Call-Core blockchain.

## Quick Links

- [Getting Started](./getting-started.md) - Installation and quick start guide
- [RPC Client](./rpc-client.md) - JSON-RPC API documentation
- [WebSocket Client](./websocket-client.md) - Real-time subscriptions guide
- [Transactions](./transactions.md) - Building and signing transactions
- [Crypto](./crypto.md) - Key management and cryptographic functions
- [API Reference](./api-reference.md) - Complete API documentation

## Overview

Call-Core-Lib is a universal client library that works in both Node.js and browsers:

- 🔌 **JSON-RPC Client** - All 80+ Call-Core RPC methods
- 🌐 **WebSocket Client** - Real-time subscriptions with auto-reconnection
- 💰 **Crypto** - Native secp256k1 keypairs, signing, address derivation
- 🏗️ **Transactions** - Type-safe builders for all transaction types
- 📦 **Zero Legacy Dependencies** - Uses standard npm libraries (elliptic, hash.js)
- 📘 **Full TypeScript** - Complete type definitions

## Installation

```bash
npm install call-core-lib
```

## Quick Examples

### Create a Wallet

```typescript
import { generateWallet } from 'call-core-lib';

const wallet = generateWallet();
console.log('Address:', wallet.address);   // cxxxxxxxx...
console.log('Seed:', wallet.seed);         // sxxxxxxxx...
```

### Query the Ledger

```typescript
import { RpcClient } from 'call-core-lib';

const client = new RpcClient({ server: 'http://localhost:5005' });
const info = await client.serverInfo();
console.log('Server state:', info.info.server_state);
```

### Subscribe to Real-time Updates

```typescript
import { WebSocketClient } from 'call-core-lib';

const ws = new WebSocketClient({ url: 'ws://localhost:6005' });
await ws.connect();

ws.onLedger((ledger) => {
  console.log('New ledger:', ledger.ledger_index);
});
```

### Build a Transaction

```typescript
import { PaymentBuilder, callToDrops } from 'call-core-lib';

const payment = new PaymentBuilder('cSender...', 1)
  .setDestination('cDestination...')
  .setAmount(callToDrops('10'))  // 10 CALL
  .build();
```

## Documentation Structure

1. **[Getting Started](./getting-started.md)** - Learn the basics:
   - Installation
   - Creating wallets
   - Connecting to nodes
   - Querying accounts
   - Subscribing to updates

2. **[RPC Client](./rpc-client.md)** - Complete RPC guide:
   - Server info methods
   - Ledger queries
   - Account operations
   - Transaction submission
   - DEX/path finding

3. **[WebSocket Client](./websocket-client.md)** - Real-time data:
   - Connection management
   - Stream subscriptions
   - Event handlers
   - Auto-reconfiguration

4. **[Transactions](./transactions.md)** - Transaction building:
   - Payment
   - AccountSet
   - TrustSet
   - OfferCreate/Cancel
   - Multi-signing

5. **[Crypto](./crypto.md)** - Cryptographic operations:
   - Wallet generation
   - Key derivation
   - Signing/verification
   - Hash functions
   - Validation

6. **[API Reference](./api-reference.md)** - Complete API listing:
   - All types
   - All classes
   - All functions
   - Constants

## Call-Core Specifics

### Address Format

Call-Core addresses:
- Start with **'c'** (e.g., `cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy`)
- Base58Check encoded
- Version byte: `0x00`

### Seed Format

Call-Core seeds (private keys):
- Start with **'s'** (e.g., `ss9e7tg3C4NJ3zga9y28gSWhDvhgP`)
- Base58Check encoded
- Version byte: `0x21`

### Amounts

Native CALL currency:
- Smallest unit: **drops**
- 1 CALL = **1,000,000 drops**
- Represented as strings for precision

```typescript
import { callToDrops, dropsToCall } from 'call-core-lib';

callToDrops('1.5');  // "1500000"
dropsToCall('1500000');  // "1.5"
```

Issued currencies:
```typescript
import { issuedCurrencyAmount } from 'call-core-lib';

issuedCurrencyAmount('100', 'USD', 'cIssuer...');
// { value: "100", currency: "USD", issuer: "c..." }
```

## Examples

See the `/examples` directory in the repository:

- `basic_rpc.ts` - RPC client basics
- `account_operations.ts` - Account queries
- `websocket_subscriptions.ts` - WebSocket subscriptions
- `transactions.ts` - Building transactions
- `wallet_management.ts` - Wallet operations

## Support

- GitHub Issues: https://github.com/callchain/call-core-lib/issues
- License: MIT

## Version

Current version: **1.0.0**
