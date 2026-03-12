/**
 * Transaction building and submission example
 */

import {
  RpcClient,
  PaymentBuilder,
  TrustSetBuilder,
  OfferCreateBuilder,
  OfferCancelBuilder,
  callToDrops,
} from '@/index';

async function main() {
  const client = new RpcClient({ server: 'http://localhost:5005' });

  // Example account (replace with real values)
  const account = 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy';
  const destination = 'cDestinationAddressHere';

  try {
    // Get account info for sequence
    const accountInfo = await client.accountInfo({ account });
    const sequence = accountInfo.account_data.sequence;

    // Build a payment transaction
    console.log('=== Building Payment Transaction ===');
    const payment = new PaymentBuilder(account, sequence)
      .setDestination(destination)
      .setAmount(callToDrops('10')) // 10 CALL
      .setDestinationTag(12345)
      .setFee('100')
      .addTextMemo('Hello from call-core-lib!')
      .build();

    console.log('Payment Transaction:');
    console.log(JSON.stringify(payment, null, 2));

    // Build a trust set transaction
    console.log('\n=== Building TrustSet Transaction ===');
    const trustSet = new TrustSetBuilder(account, sequence + 1)
      .setLimitAmount({
        currency: 'USD',
        issuer: destination,
        value: '10000',
      })
      .setQualityIn(1000000000)
      .setQualityOut(1000000000)
      .setFee('100')
      .build();

    console.log('TrustSet Transaction:');
    console.log(JSON.stringify(trustSet, null, 2));

    // Build an offer create transaction
    console.log('\n=== Building OfferCreate Transaction ===');
    const offerCreate = new OfferCreateBuilder(account, sequence + 2)
      .setTakerPays(callToDrops('100')) // 100 CALL
      .setTakerGets({
        currency: 'USD',
        issuer: destination,
        value: '10',
      })
      .setPassive()
      .setSell()
      .setFee('100')
      .build();

    console.log('OfferCreate Transaction:');
    console.log(JSON.stringify(offerCreate, null, 2));

    // Build an offer cancel transaction
    console.log('\n=== Building OfferCancel Transaction ===');
    const offerCancel = new OfferCancelBuilder(account, sequence + 3)
      .setOfferSequence(123) // Sequence of offer to cancel
      .setFee('100')
      .build();

    console.log('OfferCancel Transaction:');
    console.log(JSON.stringify(offerCancel, null, 2));

    // Note: To actually submit transactions, you need to:
    // 1. Sign the transaction with the account's private key
    // 2. Submit the signed transaction blob

    console.log('\n=== Transaction Submission Flow ===');
    console.log('1. Build transaction (shown above)');
    console.log('2. Sign transaction using crypto.sign()');
    console.log('3. Submit signed blob using client.submit({ tx_blob: "..." })');

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
