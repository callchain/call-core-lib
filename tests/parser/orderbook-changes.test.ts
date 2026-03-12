/**
 * Orderbook changes parser tests
 */

import { parseOrderbookChanges } from '@/parser/orderbook-changes';
import type { RawMetadata } from '@/parser/types';

describe('Orderbook Changes Parser', () => {
  it('should parse created offer', () => {
    const metadata: RawMetadata = {
      AffectedNodes: [
        {
          CreatedNode: {
            LedgerEntryType: 'Offer',
            LedgerIndex: 'ABC123',
            NewFields: {
              Account: 'cTrader',
              TakerGets: '1000000',
              TakerPays: { currency: 'USD', issuer: 'cIssuer', value: '50' },
              Sequence: 1,
              Flags: 0,
              BookDirectory: 'ABC'.padEnd(64, '0'),
            },
          },
        },
      ],
    };

    const result = parseOrderbookChanges(metadata);

    expect(result['cTrader']).toHaveLength(1);
    expect(result['cTrader'][0]).toMatchObject({
      direction: 'buy',
      status: 'created',
      sequence: 1,
    });
  });

  it('should parse partially filled offer', () => {
    const metadata: RawMetadata = {
      AffectedNodes: [
        {
          ModifiedNode: {
            LedgerEntryType: 'Offer',
            LedgerIndex: 'ABC123',
            PreviousFields: {
              TakerGets: '1000000',
              TakerPays: { currency: 'USD', issuer: 'cIssuer', value: '100' },
            },
            FinalFields: {
              Account: 'cTrader',
              TakerGets: '500000',
              TakerPays: { currency: 'USD', issuer: 'cIssuer', value: '50' },
              Sequence: 1,
              Flags: 0,
              BookDirectory: 'ABC'.padEnd(64, '0'),
            },
          },
        },
      ],
    };

    const result = parseOrderbookChanges(metadata);

    expect(result['cTrader'][0]).toMatchObject({
      status: 'partially-filled',
      sequence: 1,
    });
  });

  it('should parse filled offer', () => {
    const metadata: RawMetadata = {
      AffectedNodes: [
        {
          DeletedNode: {
            LedgerEntryType: 'Offer',
            LedgerIndex: 'ABC123',
            PreviousFields: {
              TakerGets: '1000000',
              TakerPays: { currency: 'USD', issuer: 'cIssuer', value: '100' },
            },
            FinalFields: {
              Account: 'cTrader',
              Sequence: 1,
              Flags: 0,
              BookDirectory: 'ABC'.padEnd(64, '0'),
            },
          },
        },
      ],
    };

    const result = parseOrderbookChanges(metadata);

    expect(result['cTrader'][0]).toMatchObject({
      status: 'filled',
      sequence: 1,
    });
  });

  it('should parse cancelled offer', () => {
    const metadata: RawMetadata = {
      AffectedNodes: [
        {
          DeletedNode: {
            LedgerEntryType: 'Offer',
            LedgerIndex: 'ABC123',
            FinalFields: {
              Account: 'cTrader',
              TakerGets: '1000000',
              TakerPays: { currency: 'USD', issuer: 'cIssuer', value: '100' },
              Sequence: 1,
              Flags: 0,
              BookDirectory: 'ABC'.padEnd(64, '0'),
            },
          },
        },
      ],
    };

    const result = parseOrderbookChanges(metadata);

    expect(result['cTrader'][0]).toMatchObject({
      status: 'cancelled',
      sequence: 1,
    });
  });

  it('should parse sell offer', () => {
    const metadata: RawMetadata = {
      AffectedNodes: [
        {
          CreatedNode: {
            LedgerEntryType: 'Offer',
            LedgerIndex: 'ABC123',
            NewFields: {
              Account: 'cTrader',
              TakerGets: '1000000',
              TakerPays: { currency: 'USD', issuer: 'cIssuer', value: '50' },
              Sequence: 1,
              Flags: 0x00020000, // lsfSell
              BookDirectory: 'ABC'.padEnd(64, '0'),
            },
          },
        },
      ],
    };

    const result = parseOrderbookChanges(metadata);

    expect(result['cTrader'][0]).toMatchObject({
      direction: 'sell',
      status: 'created',
    });
  });

  it('should return empty object for undefined metadata', () => {
    const result = parseOrderbookChanges(undefined);
    expect(result).toEqual({});
  });

  it('should return empty object when no Offer nodes', () => {
    const metadata: RawMetadata = {
      AffectedNodes: [
        {
          ModifiedNode: {
            LedgerEntryType: 'AccountRoot',
            LedgerIndex: 'ABC123',
            FinalFields: {
              Account: 'cAccount',
            },
          },
        },
      ],
    };

    const result = parseOrderbookChanges(metadata);
    expect(result).toEqual({});
  });
});
