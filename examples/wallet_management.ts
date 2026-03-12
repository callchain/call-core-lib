/**
 * Wallet management example
 */

import {
  generateWallet,
  deriveKeypair,
  deriveAddress,
  generateSeed,
  encodeSeed,
  decodeSeed,
  sign,
  verify,
  isValidAddress,
  isValidSecret,
  sha256,
  sha512Half,
} from '@/index';

async function main() {
  // Generate a new wallet
  console.log('=== Generating New Wallet ===');
  const wallet = generateWallet();

  console.log('Seed:', wallet.seed);
  console.log('Address:', wallet.address);
  console.log('Public Key:', wallet.publicKey);
  console.log('Private Key:', wallet.privateKey);

  // Validate
  console.log('\n=== Validation ===');
  console.log('Is valid address:', isValidAddress(wallet.address));
  console.log('Is valid secret:', isValidSecret(wallet.seed));

  // Derive from seed
  console.log('\n=== Key Derivation ===');
  const decodedSeed = decodeSeed(wallet.seed);
  console.log('Decoded seed (hex):', Buffer.from(decodedSeed).toString('hex'));

  const keypair = deriveKeypair(decodedSeed);
  console.log('Derived public key:', keypair.publicKey);
  console.log('Derived private key:', keypair.privateKey);

  const derivedAddress = deriveAddress(keypair.publicKey);
  console.log('Derived address:', derivedAddress);
  console.log('Matches original:', derivedAddress === wallet.address);

  // Signing and verification
  console.log('\n=== Signing and Verification ===');
  const message = 'Hello, Call-Core!';
  const messageHex = Buffer.from(message).toString('hex');
  console.log('Message:', message);
  console.log('Message (hex):', messageHex);

  const signature = sign(messageHex, wallet.privateKey);
  console.log('Signature:', signature);
  console.log('Signature length:', signature.length, 'chars');

  const isValid = verify(messageHex, signature, wallet.publicKey);
  console.log('Signature valid:', isValid);

  // Try with wrong key
  const wrongWallet = generateWallet();
  const isValidWrong = verify(messageHex, signature, wrongWallet.publicKey);
  console.log('Valid with wrong key:', isValidWrong);

  // Hash functions
  console.log('\n=== Hash Functions ===');
  const data = Buffer.from('Hello, Call-Core!');

  const sha256Hash = sha256(data);
  console.log('SHA-256:', Buffer.from(sha256Hash).toString('hex'));

  const sha512HalfHash = sha512Half(data);
  console.log('SHA-512 Half:', Buffer.from(sha512HalfHash).toString('hex'));

  // Generate multiple wallets
  console.log('\n=== Multiple Wallets ===');
  for (let i = 0; i < 3; i++) {
    const w = generateWallet();
    console.log(`Wallet ${i + 1}:`);
    console.log(`  Address: ${w.address}`);
    console.log(`  Seed: ${w.seed}`);
  }

  // Seed encoding/decoding
  console.log('\n=== Seed Encoding ===');
  const seed = generateSeed();
  console.log('Raw seed (hex):', Buffer.from(seed).toString('hex'));

  const encoded = encodeSeed(seed);
  console.log('Encoded seed:', encoded);

  const decoded = decodeSeed(encoded);
  console.log('Decoded matches:', Buffer.from(decoded).toString('hex') === Buffer.from(seed).toString('hex'));
}

main().catch(console.error);
