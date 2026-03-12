# WebSocket Client Guide

The `WebSocketClient` provides real-time access to Call-Core with automatic reconnection and subscription management.

## Table of Contents

- [Creating a Client](#creating-a-client)
- [Connection Management](#connection-management)
- [Subscriptions](#subscriptions)
- [Event Handlers](#event-handlers)
- [RPC over WebSocket](#rpc-over-websocket)
- [Error Handling](#error-handling)
- [Advanced Configuration](#advanced-configuration)

## Creating a Client

```typescript
import { WebSocketClient } from 'call-core-lib';

const ws = new WebSocketClient({
  url: 'ws://localhost:6005',     // Required: WebSocket URL
  reconnect: true,                 // Auto-reconnect on disconnect
  reconnectDelay: 5000,            // Reconnect delay (ms)
  maxReconnectAttempts: 10,        // Max reconnection attempts
  heartbeat: true,                 // Enable heartbeat pings
  heartbeatInterval: 30000,        // Heartbeat interval (ms)
  timeout: 30000,                  // Request timeout (ms)
});
```

## Connection Management

### Connecting

```typescript
// Connect to WebSocket server
await ws.connect();
console.log('Connected!');

// Check connection state
console.log(ws.isConnected());      // true/false
console.log(ws.getConnectionState()); // 'connected', 'connecting', 'disconnected', 'reconnecting'
```

### Disconnecting

```typescript
// Graceful disconnect (disables auto-reconnect)
await ws.disconnect();
console.log('Disconnected');
```

### Connection States

```typescript
// Possible states:
// - 'disconnected'  - Not connected
// - 'connecting'    - Connection in progress
// - 'connected'     - Successfully connected
// - 'reconnecting'  - Attempting to reconnect

ws.getConnectionState();
```

## Subscriptions

### Subscribe to Streams

```typescript
// Subscribe to ledger stream
await ws.subscribe({
  streams: ['ledger'],
});

// Subscribe to multiple streams
await ws.subscribe({
  streams: ['ledger', 'transactions', 'validations'],
});

// Subscribe to account transactions
await ws.subscribe({
  accounts: ['cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy'],
});

// Subscribe to order book
await ws.subscribe({
  books: [
    {
      taker_pays: { currency: 'CALL' },
      taker_gets: { currency: 'USD', issuer: 'cIssuer...' },
      snapshot: true,
      both: false,
    },
  ],
});
```

### Unsubscribe

```typescript
// Unsubscribe from streams
await ws.unsubscribe({
  streams: ['ledger'],
});

// Unsubscribe from accounts
await ws.unsubscribe({
  accounts: ['cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy'],
});

// Unsubscribe from all
await ws.unsubscribeAll();
```

## Event Handlers

Event handlers return an unsubscribe function.

### Ledger Events

Subscribe to new validated ledgers:

```typescript
const unsubscribe = ws.onLedger((ledger) => {
  console.log('New Ledger!');
  console.log('  Index:', ledger.ledger_index);
  console.log('  Hash:', ledger.ledger_hash);
  console.log('  Time:', new Date(ledger.ledger_time * 1000));
  console.log('  Tx Count:', ledger.txn_count);
  console.log('  Validated Ledgers:', ledger.validated_ledgers);
});

// Later: unsubscribe
unsubscribe();
```

**Ledger message structure:**
```typescript
{
  type: 'ledgerClosed',
  ledger_index: 1000,
  ledger_hash: 'ABC123...',
  ledger_time: 1234567890,
  txn_count: 25,
  validated_ledgers: '1-1000',
}
```

### Transaction Events

Subscribe to all transactions:

```typescript
const unsubscribe = ws.onTransaction((tx) => {
  console.log('Transaction:');
  console.log('  Type:', tx.transaction?.transaction?.transaction_type);
  console.log('  Account:', tx.transaction?.transaction?.account);
  console.log('  Hash:', tx.transaction?.transaction?.hash);
  console.log('  Validated:', tx.validated);
  console.log('  Engine Result:', tx.engine_result);
});
```

### Account Transaction Events

Subscribe to transactions affecting a specific account:

```typescript
const unsubscribe = ws.onAccountTransaction(
  'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
  (tx) => {
    console.log('Account Transaction:');
    console.log('  Type:', tx.transaction?.transaction?.transaction_type);
    console.log('  Result:', tx.meta?.TransactionResult);

    // Check if this is a payment to/from the account
    const payment = tx.transaction?.transaction as Payment;
    if (payment.transaction_type === 'Payment') {
      console.log('  Amount:', payment.amount);
      console.log('  Destination:', payment.destination);
    }
  }
);
```

### Validation Events

Subscribe to consensus validations:

```typescript
const unsubscribe = ws.onValidation((validation) => {
  console.log('Validation:');
  console.log('  Ledger Hash:', validation.ledger_hash);
  console.log('  Ledger Index:', validation.ledger_index);
  console.log('  Validation Public Key:', validation.validation_public_key);
  console.log('  Signature:', validation.signature);
});
```

### Consensus Events

Subscribe to consensus phase changes:

```typescript
const unsubscribe = ws.onConsensus((consensus) => {
  console.log('Consensus Phase:', consensus);
});
```

### Peer Status Events

Subscribe to peer status changes:

```typescript
const unsubscribe = ws.onPeerStatus((peer) => {
  console.log('Peer Status:', peer);
});
```

## RPC over WebSocket

All RPC methods work over WebSocket too:

```typescript
// Server info
const info = await ws.serverInfo();

// Account info
const account = await ws.accountInfo({
  account: 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
});

// Ledger
const ledger = await ws.ledger({ ledger_index: 'validated' });

// Submit transaction
const result = await ws.submit({
  tx_blob: '12000022...',
});

// Get transaction
const tx = await ws.tx({ transaction: 'ABC123...' });
```

## Error Handling

```typescript
import { WebSocketError } from 'call-core-lib';

try {
  await ws.connect();
} catch (error) {
  if (error instanceof WebSocketError) {
    console.error('WebSocket Error:', error.code, error.message);
  } else {
    console.error('Connection Error:', error.message);
  }
}

// Handle errors in subscriptions
ws.onLedger((ledger) => {
  try {
    processLedger(ledger);
  } catch (error) {
    console.error('Error processing ledger:', error);
  }
});
```

## Advanced Configuration

### Auto-Reconnection

```typescript
const ws = new WebSocketClient({
  url: 'ws://localhost:6005',
  reconnect: true,
  reconnectDelay: 5000,        // Wait 5 seconds before reconnecting
  maxReconnectAttempts: 10,    // Give up after 10 attempts
});

// Events during reconnection
ws.onLedger((ledger) => {
  console.log('New ledger:', ledger.ledger_index);
});

// If disconnected, the client will automatically:
// 1. Wait 5 seconds
// 2. Attempt to reconnect
// 3. Resubscribe to all previous subscriptions
// 4. Continue delivering events
```

### Heartbeat

Keep the connection alive with periodic pings:

```typescript
const ws = new WebSocketClient({
  url: 'ws://localhost:6005',
  heartbeat: true,
  heartbeatInterval: 30000,  // Ping every 30 seconds
});
```

### Request Timeout

```typescript
const ws = new WebSocketClient({
  url: 'ws://localhost:6005',
  timeout: 30000,  // 30 second timeout for requests
});

// This will timeout if no response in 30 seconds
try {
  const result = await ws.serverInfo();
} catch (error) {
  console.error('Request timed out');
}
```

## Complete Example

```typescript
import { WebSocketClient } from 'call-core-lib';

async function main() {
  // Create client with full options
  const ws = new WebSocketClient({
    url: 'ws://localhost:6005',
    reconnect: true,
    reconnectDelay: 5000,
    maxReconnectAttempts: 10,
    heartbeat: true,
    heartbeatInterval: 30000,
    timeout: 30000,
  });

  // Connect
  console.log('Connecting...');
  await ws.connect();
  console.log('Connected!');

  // Subscribe to events
  const unsubs = [];

  // Ledgers
  unsubs.push(
    ws.onLedger((ledger) => {
      console.log(`\n📦 Ledger ${ledger.ledger_index} closed`);
      console.log(`   Hash: ${ledger.ledger_hash}`);
      console.log(`   Transactions: ${ledger.txn_count}`);
    })
  );

  // Transactions
  unsubs.push(
    ws.onTransaction((tx) => {
      const type = tx.transaction?.transaction?.transaction_type;
      console.log(`\n💸 Transaction: ${type}`);
      console.log(`   Result: ${tx.engine_result}`);
    })
  );

  // Account transactions
  const myAccount = 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy';
  unsubs.push(
    ws.onAccountTransaction(myAccount, (tx) => {
      console.log(`\n📨 Transaction for ${myAccount}:`);
      console.log(`   Type: ${tx.transaction?.transaction?.transaction_type}`);
    })
  );

  // Keep running
  console.log('\nPress Ctrl+C to stop\n');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down...');

    // Unsubscribe from all
    unsubs.forEach(unsub => unsub());
    await ws.unsubscribeAll();
    await ws.disconnect();

    console.log('Disconnected');
    process.exit(0);
  });
}

main().catch(console.error);
```

## Best Practices

1. **Always handle disconnects**: Use `reconnect: true` for production
2. **Unsubscribe when done**: Clean up subscriptions to avoid memory leaks
3. **Handle errors**: Wrap handlers in try-catch blocks
4. **Use account-specific subscriptions**: Instead of filtering all transactions
5. **Set appropriate timeouts**: Balance between responsiveness and patience
