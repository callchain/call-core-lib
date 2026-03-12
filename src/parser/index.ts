/**
 * Transaction parser for Call-Core
 *
 * Parses transaction metadata to extract:
 * - Balance changes (native CALL and trustlines)
 * - Orderbook/DEX changes
 * - Affected accounts
 *
 * @example
 * ```typescript
 * import { parseBalanceChanges, parseOrderbookChanges, getAffectedAccounts } from '@/parser';
 *
 * const tx = await client.tx({ transaction: 'ABC123...' });
 *
 * // Get balance changes
 * const balanceChanges = parseBalanceChanges(tx.meta);
 * console.log(balanceChanges);
 * // {
 * //   'cAddress1...': [
 * //     { currency: 'CALL', value: '-100', counterparty: '' },
 * //     { currency: 'USD', value: '50', counterparty: 'cIssuer...' }
 * //   ],
 * //   'cAddress2...': [...]
 * // }
 *
 * // Get orderbook changes
 * const orderChanges = parseOrderbookChanges(tx.meta);
 * console.log(orderChanges);
 * // {
 * //   'cAddress...': [
 * //     {
 * //       direction: 'sell',
 * //       status: 'filled',
 * //       quantity: { currency: 'CALL', value: '100' },
 * //       totalPrice: { currency: 'USD', value: '50' },
 * //       makerExchangeRate: '0.5'
 * //     }
 * //   ]
 * // }
 *
 * // Get affected accounts
 * const accounts = getAffectedAccounts(tx.meta);
 * console.log(accounts); // ['cAddress1...', 'cAddress2...']
 * ```
 */

// Main parsing functions
export { parseBalanceChanges, parseFinalBalances } from './balance-changes';
export { parseOrderbookChanges } from './orderbook-changes';
export { getAffectedAccounts, parseCurrencyAmount } from './utils';
export { parseQuality } from './quality';

// Types
export type {
  BalanceChange,
  BalanceChanges,
  OrderChange,
  OrderbookChanges,
  ParsedCurrencyAmount,
  NormalizedNode,
  NodeFields,
  AffectedNode,
  RawMetadata,
  /** @deprecated Use RawMetadata instead */
  TransactionMetadata,
} from './types';
