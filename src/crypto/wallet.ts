/**
 * Wallet with full local transaction signing
 */

import type { Transaction } from '@/types';
import { sign, generateWallet as generateKeypairWallet } from '@/crypto/keypairs';
import { Serializer } from '@/utils/serializer';

export interface SignedTransaction {
  tx_blob: string;
  tx_json: Transaction;
  hash: string;
}

export class Wallet {
  readonly address: string;
  readonly publicKey: string;
  readonly privateKey: string;
  readonly seed: string;
  private serializer: Serializer;

  constructor(
    address: string,
    publicKey: string,
    privateKey: string,
    seed: string
  ) {
    this.address = address;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.seed = seed;
    this.serializer = new Serializer();
  }

  /**
   * Sign a transaction locally
   * @param tx - Transaction to sign
   * @returns Signed transaction with blob and hash
   */
  sign(tx: Transaction): SignedTransaction {
    // Validate transaction
    if (!tx.transaction_type) {
      throw new Error('Transaction type is required');
    }
    if (!tx.account) {
      throw new Error('Account is required');
    }
    if (tx.account !== this.address) {
      throw new Error(`Transaction account ${tx.account} does not match wallet address ${this.address}`);\n    }

    // Create transaction copy for signing
    const txToSign: Transaction = {
      ...tx,
      signing_pub_key: this.publicKey,
    };

    // Remove any existing signature
    delete txToSign.txn_signature;
    delete txToSign.hash;
    delete txToSign.tx_blob;

    // Serialize transaction for signing
    const serialized = this.serializer.serialize(txToSign);

    // Get transaction hash (SHA-512 half of serialized tx)
    const { sha512Half } = require('@/crypto/hash');
    const txHash = sha512Half(serialized);

    // Sign the hash
    const signature = sign(txHash, this.privateKey);

    // Add signature to transaction
    const signedTx: Transaction = {
      ...txToSign,
      txn_signature: signature,
      hash: Buffer.from(txHash).toString('hex').toUpperCase(),
    };

    // Create transaction blob
    const txBlob = this.serializer.toHex(signedTx);

    return {
      tx_blob: txBlob,
      tx_json: signedTx,
      hash: signedTx.hash!,
    };
  }

  /**
   * Verify a transaction signature
   * @param tx - Signed transaction
   * @returns True if signature is valid
   */
  verify(tx: Transaction): boolean {
    if (!tx.txn_signature || !tx.signing_pub_key) {
      return false;
    }

    const { verify } = require('@/crypto/keypairs');

    // Create copy without signature
    const txCopy: Transaction = { ...tx };
    delete txCopy.txn_signature;
    delete txCopy.hash;
    delete txCopy.tx_blob;

    // Serialize
    const serialized = this.serializer.serialize(txCopy);

    // Get hash
    const { sha512Half } = require('@/crypto/hash');
    const txHash = sha512Half(serialized);

    // Verify
    return verify(txHash, tx.txn_signature, tx.signing_pub_key);
  }

  /**
   * Generate a new wallet
   */
  static generate(): Wallet {
    const wallet = generateKeypairWallet();
    return new Wallet(
      wallet.address,
      wallet.publicKey,
      wallet.privateKey,
      wallet.seed
    );
  }

  /**
   * Create wallet from seed
   */
  static fromSeed(seed: string): Wallet {
    const { decodeSeed, deriveKeypair, deriveAddress } = require('@/crypto/keypairs');

    const seedBytes = decodeSeed(seed);
    const keypair = deriveKeypair(seedBytes);
    const address = deriveAddress(keypair.publicKey);

    return new Wallet(
      address,
      keypair.publicKey,
      keypair.privateKey,
      seed
    );
  }
}

/**
 * Sign a transaction with a private key (standalone function)
 * @param tx - Transaction to sign
 * @param privateKey - Private key in hex
 * @param publicKey - Public key in hex
 * @returns Signed transaction
 */
export function signTransaction(
  tx: Transaction,
  privateKey: string,
  publicKey: string
): SignedTransaction {
  const serializer = new Serializer();

  // Validate
  if (!tx.transaction_type) {
    throw new Error('Transaction type is required');
  }

  // Prepare transaction
  const txToSign: Transaction = {
    ...tx,
    signing_pub_key: publicKey,
  };

  delete txToSign.txn_signature;
  delete txToSign.hash;
  delete txToSign.tx_blob;

  // Serialize
  const serialized = serializer.serialize(txToSign);

  // Get hash
  const { sha512Half } = require('@/crypto/hash');
  const txHash = sha512Half(serialized);

  // Sign
  const signature = sign(txHash, privateKey);

  // Build signed transaction
  const signedTx: Transaction = {
    ...txToSign,
    txn_signature: signature,
    hash: Buffer.from(txHash).toString('hex').toUpperCase(),
  };

  const txBlob = serializer.toHex(signedTx);

  return {
    tx_blob: txBlob,
    tx_json: signedTx,
    hash: signedTx.hash!,
  };
}

/**
 * Verify a transaction signature
 * @param tx - Signed transaction
 * @returns True if valid
 */
export function verifyTransaction(tx: Transaction): boolean {
  if (!tx.txn_signature || !tx.signing_pub_key) {
    return false;
  }

  const { verify } = require('@/crypto/keypairs');
  const serializer = new Serializer();

  // Create copy without signature
  const txCopy: Transaction = { ...tx };
  delete txCopy.txn_signature;
  delete txCopy.hash;
  delete txCopy.tx_blob;

  // Serialize
  const serialized = serializer.serialize(txCopy);

  // Get hash
  const { sha512Half } = require('@/crypto/hash');
  const txHash = sha512Half(serialized);

  // Verify
  return verify(txHash, tx.txn_signature, tx.signing_pub_key);
}

/**
 * Deserialize a transaction blob
 * @param txBlob - Hex-encoded transaction blob
 * @returns Transaction object
 */
export function decodeTransactionBlob(txBlob: string): Transaction {
  const serializer = new Serializer();
  return serializer.fromHex(txBlob);
}

/**
 * Get transaction hash (for signing)
 * @param tx - Transaction
 * @returns Transaction hash
 */
export function getTransactionHash(tx: Transaction): string {
  const serializer = new Serializer();

  const txCopy: Transaction = { ...tx };
  delete txCopy.txn_signature;
  delete txCopy.hash;
  delete txCopy.tx_blob;

  const serialized = serializer.serialize(txCopy);
  const { sha512Half } = require('@/crypto/hash');
  const hash = sha512Half(serialized);

  return Buffer.from(hash).toString('hex').toUpperCase();
}
