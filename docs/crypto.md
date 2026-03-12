# Cryptography Utilities Guide

This guide covers the cryptographic functions available in call-core-lib.

## Table of Contents

- [Wallet Generation](#wallet-generation)
- [Key Derivation](#key-derivation)
- [Signing and Verification](#signing-and-verification)
- [Hash Functions](#hash-functions)
- [Base58 Encoding](#base58-encoding)
- [Validation](#validation)
- [Advanced Usage](#advanced-usage)

## Wallet Generation

### generateWallet()

Generate a complete wallet with all necessary keys:

```typescript
import { generateWallet } from 'call-core-lib';

const wallet = generateWallet();

console.log('Seed:', wallet.seed);           // sxxxxxxxxxx... (starts with 's')
console.log('Address:', wallet.address);     // cxxxxxxxxxx... (starts with 'c')
console.log('Public Key:', wallet.publicKey); // 0330... (66 hex chars)
console.log('Private Key:', wallet.privateKey); // a1b2... (64 hex chars)
```

**Returns:**
- `seed` - Base58Check encoded seed (starts with 's')
- `address` - Call-Core address (starts with 'c')
- `publicKey` - Hex-encoded compressed public key (33 bytes = 66 hex chars)
- `privateKey` - Hex-encoded private key (32 bytes = 64 hex chars)

## Key Derivation

### Generate and Encode Seeds

```typescript
import { generateSeed, encodeSeed, decodeSeed } from 'call-core-lib';

// Generate random seed bytes
const seedBytes = generateSeed();
console.log('Seed bytes:', seedBytes.length, 'bytes'); // 16 bytes

// Encode to Call-Core format (starts with 's')
const seedString = encodeSeed(seedBytes);
console.log('Encoded:', seedString); // sxxxxxxxxxx...

// Decode back to bytes
const decoded = decodeSeed(seedString);
console.log('Decoded:', decoded); // Uint8Array(16)
```

### Derive Keypair from Seed

```typescript
import { deriveKeypair } from 'call-core-lib';

const seed = generateSeed();
const keypair = deriveKeypair(seed);

console.log('Public Key:', keypair.publicKey);   // 0330... (compressed)
console.log('Private Key:', keypair.privateKey); // a1b2...
```

### Derive Address from Public Key

```typescript
import { deriveAddress } from 'call-core-lib';

const address = deriveAddress(keypair.publicKey);
console.log('Address:', address); // cxxxxxxxxxx...
```

### Complete Key Derivation Example

```typescript
import {
  generateSeed,
  encodeSeed,
  decodeSeed,
  deriveKeypair,
  deriveAddress,
} from 'call-core-lib';

// Step 1: Generate seed
const seedBytes = generateSeed();

// Step 2: Encode for storage
const seedString = encodeSeed(seedBytes);
console.log('Store this seed securely:', seedString);

// Step 3: Later, decode the seed
const decodedSeed = decodeSeed(seedString);

// Step 4: Derive keypair
const keypair = deriveKeypair(decodedSeed);

// Step 5: Derive address
const address = deriveAddress(keypair.publicKey);

console.log('Address:', address);
console.log('Public Key:', keypair.publicKey);
```

## Signing and Verification

### Sign a Message

```typescript
import { sign } from 'call-core-lib';

const message = 'Hello, Call-Core!';
const messageHex = Buffer.from(message).toString('hex');

const signature = sign(messageHex, wallet.privateKey);
console.log('Signature:', signature); // Hex-encoded DER signature
```

### Verify a Signature

```typescript
import { verify } from 'call-core-lib';

const isValid = verify(messageHex, signature, wallet.publicKey);
console.log('Valid:', isValid); // true

// Wrong public key
const wrongWallet = generateWallet();
const isInvalid = verify(messageHex, signature, wrongWallet.publicKey);
console.log('Invalid:', isInvalid); // false
```

### Complete Signing Example

```typescript
import { generateWallet, sign, verify } from 'call-core-lib';

// Generate wallet
const wallet = generateWallet();

// Message to sign
const message = 'Important message';
const messageHex = Buffer.from(message).toString('hex');

// Sign
const signature = sign(messageHex, wallet.privateKey);
console.log('Signature:', signature);

// Verify with correct key
const valid = verify(messageHex, signature, wallet.publicKey);
console.log('Signature valid:', valid);

// Verify with wrong key
const otherWallet = generateWallet();
const invalid = verify(messageHex, signature, otherWallet.publicKey);
console.log('Wrong key valid:', invalid);

// Verify tampered message
const tamperedHex = Buffer.from('Tampered message').toString('hex');
const tamperedInvalid = verify(tamperedHex, signature, wallet.publicKey);
console.log('Tampered valid:', tamperedInvalid);
```

## Hash Functions

### SHA-256

```typescript
import { sha256 } from 'call-core-lib';

const data = new TextEncoder().encode('Hello');
const hash = sha256(data); // Uint8Array(32)

console.log(Buffer.from(hash).toString('hex'));
// e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

### SHA-512

```typescript
import { sha512 } from 'call-core-lib';

const data = new TextEncoder().encode('Hello');
const hash = sha512(data); // Uint8Array(64)

console.log(Buffer.from(hash).toString('hex'));
```

### SHA-512 Half

Used in Call-Core ledger hashing:

```typescript
import { sha512Half } from 'call-core-lib';

const data = new TextEncoder().encode('Hello');
const hash = sha512Half(data); // Uint8Array(32) - first 32 bytes of SHA-512
```

### RIPEMD-160

```typescript
import { ripemd160 } from 'call-core-lib';

const data = new TextEncoder().encode('Hello');
const hash = ripemd160(data); // Uint8Array(20)
```

### Double SHA-256

```typescript
import { doubleSha256 } from 'call-core-lib';

const data = new TextEncoder().encode('Hello');
const hash = doubleSha256(data); // SHA-256(SHA-256(data))
```

### Hash160 (Bitcoin-style)

RIPEMD-160(SHA-256(data)) - Used for address derivation:

```typescript
import { hash160 } from 'call-core-lib';

const data = new TextEncoder().encode('Hello');
const hash = hash160(data); // Uint8Array(20)
```

### HMAC-SHA-512

```typescript
import { hmacSha512 } from 'call-core-lib';

const key = new TextEncoder().encode('secret key');
const data = new TextEncoder().encode('message');

const mac = hmacSha512(key, data); // Uint8Array(64)
```

## Base58 Encoding

### Basic Base58

```typescript
import { encodeBase58, decodeBase58 } from 'call-core-lib';

const data = new TextEncoder().encode('Hello World');
const encoded = encodeBase58(data);
console.log('Encoded:', encoded); // JxF12TrwUP45BMd

const decoded = decodeBase58(encoded);
console.log('Decoded:', new TextDecoder().decode(decoded)); // Hello World
```

### Base58Check

Used for seeds and addresses (includes version byte and checksum):

```typescript
import { encodeBase58Check, decodeBase58Check } from 'call-core-lib';

const data = new Uint8Array(20).fill(0xab);
const version = new Uint8Array([0x00]); // Version byte

const encoded = encodeBase58Check(data, version);
console.log('Encoded:', encoded);

const decoded = decodeBase58Check(encoded);
console.log('Version:', decoded.version);   // Uint8Array[0x00]
console.log('Payload:', decoded.payload);   // Uint8Array(20)
```

### Call-Core Specific Versions

```typescript
// Seed version (starts with 's')
const SEED_VERSION = new Uint8Array([0x21]); // 33

// Address version (starts with 'c')
const ADDRESS_VERSION = new Uint8Array([0x00]); // 0

// Encode seed
const seed = generateSeed();
const seedString = encodeBase58Check(seed, SEED_VERSION);
console.log('Seed:', seedString); // s...

// Encode address (from hash160 of public key)
const pubkeyHash = hash160(publicKeyBytes);
const address = encodeBase58Check(pubkeyHash, ADDRESS_VERSION);
console.log('Address:', address); // c...
```

## Validation

### Address Validation

```typescript
import { isValidAddress } from 'call-core-lib';

// Valid Call-Core address
console.log(isValidAddress('cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy')); // true

// Invalid addresses
console.log(isValidAddress(''));                          // false (empty)
console.log(isValidAddress('invalid'));                   // false (too short)
console.log(isValidAddress('rN7n7otQDd6FczFgLdlqtyMVrn3HMfHgFj')); // false (Ripple address)
```

### Secret/Seed Validation

```typescript
import { isValidSecret } from 'call-core-lib';

// Valid seed
console.log(isValidSecret('ss9e7tg3C4NJ3zga9y28gSWhDvhgP')); // true

// Invalid seeds
console.log(isValidSecret(''));           // false
console.log(isValidSecret('notasecret')); // false
console.log(isValidSecret('s'));          // false (too short)
```

### Other Validation Functions

```typescript
import {
  isValidTxHash,
  isValidLedgerHash,
  isValidPublicKey,
  isValidHex,
  isValidCurrency,
  isValidAmount,
} from 'call-core-lib';

// Transaction hash (64 hex chars)
console.log(isValidTxHash('A'.repeat(64))); // true

// Ledger hash (64 hex chars)
console.log(isValidLedgerHash('0'.repeat(64))); // true

// Public key (66 hex chars = 33 bytes compressed)
console.log(isValidPublicKey('0'.repeat(66))); // true

// Hex validation
console.log(isValidHex('AABBCC')); // true
console.log(isValidHex('AABBCC', 6)); // true (exact length)

// Currency code
console.log(isValidCurrency('USD')); // true
console.log(isValidCurrency('CALL')); // false (reserved)
console.log(isValidCurrency('A'.repeat(40))); // true (40-char hex)

// Amount
console.log(isValidAmount('1000000')); // true (native)
console.log(isValidAmount({
  currency: 'USD',
  issuer: 'cGMJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
  value: '100',
})); // true (issued currency)
```

## Advanced Usage

### Seed from Passphrase

```typescript
import { sha512 } from 'call-core-lib';

function seedFromPassphrase(passphrase: string): Uint8Array {
  const data = new TextEncoder().encode(passphrase);
  const hash = sha512(data);
  return hash.slice(0, 16); // Take first 16 bytes
}

const seed = seedFromPassphrase('my secret passphrase');
const keypair = deriveKeypair(seed);
const address = deriveAddress(keypair.publicKey);
```

### Key Derivation Path

```typescript
// Derive multiple keypairs from a single master seed
function deriveKeypairAtIndex(
  masterSeed: Uint8Array,
  index: number
): { publicKey: string; privateKey: string } {
  // Combine master seed with index
  const indexBytes = new Uint8Array(4);
  new DataView(indexBytes.buffer).setUint32(0, index, false);

  const combined = new Uint8Array(masterSeed.length + indexBytes.length);
  combined.set(masterSeed);
  combined.set(indexBytes, masterSeed.length);

  // Hash to get child seed
  const childSeed = sha512(combined).slice(0, 16);

  return deriveKeypair(childSeed);
}

// Generate multiple addresses
const masterSeed = generateSeed();
for (let i = 0; i < 5; i++) {
  const keypair = deriveKeypairAtIndex(masterSeed, i);
  const address = deriveAddress(keypair.publicKey);
  console.log(`Address ${i}:`, address);
}
```

### Message Signing with Prefix

```typescript
// Sign a message with Call-Core prefix (like personal_sign in Ethereum)
function signMessage(message: string, privateKey: string): string {
  const prefix = '\x18Call-Core Signed Message:\n';
  const messageBytes = new TextEncoder().encode(message);
  const prefixBytes = new TextEncoder().encode(prefix + messageBytes.length);

  const combined = new Uint8Array(prefixBytes.length + messageBytes.length);
  combined.set(prefixBytes);
  combined.set(messageBytes, prefixBytes.length);

  const messageHex = Buffer.from(combined).toString('hex');
  return sign(messageHex, privateKey);
}

const signature = signMessage('Hello, World!', wallet.privateKey);
```

### Address from Public Key

Understanding the address derivation:

```typescript
import {
  sha256,
  ripemd160,
  encodeBase58Check,
} from 'call-core-lib';

function deriveAddressDetailed(publicKeyHex: string): string {
  // Step 1: Convert hex public key to bytes
  const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');

  // Step 2: SHA-256 of public key
  const sha256Hash = sha256(publicKeyBytes);

  // Step 3: RIPEMD-160 of SHA-256 hash
  const ripemdHash = ripemd160(sha256Hash);

  // Step 4: Add version byte (0x00 for Call-Core addresses)
  const version = new Uint8Array([0x00]);

  // Step 5: Base58Check encode
  const address = encodeBase58Check(ripemdHash, version);

  return address;
}
```

### Working with Bytes

```typescript
import { concatBytes } from 'call-core-lib';

// Concatenate byte arrays
const a = new Uint8Array([1, 2, 3]);
const b = new Uint8Array([4, 5, 6]);
const c = new Uint8Array([7, 8, 9]);

const combined = concatBytes(a, b, c);
console.log(combined); // Uint8Array [1, 2, 3, 4, 5, 6, 7, 8, 9]
```
