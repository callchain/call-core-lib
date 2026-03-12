/**
 * Basic RPC client example
 */

import { RpcClient } from '@/index';

async function main() {
  // Create RPC client
  const client = new RpcClient({
    server: 'http://localhost:5005',
    timeout: 30000,
  });

  try {
    // Get server info
    console.log('=== Server Info ===');
    const info = await client.serverInfo();
    console.log('Build Version:', info.info.build_version);
    console.log('Server State:', info.info.server_state);
    console.log('Complete Ledgers:', info.info.complete_ledgers);
    console.log('Peers:', info.info.peers);
    console.log('Uptime:', info.info.uptime, 'seconds');

    if (info.info.validated_ledger) {
      console.log('Validated Ledger:', info.info.validated_ledger.seq);
      console.log('Base Fee:', info.info.validated_ledger.base_fee);
      console.log('Reserve Base:', info.info.validated_ledger.reserve_base);
    }

    // Get current ledger
    console.log('\n=== Current Ledger ===');
    const ledger = await client.ledger({ ledger_index: 'current' });
    console.log('Ledger Index:', ledger.ledger.ledger_index);
    console.log('Ledger Hash:', ledger.ledger.ledger_hash);
    console.log('Closed:', ledger.ledger.closed);

    // Get fee
    console.log('\n=== Fee Info ===');
    const fee = await client.fee();
    console.log('Base Fee:', fee.drops.base_fee, 'drops');
    console.log('Minimum Fee:', fee.drops.minimum_fee, 'drops');
    console.log('Median Fee:', fee.drops.median_fee, 'drops');

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
