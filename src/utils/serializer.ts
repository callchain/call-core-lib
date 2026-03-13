/**
 * Binary serialization for Call-Core transactions
 * Implements the STObject binary format similar to Ripple
 */

import type {
  Transaction,
  Amount,
  IssuedCurrencyAmount,
  Memo,
  SignerEntry,
} from '@/types';

import { sha512Half } from '@/crypto/hash';
import { encodeBase58Check, decodeBase58Check } from '@/crypto/base58';

// Field type constants
const FieldType = {
  STObject: 0x0e,
  STArray: 0x0f,
  UInt8: 0x10,
  UInt16: 0x11,
  UInt32: 0x12,
  UInt64: 0x13,
  Hash128: 0x14,
  Hash256: 0x15,
  Amount: 0x16,
  VL: 0x17,  // Variable length
  Account: 0x18,
  PathSet: 0x19,
  Vector256: 0x1a,
} as const;

// Transaction type mapping (string to number)
const TX_TYPES: Record<string, number> = {
  Payment: 0,
  AccountSet: 3,
  SetRegularKey: 5,
  OfferCreate: 7,
  OfferCancel: 8,
  SignerListSet: 12,
  DepositPreauth: 19,
  TrustSet: 20,
};

// Reverse mapping (number to string) for deserialization
const TX_TYPES_REVERSE: Record<number, string> = Object.fromEntries(
  Object.entries(TX_TYPES).map(([k, v]) => [v, k])
);

// Field codes for common fields
const FieldIds: Record<string, [number, number]> = {
  // Type code, Field code
  TransactionType: [FieldType.UInt16, 0x02],
  Flags: [FieldType.UInt32, 0x02],
  SourceTag: [FieldType.UInt32, 0x03],
  Sequence: [FieldType.UInt32, 0x04],
  LastLedgerSequence: [FieldType.UInt32, 0x1b],
  AccountTxnID: [FieldType.Hash256, 0x05],
  Fee: [FieldType.UInt64, 0x08],
  SigningPubKey: [FieldType.VL, 0x03],
  TxnSignature: [FieldType.VL, 0x04],
  Account: [FieldType.Account, 0x01],
  Destination: [FieldType.Account, 0x03],
  Amount: [FieldType.Amount, 0x01],
  SendMax: [FieldType.Amount, 0x09],
  DestinationTag: [FieldType.UInt32, 0x0e],
  InvoiceID: [FieldType.Hash256, 0x11],
  Domain: [FieldType.VL, 0x07],
  EmailHash: [FieldType.Hash128, 0x01],
  MessageKey: [FieldType.VL, 0x02],
  TransferRate: [FieldType.UInt32, 0x08],
  SetFlag: [FieldType.UInt32, 0x0f],
  ClearFlag: [FieldType.UInt32, 0x10],
  SignerQuorum: [FieldType.UInt32, 0x14],
  LimitAmount: [FieldType.Amount, 0x03],
  QualityIn: [FieldType.UInt32, 0x15],
  QualityOut: [FieldType.UInt32, 0x16],
  TakerPays: [FieldType.Amount, 0x04],
  TakerGets: [FieldType.Amount, 0x05],
  OfferSequence: [FieldType.UInt32, 0x19],
  Expiration: [FieldType.UInt32, 0x0a],
  RegularKey: [FieldType.Account, 0x08],
  SignerEntries: [FieldType.STArray, 0x05],
  Authorize: [FieldType.Account, 0x16],
  Unauthorize: [FieldType.Account, 0x17],
  Memos: [FieldType.STArray, 0x09],
};

export class Serializer {
  private bytes: number[] = [];

  /**
   * Serialize a transaction to binary
   */
  serialize(tx: Transaction): Uint8Array {
    this.bytes = [];

    // Sort fields by type code then field code
    const sortedFields = this.getSortedFields(tx);

    for (const [fieldName, value] of sortedFields) {
      if (value === undefined || value === null) continue;
      this.serializeField(fieldName, value);
    }

    // Add object end marker
    this.pushByte(0xe1);

    return new Uint8Array(this.bytes);
  }

  /**
   * Serialize transaction for submission (includes signature)
   */
  serializeForSubmission(tx: Transaction): Uint8Array {
    // Use getSortedFields which already includes signature
    this.bytes = [];

    const sortedFields = this.getSortedFields(tx);

    for (const [fieldName, value] of sortedFields) {
      if (value === undefined || value === null) continue;
      this.serializeField(fieldName, value);
    }

    // Add object end marker
    this.pushByte(0xe1);

    return new Uint8Array(this.bytes);
  }

  /**
   * Deserialize binary to transaction
   */
  deserialize(bytes: Uint8Array): Transaction {
    const tx: Partial<Transaction> = {};
    let i = 0;

    while (i < bytes.length) {
      if (bytes[i] === 0xe1) break; // End marker

      const [fieldName, value, nextIndex] = this.deserializeField(bytes, i);
      if (fieldName) {
        (tx as Record<string, unknown>)[fieldName] = value;
      }
      i = nextIndex;
    }

    return tx as Transaction;
  }

  /**
   * Get transaction hash (for signing)
   */
  getTransactionHash(tx: Transaction): Uint8Array {
    // Create copy without signature
    const txCopy = { ...tx };
    delete txCopy.txn_signature;
    delete txCopy.tx_blob;
    delete txCopy.hash;

    const serialized = this.serialize(txCopy);
    return sha512Half(serialized);
  }

  /**
   * Convert transaction to hex blob for submission
   * Includes signature if present
   */
  toHex(tx: Transaction): string {
    const serialized = this.serializeForSubmission(tx);
    return Array.from(serialized)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  /**
   * Parse hex blob to transaction
   */
  fromHex(hex: string): Transaction {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return this.deserialize(bytes);
  }

  private getSortedFields(tx: Transaction): [string, unknown][] {
    const fields: [string, unknown][] = [];

    // Common fields in specific order
    const commonFieldOrder = [
      'transaction_type',
      'flags',
      'source_tag',
      'account',
      'sequence',
      'last_ledger_sequence',
      'account_txn_id',
      'fee',
      'signing_pub_key',
    ];

    for (const key of commonFieldOrder) {
      if (key in tx && tx[key as keyof Transaction] !== undefined) {
        const tuple: [string, unknown] = [this.toCamelCase(key), tx[key as keyof Transaction]];
        fields.push(tuple);
      }
    }

    // Transaction-specific fields
    const remainingFields = Object.entries(tx).filter(
      ([key]) => !commonFieldOrder.includes(key) && !['txn_signature', 'hash', 'tx_blob'].includes(key)
    );

    // Sort by field ID
    remainingFields.sort(([a], [b]) => {
      const idA = this.getFieldId(this.toCamelCase(a));
      const idB = this.getFieldId(this.toCamelCase(b));
      if (idA[0] !== idB[0]) return idA[0] - idB[0];
      return idA[1] - idB[1];
    });

    const mappedFields = remainingFields.map(([k, v]): [string, unknown] => [this.toCamelCase(k), v]);
    fields.push(...mappedFields);

    // Signature comes last
    if (tx.txn_signature) {
      fields.push(['TxnSignature', tx.txn_signature]);
    }

    return fields;
  }

  private toCamelCase(snakeCase: string): string {
    return snakeCase
      .split('_')
      .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/^[a-z]/, c => c.toUpperCase());
  }

  private getFieldId(fieldName: string): [number, number] {
    return FieldIds[fieldName] || [FieldType.STObject, 0x00];
  }

  private serializeField(fieldName: string, value: unknown): void {
    const fieldId = this.getFieldId(fieldName);

    // Write field header
    if (fieldId[0] < 16 && fieldId[1] < 16) {
      this.pushByte((fieldId[0] << 4) | fieldId[1]);
    } else if (fieldId[0] < 16) {
      this.pushByte(fieldId[0] << 4);
      this.pushByte(fieldId[1]);
    } else {
      this.pushByte(0);
      this.pushByte(fieldId[0]);
      this.pushByte(fieldId[1]);
    }

    // Write field value
    switch (fieldId[0]) {
      case FieldType.UInt16:
        // Handle transaction type string to number conversion
        if (fieldName === 'TransactionType' && typeof value === 'string') {
          const txType = TX_TYPES[value];
          if (txType === undefined) {
            throw new Error(`Unknown transaction type: ${value}`);
          }
          this.pushUInt16(txType);
        } else {
          this.pushUInt16(value as number);
        }
        break;
      case FieldType.UInt32:
        this.pushUInt32(value as number);
        break;
      case FieldType.UInt64:
        this.pushUInt64(BigInt(value as string | number));
        break;
      case FieldType.Hash128:
        this.pushHash(value as string, 16);
        break;
      case FieldType.Hash256:
        this.pushHash(value as string, 32);
        break;
      case FieldType.Amount:
        this.pushAmount(value as Amount);
        break;
      case FieldType.VL:
        this.pushVL(value as string);
        break;
      case FieldType.Account:
        this.pushAccount(value as string);
        break;
      case FieldType.STArray:
        this.pushSTArray(fieldName, value as unknown[]);
        break;
      default:
        throw new Error(`Unsupported field type: ${fieldId[0]}`);
    }
  }

  private deserializeField(bytes: Uint8Array, start: number): [string | null, unknown, number] {
    let i = start;

    // Read field header
    let typeCode: number;
    let fieldCode: number;

    const firstByte = bytes[i++];
    if (firstByte === 0) {
      typeCode = bytes[i++];
      fieldCode = bytes[i++];
    } else if ((firstByte & 0x0f) === 0) {
      typeCode = firstByte >> 4;
      fieldCode = bytes[i++];
    } else {
      typeCode = firstByte >> 4;
      fieldCode = firstByte & 0x0f;
    }

    const fieldName = this.getFieldNameById(typeCode, fieldCode);

    switch (typeCode) {
      case FieldType.UInt16:
        const uint16Value = this.readUInt16(bytes, i);
        // Convert transaction type number back to string
        if (fieldName === 'transaction_type') {
          return [fieldName, TX_TYPES_REVERSE[uint16Value] || uint16Value, i + 2];
        }
        return [fieldName, uint16Value, i + 2];
      case FieldType.UInt32:
        return [fieldName, this.readUInt32(bytes, i), i + 4];
      case FieldType.UInt64:
        return [fieldName, this.readUInt64(bytes, i).toString(), i + 8];
      case FieldType.Hash128:
        return [fieldName, this.readHash(bytes, i, 16), i + 16];
      case FieldType.Hash256:
        return [fieldName, this.readHash(bytes, i, 32), i + 32];
      case FieldType.Amount:
        return [fieldName, this.readAmount(bytes, i), i + 8];
      case FieldType.VL:
        return this.readVL(bytes, i, fieldName);
      case FieldType.Account:
        return [fieldName, this.readAccount(bytes, i), i + 21];
      default:
        return [null, null, i];
    }
  }

  private getFieldNameById(typeCode: number, fieldCode: number): string | null {
    for (const [name, id] of Object.entries(FieldIds)) {
      if (id[0] === typeCode && id[1] === fieldCode) {
        // Convert PascalCase to snake_case for consistency with transaction objects
        return name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
      }
    }
    return null;
  }

  private pushByte(byte: number): void {
    this.bytes.push(byte & 0xff);
  }

  private pushUInt16(value: number): void {
    this.pushByte((value >> 8) & 0xff);
    this.pushByte(value & 0xff);
  }

  private pushUInt32(value: number): void {
    this.pushByte((value >> 24) & 0xff);
    this.pushByte((value >> 16) & 0xff);
    this.pushByte((value >> 8) & 0xff);
    this.pushByte(value & 0xff);
  }

  private pushUInt64(value: BigInt): void {
    const v = BigInt(value.toString());
    for (let i = 7; i >= 0; i--) {
      this.pushByte(Number((v >> BigInt(i * 8)) & BigInt(0xff)));
    }
  }

  private pushHash(hash: string, length: number): void {
    const cleanHash = hash.replace(/^0x/, '');
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length * 2 && i < cleanHash.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHash.substring(i, i + 2), 16);
    }
    for (const b of bytes) {
      this.pushByte(b);
    }
  }

  private pushAmount(amount: Amount): void {
    if (typeof amount === 'string') {
      // Native CALL amount
      const drops = BigInt(amount);
      const isPositive = drops >= 0n;

      // First bit = 0 for native, second bit = sign (0 = positive, 1 = negative)
      // Next 62 bits = value (not used for native)
      // Last 64 bits = amount

      if (drops > 0x7FFFFFFFFFFFFFFFn) {
        throw new Error('Amount too large');
      }

      const highWord = isPositive ? 0x40000000 : 0x00000000;
      const lowWord = Number(drops & 0xFFFFFFFFn);

      this.pushUInt32(highWord);
      this.pushUInt32(0);
      this.pushUInt32(0);
      this.pushUInt32(lowWord);
    } else {
      // Issued currency
      this.pushIssuedCurrencyAmount(amount);
    }
  }

  private pushIssuedCurrencyAmount(amount: IssuedCurrencyAmount): void {
    // First bit = 1 for issued currency
    const value = parseFloat(amount.value);
    const isNegative = value < 0;
    const absValue = Math.abs(value);

    // Encode mantissa and exponent
    let exponent = 0;
    let mantissa = absValue;
    while (mantissa >= 1 && exponent > -96) {
      mantissa /= 10;
      exponent--;
    }
    while (mantissa < 0.1 && exponent < 80) {
      mantissa *= 10;
      exponent++;
    }

    const mantissaInt = BigInt(Math.round(mantissa * 1e15));

    // Not-a-number bit + sign + exponent
    let highWord = 0x80000000; // Issued currency bit
    if (isNegative) highWord |= 0x40000000;
    highWord |= ((exponent + 97) & 0xff) << 16;
    highWord |= Number(mantissaInt >> 32n) & 0xffff;

    this.pushUInt32(highWord);
    this.pushUInt32(Number(mantissaInt & 0xffffffffn));

    // Currency (20 bytes)
    this.pushCurrency(amount.currency);

    // Issuer (20 bytes)
    const issuerBytes = this.accountToBytes(amount.issuer);
    for (const b of issuerBytes) {
      this.pushByte(b);
    }
  }

  private pushCurrency(currency: string): void {
    const bytes = new Uint8Array(20);

    if (currency.length === 3) {
      // Standard currency code
      const code = currency.toUpperCase();
      bytes[12] = code.charCodeAt(0);
      bytes[13] = code.charCodeAt(1);
      bytes[14] = code.charCodeAt(2);
    } else if (currency.length === 40) {
      // 40-char hex
      for (let i = 0; i < 40; i += 2) {
        bytes[i / 2] = parseInt(currency.substring(i, i + 2), 16);
      }
    }

    for (const b of bytes) {
      this.pushByte(b);
    }
  }

  private pushVL(value: string): void {
    const bytes = value.length % 2 === 0 && /^[0-9a-fA-F]*$/.test(value)
      ? this.hexToBytes(value)
      : new TextEncoder().encode(value);

    // Length prefix
    if (bytes.length <= 192) {
      this.pushByte(bytes.length);
    } else if (bytes.length <= 12480) {
      this.pushByte(193 + Math.floor((bytes.length - 193) / 256));
      this.pushByte((bytes.length - 193) % 256);
    } else {
      this.pushByte(241 + Math.floor((bytes.length - 12481) / 65536));
      this.pushByte(Math.floor(((bytes.length - 12481) % 65536) / 256));
      this.pushByte((bytes.length - 12481) % 256);
    }

    for (const b of bytes) {
      this.pushByte(b);
    }
  }

  private pushAccount(account: string): void {
    const bytes = this.accountToBytes(account);
    this.pushByte(bytes.length);
    for (const b of bytes) {
      this.pushByte(b);
    }
  }

  private accountToBytes(account: string): Uint8Array {
    try {
      const decoded = decodeBase58Check(account);
      return decoded.payload;
    } catch {
      throw new Error(`Invalid account: ${account}`);
    }
  }

  private pushSTArray(fieldName: string, array: unknown[]): void {
    for (const item of array) {
      if (fieldName === 'Memos') {
        this.serializeMemo(item as Memo);
      } else if (fieldName === 'SignerEntries') {
        this.serializeSignerEntry(item as SignerEntry);
      }
    }
    // Array end marker
    this.pushByte(0xf1);
  }

  private serializeMemo(memo: Memo): void {
    // Memo object marker
    this.pushByte(0xea); // Memo field

    if (memo.memo_type) {
      this.pushByte(0x7c); // MemoType
      this.pushVL(memo.memo_type);
    }
    if (memo.memo_data) {
      this.pushByte(0x7d); // MemoData
      this.pushVL(memo.memo_data);
    }
    if (memo.memo_format) {
      this.pushByte(0x7e); // MemoFormat
      this.pushVL(memo.memo_format);
    }

    // Object end
    this.pushByte(0xe1);
  }

  private serializeSignerEntry(entry: SignerEntry): void {
    // SignerEntry marker
    this.pushByte(0x13);
    this.pushByte(0x03);

    this.pushByte(0x93); // SignerEntry field
    this.pushAccount(entry.account);

    this.pushByte(0x12);
    this.pushByte(0x04);
    this.pushUInt16(entry.weight);

    // Object end
    this.pushByte(0xe1);
  }

  private hexToBytes(hex: string): Uint8Array {
    const clean = hex.replace(/^0x/, '');
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
      bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
    }
    return bytes;
  }

  // Deserialization readers
  private readUInt16(bytes: Uint8Array, offset: number): number {
    return (bytes[offset] << 8) | bytes[offset + 1];
  }

  private readUInt32(bytes: Uint8Array, offset: number): number {
    return (
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]
    );
  }

  private readUInt64(bytes: Uint8Array, offset: number): bigint {
    let value = 0n;
    for (let i = 0; i < 8; i++) {
      value = (value << 8n) | BigInt(bytes[offset + i]);
    }
    return value;
  }

  private readHash(bytes: Uint8Array, offset: number, length: number): string {
    return Array.from(bytes.slice(offset, offset + length))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  private readAmount(bytes: Uint8Array, offset: number): Amount {
    const isNative = (bytes[offset] & 0x80) === 0;

    if (isNative) {
      // Native amount
      const lowBits = this.readUInt32(bytes, offset + 4);
      const highBits = this.readUInt32(bytes, offset);
      const isPositive = (highBits & 0x40000000) !== 0;

      const value = BigInt(lowBits);
      return isPositive ? value.toString() : (-value).toString();
    } else {
      // Issued currency
      const highWord = this.readUInt32(bytes, offset);
      const lowWord = this.readUInt32(bytes, offset + 4);
      const currency = this.readCurrency(bytes, offset + 8);
      const issuer = this.readAccount(bytes, offset + 28);

      const isNegative = (highWord & 0x40000000) !== 0;
      const exponent = ((highWord >> 16) & 0xff) - 97;
      const mantissa = ((BigInt(highWord & 0xffff) << 32n) | BigInt(lowWord)) / 1000000000000000n;

      let value = Number(mantissa) * Math.pow(10, exponent);
      if (isNegative) value = -value;

      return {
        value: value.toString(),
        currency,
        issuer,
      };
    }
  }

  private readCurrency(bytes: Uint8Array, offset: number): string {
    // Check if standard currency
    const isStandard = bytes.slice(offset, offset + 12).every(b => b === 0) &&
                       bytes.slice(offset + 15, offset + 20).every(b => b === 0);

    if (isStandard) {
      return String.fromCharCode(
        bytes[offset + 12],
        bytes[offset + 13],
        bytes[offset + 14]
      );
    }

    return Array.from(bytes.slice(offset, offset + 20))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  private readVL(bytes: Uint8Array, offset: number, fieldName: string | null): [string | null, unknown, number] {
    let length = bytes[offset];
    let i = offset + 1;

    if (length < 193) {
      // Single byte length
    } else if (length < 241) {
      length = 193 + ((length - 193) * 256) + bytes[i++];
    } else {
      length = 12481 + ((length - 241) * 65536) + (bytes[i] * 256) + bytes[i + 1];
      i += 2;
    }

    const data = bytes.slice(i, i + length);
    const hex = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    return [fieldName, hex, i + length];
  }

  private readAccount(bytes: Uint8Array, offset: number): string {
    const length = bytes[offset];
    const payload = bytes.slice(offset + 1, offset + 1 + length);

    // Re-encode as base58check address with version byte 0x57 for 'c' prefix
    const version = new Uint8Array([0x57]);
    return encodeBase58Check(payload, version);
  }
}

// Singleton instance
export const serializer = new Serializer();
