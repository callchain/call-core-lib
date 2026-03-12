/**
 * Balance changes parser tests
 */

import { parseBalanceChanges, parseFinalBalances } from '@/parser/balance-changes';
import type { RawMetadata } from '@/parser/types';

describe('Balance Changes Parser', () => {
  describe('parseBalanceChanges', () => {
    it('should parse CALL balance change for payment', () => {
      const metadata: RawMetadata = {
        AffectedNodes: [
          {
            ModifiedNode: {
              LedgerEntryType: 'AccountRoot',
              LedgerIndex: 'ABC123',
              PreviousFields: {
                Balance: '2000000',
                Account: 'cSender',
              },
              FinalFields: {
                Balance: '1000000',
                Account: 'cSender',
              },
            },
          },
          {
            ModifiedNode: {
              LedgerEntryType: 'AccountRoot',
              LedgerIndex: 'DEF456',
              PreviousFields: {
                Balance: '5000000',
                Account: 'cReceiver',
              },
              FinalFields: {
                Balance: '6000000',
                Account: 'cReceiver',
              },
            },
          },
        ],
      };

      const result = parseBalanceChanges(metadata);

      expect(result['cSender']).toContainEqual({
        currency: 'CALL',
        counterparty: '',
        value: '-1',
      });
      expect(result['cReceiver']).toContainEqual({
        currency: 'CALL',
        counterparty: '',
        value: '1',
      });
    });

    it('should parse new account creation', () => {
      const metadata: RawMetadata = {
        AffectedNodes: [
          {
            CreatedNode: {
              LedgerEntryType: 'AccountRoot',
              LedgerIndex: 'ABC123',
              NewFields: {
                Account: 'cNewAccount',
                Balance: '1000000',
              },
            },
          },
        ],
      };

      const result = parseBalanceChanges(metadata);

      expect(result['cNewAccount']).toContainEqual({
        currency: 'CALL',
        counterparty: '',
        value: '1',
      });
    });

    it('should parse trustline balance changes', () => {
      const metadata: RawMetadata = {
        AffectedNodes: [
          {
            ModifiedNode: {
              LedgerEntryType: 'CallState',
              LedgerIndex: 'ABC123',
              PreviousFields: {
                Balance: { currency: 'USD', issuer: 'cIssuer', value: '0' },
                LowLimit: { currency: 'USD', issuer: 'cLowAccount', value: '100' },
                HighLimit: { currency: 'USD', issuer: 'cHighAccount', value: '0' },
              },
              FinalFields: {
                Balance: { currency: 'USD', issuer: 'cIssuer', value: '50' },
                LowLimit: { currency: 'USD', issuer: 'cLowAccount', value: '100' },
                HighLimit: { currency: 'USD', issuer: 'cHighAccount', value: '0' },
              },
            },
          },
        ],
      };

      const result = parseBalanceChanges(metadata);

      // Low account perspective
      expect(result['cLowAccount']).toBeDefined();
      expect(result['cLowAccount'][0].value).toBe('50');
      expect(result['cLowAccount'][0].currency).toBe('USD');

      // High account perspective (negated)
      expect(result['cHighAccount']).toBeDefined();
      expect(result['cHighAccount'][0].value).toBe('-50');
      expect(result['cHighAccount'][0].currency).toBe('USD');
    });

    it('should return empty object for undefined metadata', () => {
      const result = parseBalanceChanges(undefined);
      expect(result).toEqual({});
    });
  });

  describe('parseFinalBalances', () => {
    it('should parse final CALL balances', () => {
      const metadata: RawMetadata = {
        AffectedNodes: [
          {
            ModifiedNode: {
              LedgerEntryType: 'AccountRoot',
              LedgerIndex: 'ABC123',
              FinalFields: {
                Balance: '5000000',
                Account: 'cAccount',
              },
            },
          },
        ],
      };

      const result = parseFinalBalances(metadata);

      expect(result['cAccount']).toContainEqual({
        currency: 'CALL',
        counterparty: '',
        value: '5',
      });
    });
  });
});
