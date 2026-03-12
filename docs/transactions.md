# Transaction Building Guide

This guide covers building, signing, and submitting transactions on the Call-Core network.

## Table of Contents

- [Transaction Basics](#transaction-basics)
- [Payment](#payment)
- [AccountSet](#accountset)
- [TrustSet](#trustset)
- [OfferCreate](#offercreate)
- [OfferCancel](#offercancel)
- [SetRegularKey](#setregularkey)
- [SignerListSet](#signerlistset)
- [DepositPreauth](#depositpreauth)
- [Signing Transactions](#signing-transactions)
- [Submitting Transactions](#submitting-transactions)
- [Transaction Flags](#transaction-flags)
- [Common Fields](#common-fields)

## Transaction Basics

Every transaction has:
- **Account**: The sender's address
- **Sequence**: The transaction sequence number
- **Fee**: The transaction fee in drops
- **TransactionType**: The type of transaction

```typescript
import { PaymentBuilder, callToDrops } from 'call-core-lib';

const payment = new PaymentBuilder('cSender...', 1)  // account, sequence
  .setFee('100')                                     // fee in drops
  .setDestination('cDestination...')
  .setAmount(callToDrops('10'))                      // 10 CALL
  .build();
```

## Payment

Send CALL or issued currencies to another account.

```typescript
import { PaymentBuilder, callToDrops, issuedCurrencyAmount } from 'call-core-lib';

// Send CALL
const payment = new PaymentBuilder('cSender...', 1)
  .setDestination('cDestination...')
  .setAmount(callToDrops('10'))           // 10 CALL
  .setFee('100')
  .setDestinationTag(12345)               // Optional: destination tag
  .setInvoiceId('ABC123...')              // Optional: 256-bit invoice ID
  .build();

// Send issued currency
const paymentIOU = new PaymentBuilder('cSender...', 1)
  .setDestination('cDestination...')
  .setAmount(issuedCurrencyAmount('100', 'USD', 'cIssuer...'))
  .setSendMax(issuedCurrencyAmount('110', 'USD', 'cIssuer...'))
  .setPartialPayment()                    // Allow partial payment
  .build();
```

**Payment flags:**
- `tfPartialPayment` - Allow partial payment (for cross-currency)
- `tfNoDirectCall` - Do not use default path
- `tfLimitQuality` - Only take offers at requested quality

## AccountSet

Configure account settings.

```typescript
import { AccountSetBuilder } from 'call-core-lib';

const accountSet = new AccountSetBuilder('cAccount...', 1)
  .setDomain('example.com')               // Domain (auto-encoded to hex)
  .setEmailHash('ABC123...')              // 32-byte email hash
  .setMessageKey('...')                   // Public key for encrypted messages
  .setTransferRate(1000000001)            // Transfer fee (0% = 0, 0.01% = 1000000001)
  .setTickSize(5)                         // Tick size for offers (3-15)
  .requireDestTag()                       // Require destination tag
  .requireAuth()                          // Require authorization for trust lines
  .disallowCall()                         // Disallow incoming CALL
  .setFee('100')
  .build();
```

**AccountSet flags:**
- `tfRequireDestTag` - Require destination tags
- `tfOptionalDestTag` - Make destination tags optional
- `tfRequireAuth` - Require authorization for trust lines
- `tfOptionalAuth` - Make trust line authorization optional
- `tfDisallowCall` - Disallow incoming CALL
- `tfAllowCall` - Allow incoming CALL

**Clearing flags:**

```typescript
// Clear previously set flags
const accountSet = new AccountSetBuilder('cAccount...', 2)
  .clearFlag(TxFlags.tfRequireDestTag)    // Remove dest tag requirement
  .build();
```

## TrustSet

Create or modify a trust line.

```typescript
import { TrustSetBuilder } from 'call-core-lib';

const trustSet = new TrustSetBuilder('cAccount...', 1)
  .setLimitAmount({
    currency: 'USD',
    issuer: 'cIssuer...',
    value: '10000',                       // Trust limit
  })
  .setQualityIn(1000000000)              // Quality for incoming payments
  .setQualityOut(1000000000)             // Quality for outgoing payments
  .setNoCall()                           // Disallow CALL balancing
  .setFreeze()                           // Freeze the trust line
  .setFee('100')
  .build();
```

**TrustSet flags:**
- `tfSetAuth` - Authorize trust line (issuer only)
- `tfSetNoCall` - Disallow CALL for this trust line
- `tfClearNoCall` - Allow CALL for this trust line
- `tfSetFreeze` - Freeze the trust line
- `tfClearFreeze` - Unfreeze the trust line

## OfferCreate

Create an order in the decentralized exchange.

```typescript
import { OfferCreateBuilder, callToDrops } from 'call-core-lib';

// Offer 100 CALL for USD
const offer = new OfferCreateBuilder('cAccount...', 1)
  .setTakerPays({                         // What the taker pays (you receive)
    currency: 'USD',
    issuer: 'cIssuer...',
    value: '100',
  })
  .setTakerGets(callToDrops('1000'))      // What the taker gets (you sell)
  .setExpiration(1234567890)              // Expiration timestamp
  .setOfferSequence(123)                  // Sequence of offer to replace
  .setPassive()                           // Don't take existing offers
  .setSell()                              // Sell exact amount (TakerGets)
  .setImmediateOrCancel()                 // Fill or cancel immediately
  .setFillOrKill()                        // Fill completely or fail
  .setFee('100')
  .build();
```

**OfferCreate flags:**
- `tfPassive` - Don't take existing offers
- `tfImmediateOrCancel` - Fill what you can, cancel the rest
- `tfFillOrKill` - Fill completely or fail
- `tfSell` - Sell exact TakerGets amount

## OfferCancel

Cancel an existing offer.

```typescript
import { OfferCancelBuilder } from 'call-core-lib';

const cancel = new OfferCancelBuilder('cAccount...', 1)
  .setOfferSequence(123)                  // Sequence of offer to cancel
  .setFee('100')
  .build();
```

## SetRegularKey

Set or clear the regular key for an account.

```typescript
import { SetRegularKeyBuilder } from 'call-core-lib';

// Set regular key
const setKey = new SetRegularKeyBuilder('cAccount...', 1)
  .setRegularKey('cNewKey...')            // Address of regular key
  .setFee('100')
  .build();

// Clear regular key
const clearKey = new SetRegularKeyBuilder('cAccount...', 2)
  .setRegularKey(null)                    // Remove regular key
  .setFee('100')
  .build();
```

## SignerListSet

Configure multi-signing for an account.

```typescript
import { SignerListSetBuilder } from 'call-core-lib';

const signerList = new SignerListSetBuilder('cAccount...', 1)
  .setSignerQuorum(2)                     // Required signatures (2 of below)
  .addSigner('cSigner1...', 1)            // Address and weight
  .addSigner('cSigner2...', 1)
  .addSigner('cSigner3...', 1)
  .setFee('100')
  .build();
```

**Setting specific signers:**

```typescript
const signerList = new SignerListSetBuilder('cAccount...', 1)
  .setSignerQuorum(3)
  .setSignerEntries([
    { account: 'cSigner1...', weight: 1 },
    { account: 'cSigner2...', weight: 2 },
    { account: 'cSigner3...', weight: 3 },
  ])
  .setFee('100')
  .build();
```

To delete a signer list, set quorum to 0 with no signers.

## DepositPreauth

Authorize or unauthorize accounts for depositing.

```typescript
import { DepositPreauthBuilder } from 'call-core-lib';

// Authorize an account
const authorize = new DepositPreauthBuilder('cAccount...', 1)
  .authorize('cAuthorized...')
  .setFee('100')
  .build();

// Unauthorize an account
const unauthorize = new DepositPreauthBuilder('cAccount...', 2)
  .unauthorize('cAuthorized...')
  .setFee('100')
  .build();
```

## Signing Transactions

Transactions must be signed before submission.

```typescript
import { sign, generateWallet } from 'call-core-lib';

// Generate or use existing wallet
const wallet = generateWallet();

// Build transaction
const tx = new PaymentBuilder(wallet.address, 1)
  .setDestination('cDestination...')
  .setAmount('1000000')
  .setFee('100')
  .build();

// Convert to JSON and sign
const txJson = JSON.stringify(tx);
const txHex = Buffer.from(txJson).toString('hex');
const signature = sign(txHex, wallet.privateKey);

// Add signature to transaction (implementation depends on serialization format)
```

**Note:** Full transaction serialization and submission requires encoding the signed transaction to the Call-Core binary format. This is typically done with a separate serialization library or the node's `sign` RPC method (admin only).

## Submitting Transactions

### Using RPC

```typescript
import { RpcClient } from 'call-core-lib';

const client = new RpcClient({ server: 'http://localhost:5005' });

// Submit signed transaction blob
const result = await client.submit({
  tx_blob: '12000022000000002400000001...',  // Signed transaction hex
  fail_hard: false,
});

console.log(result.engine_result);      // "tesSUCCESS" for success
console.log(result.engine_result_code);
console.log(result.engine_result_message);
console.log(result.tx_json);            // Transaction details with hash
```

### Using WebSocket

```typescript
import { WebSocketClient } from 'call-core-lib';

const ws = new WebSocketClient({ url: 'ws://localhost:6005' });
await ws.connect();

const result = await ws.submit({
  tx_blob: '12000022000000002400000001...',
});
```

### Transaction Results

Common engine results:
- `tesSUCCESS` - Transaction succeeded
- `tecPATH_DRY` - Path could not send full amount
- `tecPATH_PARTIAL` - Path could not send full amount
- `tecNO_DST` - Destination does not exist
- `tecNO_DST_INSUF_CALL` - Destination lacks CALL for reserves
- `tecUNFUNDED` - Not enough funds
- `tecINSUF_RESERVE_LINE` - Insufficient reserve for trust line
- `tecINSUF_RESERVE_OFFER` - Insufficient reserve for offer
- `tefBAD_AUTH` - Transaction not authorized
- `tefPAST_SEQ` - Transaction sequence too old

## Transaction Flags

```typescript
import { TxFlags } from 'call-core-lib';

// Universal
TxFlags.tfFullyCanonicalSig    // 0x80000000

// Payment
TxFlags.tfNoDirectCall         // 0x00010000
TxFlags.tfPartialPayment       // 0x00020000
TxFlags.tfLimitQuality         // 0x00040000
TxFlags.tfNoCallDirect         // 0x00080000

// AccountSet
TxFlags.tfRequireDestTag       // 0x00010000
TxFlags.tfOptionalDestTag      // 0x00020000
TxFlags.tfRequireAuth          // 0x00040000
TxFlags.tfOptionalAuth         // 0x00080000
TxFlags.tfDisallowCall         // 0x00100000
TxFlags.tfAllowCall            // 0x00200000

// OfferCreate
TxFlags.tfPassive              // 0x00010000
TxFlags.tfImmediateOrCancel    // 0x00020000
TxFlags.tfFillOrKill           // 0x00040000
TxFlags.tfSell                 // 0x00080000

// TrustSet
TxFlags.tfSetAuth              // 0x00010000
TxFlags.tfSetNoCall            // 0x00020000
TxFlags.tfClearNoCall          // 0x00040000
TxFlags.tfSetFreeze            // 0x00100000
TxFlags.tfClearFreeze          // 0x00200000
```

## Common Fields

All transaction builders support these methods:

```typescript
// Set fee
builder.setFee('100');

// Set sequence (usually done in constructor)
// builder.setSequence(1);  // Not implemented, use constructor

// Set transaction flags
builder.setFlags(TxFlags.tfFullyCanonicalSig);

// Add memos
builder.addMemo({
  memo_type: '...',     // hex string
  memo_data: '...',     // hex string
  memo_format: '...',   // hex string
});

// Add text memo (converts text to hex)
builder.addTextMemo('Hello, Call-Core!');

// Set last ledger sequence (expiration)
builder.setLastLedgerSequence(1000);

// Set signing public key
builder.setSigningPubKey(wallet.publicKey);
```

## Using createTransaction

For dynamic transaction creation:

```typescript
import { createTransaction, TxTypeString } from 'call-core-lib';

const type: TxTypeString = 'Payment';
const builder = createTransaction(type, 'cAccount...', 1);

// Cast to specific builder type
if (builder instanceof PaymentBuilder) {
  builder
    .setDestination('cDestination...')
    .setAmount('1000000')
    .build();
}
```
