# RPC Client Guide

The `RpcClient` provides access to all Call-Core JSON-RPC methods.

## Table of Contents

- [Creating a Client](#creating-a-client)
- [Server Info Methods](#server-info-methods)
- [Ledger Methods](#ledger-methods)
- [Account Methods](#account-methods)
- [Transaction Methods](#transaction-methods)
- [DEX/Path Methods](#dexpath-methods)
- [Utility Methods](#utility-methods)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)

## Creating a Client

```typescript
import { RpcClient } from 'call-core-lib';

const client = new RpcClient({
  server: 'http://localhost:5005',  // Required: RPC server URL
  timeout: 30000,                   // Optional: Request timeout (ms)
  headers: {                        // Optional: Custom headers
    'X-Custom-Header': 'value',
  },
});
```

### Changing Server

```typescript
// Update server URL
client.setServer('http://other-node:5005');

// Get current server
console.log(client.getServer()); // "http://other-node:5005"
```

## Server Info Methods

### serverInfo()

Get general server information.

```typescript
const info = await client.serverInfo();

console.log(info.info.build_version);      // "1.0.0"
console.log(info.info.server_state);       // "full", "syncing", etc.
console.log(info.info.complete_ledgers);   // "1-1000"
console.log(info.info.peers);              // Number of peers
console.log(info.info.uptime);             // Seconds since startup

if (info.info.validated_ledger) {
  console.log(info.info.validated_ledger.seq);          // Ledger index
  console.log(info.info.validated_ledger.base_fee);     // Base fee in drops
  console.log(info.info.validated_ledger.reserve_base); // Reserve in drops
}
```

### serverState()

Get detailed server state (admin only).

```typescript
const state = await client.serverState();
console.log(state.state.server_state);
```

### ping()

Ping the server to check connectivity.

```typescript
const result = await client.ping();
console.log(result.role); // "admin", "proxied", etc.
```

## Ledger Methods

### ledger()

Get ledger information.

```typescript
// Get validated ledger
const ledger = await client.ledger({
  ledger_index: 'validated',
});

// Get specific ledger
const ledger500 = await client.ledger({
  ledger_index: 500,
  full: false,
  transactions: true,
  expand: true,
});

// Get by hash
const byHash = await client.ledger({
  ledger_hash: 'ABC123...',
});

console.log(ledger.ledger.ledger_index);
console.log(ledger.ledger.ledger_hash);
console.log(ledger.ledger.close_time);
console.log(ledger.ledger.closed);
console.log(ledger.validated);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ledger_index` | `number \| 'current' \| 'closed' \| 'validated'` | Ledger to query |
| `ledger_hash` | `string` | Ledger hash (alternative to index) |
| `full` | `boolean` | Include full ledger data |
| `transactions` | `boolean` | Include transactions |
| `expand` | `boolean` | Expand transaction data |
| `binary` | `boolean` | Return binary data |

### ledgerClosed()

Get the latest closed ledger.

```typescript
const closed = await client.ledgerClosed();
console.log(closed.ledger_hash);
console.log(closed.ledger_index);
```

### ledgerCurrent()

Get the current working ledger index.

```typescript
const current = await client.ledgerCurrent();
console.log(current.ledger_current_index);
```

### ledgerData()

Get ledger data with pagination.

```typescript
const data = await client.ledgerData({
  ledger_index: 'validated',
  limit: 100,
});

console.log(data.state); // Array of ledger entries
console.log(data.marker); // Pagination marker

// Get next page
if (data.marker) {
  const nextPage = await client.ledgerData({
    ledger_index: 'validated',
    limit: 100,
    marker: data.marker,
  });
}
```

### ledgerEntry()

Get a specific ledger entry.

```typescript
// Get account root
const entry = await client.ledgerEntry({
  account_root: 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
});

// Get other entry types
const directory = await client.ledgerEntry({
  directory: 'c...',
});

const offer = await client.ledgerEntry({
  offer: 'c...',
});
```

## Account Methods

### accountInfo()

Get account information.

```typescript
const info = await client.accountInfo({
  account: 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
  ledger_index: 'validated',
  queue: true,      // Include queued transactions
  signers: true,    // Include signer list
});

console.log(info.account_data.account);
console.log(info.account_data.balance);      // In drops
console.log(info.account_data.sequence);     // Next transaction sequence
console.log(info.account_data.owner_count);  // Objects owned
console.log(info.account_data.flags);        // Account flags
console.log(info.ledger_current_index);
```

### accountTx()

Get account transaction history.

```typescript
const txs = await client.accountTx({
  account: 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
  limit: 20,
  forward: false,   // Newest first
});

for (const tx of txs.transactions) {
  console.log(tx.tx?.transaction?.transaction_type);
  console.log(tx.tx?.transaction?.hash);
  console.log(tx.meta?.TransactionResult);
  console.log(tx.validated);
}

// Pagination
if ( txs.marker) {
  const nextPage = await client.accountTx({
    account: 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
    limit: 20,
    marker: txs.marker,
  });
}
```

### accountLines()

Get account trust lines.

```typescript
const lines = await client.accountInfo({
  account: 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
});

for (const line of lines.lines) {
  console.log(line.account);     // Counterparty
  console.log(line.balance);     // Current balance
  console.log(line.currency);    // Currency code
  console.log(line.limit);       // Trust limit
  console.log(line.limit_peer);  // Counterparty's limit
  console.log(line.no_call);     // No call flag
  console.log(line.freeze);      // Freeze status
}
```

### accountObjects()

Get account objects (offers, trust lines, etc.).

```typescript
const objects = await client.accountObjects({
  account: 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
  type: 'offer',  // Filter by type
  limit: 50,
});

console.log(objects.account_objects);
```

### accountOffers()

Get account offers (open orders).

```typescript
const offers = await client.accountOffers({
  account: 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
});

for (const offer of offers.offers) {
  console.log(offer.seq);         // Offer sequence
  console.log(offer.taker_gets);  // What account gets
  console.log(offer.taker_pays);  // What account pays
}
```

### accountCurrencies()

Get currencies an account can send/receive.

```typescript
const currencies = await client.accountCurrencies({
  account: 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
});

console.log(currencies.send_currencies);
console.log(currencies.receive_currencies);
```

### gatewayBalances()

Get gateway balance information.

```typescript
const balances = await client.gatewayBalances({
  account: 'cGatewayAddress...',
  hotwallet: ['cHotWallet1...', 'cHotWallet2...'],
});

console.log(balances.obligations);  // Total issued
console.log(balances.balances);     // Balances by account
console.log(balances.assets);       // Hot wallet balances
```

## Transaction Methods

### submit()

Submit a signed transaction.

```typescript
const result = await client.submit({
  tx_blob: '12000022000000002400000001...',  // Signed transaction hex
  fail_hard: false,                           // Fail on error
});

console.log(result.engine_result);         // "tesSUCCESS"
console.log(result.engine_result_code);    // 0
console.log(result.engine_result_message);
console.log(result.tx_blob);
console.log(result.tx_json);               // Transaction details
```

### submitMultisigned()

Submit a multi-signed transaction.

```typescript
const result = await client.submitMultisigned({
  tx_json: { /* signed transaction JSON */ },
});
```

### tx()

Get transaction by hash.

```typescript
const tx = await client.tx({
  transaction: 'ABC123DEF456...',
  binary: false,
});

console.log(tx.tx?.transaction?.transaction_type);
console.log(tx.tx?.transaction?.account);
console.log(tx.meta?.TransactionResult);
console.log(tx.validated);
```

### transactionEntry()

Get transaction from a specific ledger.

```typescript
const entry = await client.transactionEntry({
  tx_hash: 'ABC123...',
  ledger_index: 500,
});
```

### txHistory()

Get transaction history (server's recent transactions).

```typescript
const history = await client.txHistory({
  start: 0,  // Start index
});
```

## DEX/Path Methods

### bookOffers()

Get order book offers.

```typescript
const book = await client.bookOffers({
  taker_gets: {
    currency: 'CALL',  // Native currency
  },
  taker_pays: {
    currency: 'USD',
    issuer: 'cIssuerAddress...',
  },
  limit: 50,
});

for (const offer of book.offers) {
  console.log(offer.Account);
  console.log(offer.TakerGets);
  console.log(offer.TakerPays);
  console.log(offer.Sequence);
}
```

### ripplePathFind()

Find payment paths (Ripple-style).

```typescript
const paths = await client.ripplePathFind({
  source_account: 'cSource...',
  destination_account: 'cDestination...',
  destination_amount: {
    currency: 'USD',
    issuer: 'cIssuer...',
    value: '100',
  },
});

console.log(paths.alternatives);
```

## Utility Methods

### fee()

Get current fee information.

```typescript
const fee = await client.fee();

console.log(fee.drops.base_fee);       // Base fee
console.log(fee.drops.minimum_fee);    // Minimum fee
console.log(fee.drops.median_fee);     // Median fee
console.log(fee.drops.open_ledger_fee);

console.log(fee.expected_ledger_size);
console.log(fee.current_ledger_size);
console.log(fee.current_queue_size);
```

### random()

Generate random bytes (admin only).

```typescript
const random = await client.random();
console.log(random.random);  // Random hex string
```

### walletPropose()

Generate a new wallet (admin only).

```typescript
const wallet = await client.walletPropose({
  passphrase: 'my secret phrase',  // Optional
});

console.log(wallet.account_id);    // Address
console.log(wallet.key_type);      // "secp256k1"
console.log(wallet.master_seed);   // Seed
console.log(wallet.public_key);
console.log(wallet.private_key);
```

## Error Handling

```typescript
import { RpcError } from 'call-core-lib';

try {
  const info = await client.serverInfo();
} catch (error) {
  if (error instanceof RpcError) {
    console.error('RPC Error:');
    console.error('  Code:', error.code);      // JSON-RPC error code
    console.error('  Message:', error.message);
    console.error('  Data:', error.data);      // Additional error data
  } else {
    console.error('Network/Other Error:', error.message);
  }
}
```

Common error codes:
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32000`: Server error

## Advanced Usage

### Custom Headers

```typescript
const client = new RpcClient({
  server: 'http://localhost:5005',
  headers: {
    'Authorization': 'Bearer token123',
    'X-API-Key': 'my-api-key',
  },
});
```

### Raw Requests

For methods not directly implemented:

```typescript
const result = await client.request('custom_method', {
  param1: 'value1',
  param2: 'value2',
});
```

### Connection Pooling

The RpcClient uses the native `fetch` API. For connection pooling in Node.js, use an appropriate fetch implementation.
