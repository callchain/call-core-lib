/**
 * Orderbook changes parser
 *
 * Parses transaction metadata to extract DEX offer changes.
 * Handles offer creation, modification (partial fill), and deletion (fill/cancel).
 */

import { normalizeNodes, parseCurrencyAmount } from './utils';
import { parseQuality } from './quality';
import type {
  RawMetadata,
  NormalizedNode,
  OrderChange,
  OrderbookChanges,
  ParsedCurrencyAmount,
} from './types';

// Offer sell flag
const lsfSell = 0x00020000;

/**
 * Convert order change to output format
 * @param order - Order change data
 * @returns Formatted order change
 */
function convertOrderChange(order: {
  taker_pays: ParsedCurrencyAmount | undefined;
  taker_gets: ParsedCurrencyAmount | undefined;
  sell: boolean;
  sequence: number;
  status: 'created' | 'partially-filled' | 'filled' | 'cancelled';
  quality: string;
  expiration?: string;
}): Omit<OrderChange, 'account'> {
  const takerGets = order.taker_gets;
  const takerPays = order.taker_pays;

  if (!takerGets || !takerPays) {
    throw new Error('Invalid order: missing taker_gets or taker_pays');
  }

  const direction = order.sell ? 'sell' : 'buy';
  const quantity = direction === 'buy' ? takerPays : takerGets;
  const totalPrice = direction === 'buy' ? takerGets : takerPays;

  const result: Omit<OrderChange, 'account'> = {
    direction,
    quantity,
    totalPrice,
    sequence: order.sequence,
    status: order.status,
    makerExchangeRate: order.quality,
  };

  if (order.expiration !== undefined) {
    result.expirationTime = order.expiration;
  }

  return result;
}

/**
 * Convert Call ledger timestamp to Unix timestamp
 * @param rpepoch - Call epoch timestamp
 * @returns Unix timestamp in milliseconds
 */
function callToUnixTimestamp(rpepoch: number): number {
  return (rpepoch + 0x386d4380) * 1000;
}

/**
 * Get expiration time from node
 * @param node - Normalized node
 * @returns ISO timestamp or undefined
 */
function getExpirationTime(node: NormalizedNode): string | undefined {
  const expirationTime =
    node.finalFields.Expiration ?? node.newFields.Expiration;

  if (expirationTime === undefined) {
    return undefined;
  }

  return new Date(callToUnixTimestamp(expirationTime)).toISOString();
}

/**
 * Get quality from node
 * @param node - Normalized node
 * @returns Parsed quality string
 */
function getQuality(node: NormalizedNode): string {
  const takerGets =
    node.finalFields.TakerGets ?? node.newFields.TakerGets ?? '0';
  const takerPays =
    node.finalFields.TakerPays ?? node.newFields.TakerPays ?? '0';

  const takerGetsCurrency =
    typeof takerGets === 'string' ? 'CALL' : takerGets.currency;
  const takerPaysCurrency =
    typeof takerPays === 'string' ? 'CALL' : takerPays.currency;

  const bookDirectory =
    (typeof node.finalFields.BookDirectory === 'string' &&
      node.finalFields.BookDirectory) ||
    (typeof node.newFields.BookDirectory === 'string' &&
      node.newFields.BookDirectory) ||
    '';

  const qualityHex = bookDirectory.substring(bookDirectory.length - 16);

  if (qualityHex.length !== 16) {
    return '0';
  }

  return parseQuality(qualityHex, takerGetsCurrency, takerPaysCurrency);
}

/**
 * Parse order status from node
 * @param node - Normalized node
 * @returns Order status
 */
function parseOrderStatus(
  node: NormalizedNode
): 'created' | 'partially-filled' | 'filled' | 'cancelled' | undefined {
  if (node.diffType === 'CreatedNode') {
    return 'created';
  }

  if (node.diffType === 'ModifiedNode') {
    return 'partially-filled';
  }

  if (node.diffType === 'DeletedNode') {
    // A filled order has previous fields
    if (
      node.previousFields.TakerPays !== undefined ||
      node.previousFields.TakerGets !== undefined
    ) {
      return 'filled';
    }

    // A cancelled order has no previous fields
    return 'cancelled';
  }

  return undefined;
}

/**
 * Parse change amount from node
 * @param node - Normalized node
 * @param type - Field type (TakerPays or TakerGets)
 * @returns Parsed currency amount
 */
function parseChangeAmount(
  node: NormalizedNode,
  type: 'TakerPays' | 'TakerGets'
): ParsedCurrencyAmount {
  const status = parseOrderStatus(node);

  if (status === 'cancelled') {
    // Cancelled orders do not have PreviousFields; FinalFields have positive values
    return (
      parseCurrencyAmount(node.finalFields[type]) ?? {
        currency: 'CALL',
        value: '0',
      }
    );
  } else if (status === 'created') {
    return (
      parseCurrencyAmount(node.newFields[type]) ?? {
        currency: 'CALL',
        value: '0',
      }
    );
  }

  return (
    parseCurrencyAmount(node.finalFields[type]) ?? {
      currency: 'CALL',
      value: '0',
    }
  );
}

/**
 * Parse order change from node
 * @param node - Normalized node
 * @returns Order change object
 */
function parseOrderChange(node: NormalizedNode): OrderChange | null {
  const status = parseOrderStatus(node);

  if (!status) {
    return null;
  }

  const takerPays = parseChangeAmount(node, 'TakerPays');
  const takerGets = parseChangeAmount(node, 'TakerGets');

  const flags =
    (typeof node.finalFields.Flags === 'number' && node.finalFields.Flags) ||
    (typeof node.newFields.Flags === 'number' && node.newFields.Flags) ||
    0;

  const sequence =
    (typeof node.finalFields.Sequence === 'number' &&
      node.finalFields.Sequence) ||
    (typeof node.newFields.Sequence === 'number' && node.newFields.Sequence) ||
    0;

  const account =
    (typeof node.finalFields.Account === 'string' &&
      node.finalFields.Account) ||
    (typeof node.newFields.Account === 'string' && node.newFields.Account);

  if (!account) {
    return null;
  }

  const orderChange = convertOrderChange({
    taker_pays: takerPays,
    taker_gets: takerGets,
    sell: (flags & lsfSell) !== 0,
    sequence,
    status,
    quality: getQuality(node),
    expiration: getExpirationTime(node),
  });

  return {
    ...orderChange,
    account,
  };
}

/**
 * Group order changes by account address
 * @param orderChanges - Array of order changes
 * @returns Order changes grouped by address
 */
function groupByAddress(orderChanges: OrderChange[]): OrderbookChanges {
  const result: OrderbookChanges = {};

  for (const change of orderChanges) {
    if (!change.account) continue;

    if (!result[change.account]) {
      result[change.account] = [];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { account, ...changeWithoutAccount } = change;
    result[change.account].push(changeWithoutAccount as OrderChange);
  }

  return result;
}

/**
 * Computes the complete list of every Offer that changed in the ledger
 * as a result of the given transaction.
 * Returns changes grouped by Call account.
 *
 * @param metadata - Transaction metadata
 * @returns Orderbook changes grouped by account address
 */
export function parseOrderbookChanges(
  metadata: RawMetadata | undefined
): OrderbookChanges {
  const nodes = normalizeNodes(metadata);

  const orderChanges = nodes
    .filter((node) => node.entryType === 'Offer')
    .map(parseOrderChange)
    .filter((change): change is OrderChange => change !== null);

  return groupByAddress(orderChanges);
}
