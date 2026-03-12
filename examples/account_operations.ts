/**
 * Account operations example
 */

import { RpcClient, generateWallet } from '@/index';

async function main() {
  const client = new RpcClient({ server: 'http://localhost:5005' });

  // Generate a new wallet
  console.log('=== Generating New Wallet ===');
  const wallet = generateWallet();
  console.log('Seed:', wallet.seed);
  console.log('Address:', wallet.address);
  console.log('Public Key:', wallet.publicKey);

  // Example account (replace with a real address on the network)
  const account = 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy';

  try {
    // Get account info
    console.log('\n=== Account Info ===');
    const accountInfo = await client.accountInfo({
      account,
      ledger_index: 'validated',
    });

    console.log('Account:', accountInfo.account_data.account);
    console.log('Balance:', accountInfo.account_data.balance, 'drops');
    console.log('Sequence:', accountInfo.account_data.sequence);
    console.log('Owner Count:', accountInfo.account_data.owner_count);
    console.log('Ledger Index:', accountInfo.ledger_current_index);

    // Get account lines (trust lines)
    console.log('\n=== Account Lines ===');
    const lines = await client.accountLines({ account });
    console.log('Number of trust lines:', lines.lines.length);
    for (const line of lines.lines.slice(0, 5)) {
      console.log(`  ${line.currency}: ${line.balance} / ${line.limit} (from ${line.account})`);
    }

    // Get account transactions
    console.log('\n=== Account Transactions ===');
    const txs = await client.accountTx({
      account,
      limit: 5,
    });
    console.log('Transaction count:', txs.transactions.length);
    for (const tx of txs.transactions) {
      if (tx.tx) {
        console.log(`  ${tx.tx.transaction?.transaction_type}: ${tx.tx.transaction?.hash}`);
      }
    }

    // Get account objects
    console.log('\n=== Account Objects ===');
    const objects = await client.accountObjects({ account });
    console.log('Object count:', objects.account_objects.length);

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
