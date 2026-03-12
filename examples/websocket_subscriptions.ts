/**
 * WebSocket subscriptions example
 */

import { WebSocketClient } from '@/index';

async function main() {
  // Create WebSocket client
  const client = new WebSocketClient({
    url: 'ws://localhost:6005',
    reconnect: true,
    reconnectDelay: 5000,
    heartbeat: true,
    heartbeatInterval: 30000,
  });

  // Handle connection events
  console.log('Connecting to WebSocket...');
  await client.connect();
  console.log('Connected!');

  // Subscribe to ledger stream
  console.log('Subscribing to ledger stream...');
  const unsubscribeLedger = client.onLedger((ledger) => {
    console.log('\n=== New Ledger ===');
    console.log('Ledger Index:', ledger.ledger_index);
    console.log('Ledger Hash:', ledger.ledger_hash);
    console.log('Close Time:', new Date(ledger.ledger_time * 1000).toISOString());
    console.log('Transaction Count:', ledger.txn_count);
    console.log('Validated Ledgers:', ledger.validated_ledgers);
  });

  // Subscribe to transaction stream
  console.log('Subscribing to transaction stream...');
  const unsubscribeTx = client.onTransaction((tx) => {
    console.log('\n=== New Transaction ===');
    console.log('Type:', tx.transaction?.transaction?.transaction_type);
    console.log('Account:', tx.transaction?.transaction?.account);
    console.log('Validated:', tx.validated);
  });

  // Subscribe to validation stream
  console.log('Subscribing to validation stream...');
  const unsubscribeValidation = client.onValidation((validation) => {
    console.log('\n=== New Validation ===');
    console.log('Ledger Hash:', validation.ledger_hash);
    console.log('Ledger Index:', validation.ledger_index);
    console.log('Validation Public Key:', validation.validation_public_key);
  });

  // Subscribe to account-specific transactions
  const account = 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy';
  console.log(`Subscribing to transactions for ${account}...`);
  const unsubscribeAccount = client.onAccountTransaction(account, (tx) => {
    console.log('\n=== Account Transaction ===');
    console.log('Account:', account);
    console.log('Transaction:', JSON.stringify(tx.transaction, null, 2));
  });

  // Keep the process running
  console.log('\nPress Ctrl+C to stop\n');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');

    // Unsubscribe from all
    unsubscribeLedger();
    unsubscribeTx();
    unsubscribeValidation();
    unsubscribeAccount();

    await client.unsubscribeAll();
    await client.disconnect();

    console.log('Disconnected');
    process.exit(0);
  });
}

main().catch(console.error);
