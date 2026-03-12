/**
 * Parser utility tests
 */

import {
  dropsToCALL,
  normalizeNode,
  normalizeNodes,
  parseCurrencyAmount,
  getAffectedAccounts,
} from '@/parser/utils';
import { BigNumber } from 'bignumber.js';
import type { AffectedNode, RawMetadata } from '@/parser/types';

describe('Parser Utils', () => {
  describe('dropsToCALL', () => {
    it('should convert drops to CALL', () => {
      const result = dropsToCALL(new BigNumber(1000000));
      expect(result.toString()).toBe('1');
    });

    it('should handle fractional CALL', () => {
      const result = dropsToCALL(new BigNumber(500000));
      expect(result.toString()).toBe('0.5');
    });
  });

  describe('normalizeNode', () => {
    it('should normalize CreatedNode', () => {
      const node: AffectedNode = {
        CreatedNode: {
          LedgerEntryType: 'AccountRoot',
          LedgerIndex: 'ABC123',
          NewFields: {
            Account: 'cTestAddress',
            Balance: '1000000',
          },
        },
      };

      const result = normalizeNode(node);

      expect(result.diffType).toBe('CreatedNode');
      expect(result.entryType).toBe('AccountRoot');
      expect(result.ledgerIndex).toBe('ABC123');
      expect(result.newFields.Account).toBe('cTestAddress');
    });

    it('should normalize ModifiedNode', () => {
      const node: AffectedNode = {
        ModifiedNode: {
          LedgerEntryType: 'CallState',
          LedgerIndex: 'DEF456',
          FinalFields: {
            Balance: { currency: 'USD', issuer: 'cIssuer', value: '100' },
          },
          PreviousFields: {
            Balance: { currency: 'USD', issuer: 'cIssuer', value: '50' },
          },
        },
      };

      const result = normalizeNode(node);

      expect(result.diffType).toBe('ModifiedNode');
      expect(result.entryType).toBe('CallState');
      expect(result.finalFields.Balance).toEqual({
        currency: 'USD',
        issuer: 'cIssuer',
        value: '100',
      });
    });
  });

  describe('normalizeNodes', () => {
    it('should normalize multiple nodes', () => {
      const metadata: RawMetadata = {
        AffectedNodes: [
          {
            CreatedNode: {
              LedgerEntryType: 'AccountRoot',
              LedgerIndex: 'ABC',
              NewFields: { Account: 'cTest1' },
            },
          },
          {
            ModifiedNode: {
              LedgerEntryType: 'Offer',
              LedgerIndex: 'DEF',
              FinalFields: { Account: 'cTest2' },
            },
          },
        ],
      };

      const results = normalizeNodes(metadata);

      expect(results).toHaveLength(2);
      expect(results[0].entryType).toBe('AccountRoot');
      expect(results[1].entryType).toBe('Offer');
    });

    it('should return empty array for undefined metadata', () => {
      const results = normalizeNodes(undefined);
      expect(results).toEqual([]);
    });

    it('should return empty array for metadata without AffectedNodes', () => {
      const results = normalizeNodes({});
      expect(results).toEqual([]);
    });
  });

  describe('parseCurrencyAmount', () => {
    it('should parse CALL amount string', () => {
      const result = parseCurrencyAmount('1000000');
      expect(result).toEqual({
        currency: 'CALL',
        value: '1',
      });
    });

    it('should parse issued currency amount', () => {
      const result = parseCurrencyAmount({
        currency: 'USD',
        issuer: 'cIssuerAddress',
        value: '100',
      });
      expect(result).toEqual({
        currency: 'USD',
        counterparty: 'cIssuerAddress',
        value: '100',
      });
    });

    it('should return undefined for undefined input', () => {
      const result = parseCurrencyAmount(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('getAffectedAccounts', () => {
    it('should extract accounts from Account fields', () => {
      const metadata: RawMetadata = {
        AffectedNodes: [
          {
            ModifiedNode: {
              LedgerEntryType: 'AccountRoot',
              LedgerIndex: 'ABC',
              FinalFields: {
                Account: 'cAccount1',
              },
            },
          },
          {
            ModifiedNode: {
              LedgerEntryType: 'AccountRoot',
              LedgerIndex: 'DEF',
              FinalFields: {
                Account: 'cAccount2',
              },
            },
          },
        ],
      };

      const result = getAffectedAccounts(metadata);
      expect(result).toContain('cAccount1');
      expect(result).toContain('cAccount2');
    });

    it('should extract issuers from amount fields', () => {
      const metadata: RawMetadata = {
        AffectedNodes: [
          {
            ModifiedNode: {
              LedgerEntryType: 'CallState',
              LedgerIndex: 'ABC',
              FinalFields: {
                LowLimit: { currency: 'USD', issuer: 'cLowIssuer', value: '0' },
                HighLimit: { currency: 'USD', issuer: 'cHighIssuer', value: '0' },
              },
            },
          },
        ],
      };

      const result = getAffectedAccounts(metadata);
      expect(result).toContain('cLowIssuer');
      expect(result).toContain('cHighIssuer');
    });

    it('should remove duplicate accounts', () => {
      const metadata: RawMetadata = {
        AffectedNodes: [
          {
            ModifiedNode: {
              LedgerEntryType: 'AccountRoot',
              LedgerIndex: 'ABC',
              FinalFields: {
                Account: 'cSameAccount',
              },
            },
          },
          {
            ModifiedNode: {
              LedgerEntryType: 'Offer',
              LedgerIndex: 'DEF',
              FinalFields: {
                Account: 'cSameAccount',
              },
            },
          },
        ],
      };

      const result = getAffectedAccounts(metadata);
      expect(result).toEqual(['cSameAccount']);
    });
  });
});
