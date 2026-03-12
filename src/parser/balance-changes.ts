/**
 * Balance changes parser
 *
 * Parses transaction metadata to extract balance changes for accounts.
 * Handles both native CALL (AccountRoot) and trustline (CallState) changes.
 */

import { BigNumber } from 'bignumber.js';
import { normalizeNodes, dropsToCALL } from './utils';
import type {
  RawMetadata,
  NormalizedNode,
  BalanceChange,
  BalanceChanges,
} from './types';

/**
 * Parsed quantity with address and balance
 */
interface ParsedQuantity {
  address: string;
  balance: BalanceChange;
}

/**
 * Compute balance change from node
 * @param node - Normalized node
 * @returns Balance change value or null if no change
 */
function computeBalanceChange(node: NormalizedNode): BigNumber | null {
  let value: BigNumber | null = null;

  const balance = node.newFields.Balance ?? node.finalFields.Balance;

  if (node.newFields.Balance && typeof node.newFields.Balance === 'string') {
    // New account with initial balance
    value = new BigNumber(node.newFields.Balance);
  } else if (
    node.previousFields.Balance &&
    node.finalFields.Balance &&
    typeof node.previousFields.Balance === 'string' &&
    typeof node.finalFields.Balance === 'string'
  ) {
    // Existing account balance change
    value = new BigNumber(node.finalFields.Balance).minus(
      new BigNumber(node.previousFields.Balance)
    );
  } else if (
    typeof balance === 'object' &&
    balance !== null &&
    'value' in balance
  ) {
    // Trustline balance
    if (node.newFields.Balance) {
      value = new BigNumber(String(balance.value));
    } else if (
      node.previousFields.Balance &&
      node.finalFields.Balance &&
      typeof node.previousFields.Balance === 'object' &&
      typeof node.finalFields.Balance === 'object' &&
      'value' in node.previousFields.Balance &&
      'value' in node.finalFields.Balance
    ) {
      const prevValue = new BigNumber(
        String(node.previousFields.Balance.value)
      );
      const finalValue = new BigNumber(String(node.finalFields.Balance.value));
      value = finalValue.minus(prevValue);
    }
  }

  if (value === null || value.isZero()) {
    return null;
  }

  return value;
}

/**
 * Parse final balance from node
 * @param node - Normalized node
 * @returns Final balance value or null
 */
function parseFinalBalance(node: NormalizedNode): BigNumber | null {
  const balance = node.newFields.Balance ?? node.finalFields.Balance;

  if (typeof balance === 'string') {
    return new BigNumber(balance);
  } else if (
    typeof balance === 'object' &&
    balance !== null &&
    'value' in balance
  ) {
    return new BigNumber(String(balance.value));
  }

  return null;
}

/**
 * Parse CALL quantity from node
 * @param node - Normalized node
 * @param valueParser - Function to parse value from node
 * @returns Parsed quantity or null
 */
function parseCALLQuantity(
  node: NormalizedNode,
  valueParser: (node: NormalizedNode) => BigNumber | null
): ParsedQuantity | null {
  const value = valueParser(node);

  if (value === null) {
    return null;
  }

  const account =
    (typeof node.finalFields.Account === 'string' && node.finalFields.Account) ||
    (typeof node.newFields.Account === 'string' && node.newFields.Account);

  if (!account) {
    return null;
  }

  return {
    address: account,
    balance: {
      counterparty: '',
      currency: 'CALL',
      value: dropsToCALL(value).toString(),
    },
  };
}

/**
 * Flip trustline perspective to get both sides
 * @param quantity - Parsed quantity
 * @returns Flipped quantity
 */
function flipTrustlinePerspective(quantity: ParsedQuantity): ParsedQuantity {
  const negatedBalance = new BigNumber(quantity.balance.value).negated();

  return {
    address: quantity.balance.counterparty,
    balance: {
      counterparty: quantity.address,
      currency: quantity.balance.currency,
      value: negatedBalance.toString(),
    },
  };
}

/**
 * Parse trustline quantity from node
 * @param node - Normalized node
 * @param valueParser - Function to parse value from node
 * @returns Array of parsed quantities (both perspectives) or null
 */
function parseTrustlineQuantity(
  node: NormalizedNode,
  valueParser: (node: NormalizedNode) => BigNumber | null
): ParsedQuantity[] | null {
  const value = valueParser(node);

  if (value === null) {
    return null;
  }

  // Get fields (new or final depending on node type)
  const fields =
    Object.keys(node.newFields).length > 0 ? node.newFields : node.finalFields;

  const lowLimit = fields.LowLimit;
  const highLimit = fields.HighLimit;

  if (
    !lowLimit ||
    !highLimit ||
    typeof lowLimit !== 'object' ||
    typeof highLimit !== 'object' ||
    !('issuer' in lowLimit) ||
    !('issuer' in highLimit)
  ) {
    return null;
  }

  const balanceField = fields.Balance;
  const currency =
    typeof balanceField === 'object' && balanceField !== null
      ? String(balanceField.currency || '')
      : '';

  // Balance is always from low node's perspective
  const result: ParsedQuantity = {
    address: String(lowLimit.issuer),
    balance: {
      counterparty: String(highLimit.issuer),
      currency,
      value: value.toString(),
    },
  };

  return [result, flipTrustlinePerspective(result)];
}

/**
 * Group quantities by address
 * @param quantities - Array of parsed quantities
 * @returns Balance changes grouped by address
 */
function groupByAddress(
  quantities: (ParsedQuantity | ParsedQuantity[] | null)[]
): BalanceChanges {
  const result: BalanceChanges = {};

  // Flatten and filter out nulls
  const flatQuantities = quantities
    .flat()
    .filter((q): q is ParsedQuantity => q !== null);

  for (const quantity of flatQuantities) {
    if (!result[quantity.address]) {
      result[quantity.address] = [];
    }
    result[quantity.address].push(quantity.balance);
  }

  return result;
}

/**
 * Parse quantities from metadata
 * @param metadata - Transaction metadata
 * @param valueParser - Function to parse value from node
 * @returns Balance changes grouped by address
 */
function parseQuantities(
  metadata: RawMetadata | undefined,
  valueParser: (node: NormalizedNode) => BigNumber | null
): BalanceChanges {
  const values = normalizeNodes(metadata).map((node) => {
    if (node.entryType === 'AccountRoot') {
      return parseCALLQuantity(node, valueParser);
    } else if (node.entryType === 'CallState') {
      return parseTrustlineQuantity(node, valueParser);
    }
    return null;
  });

  return groupByAddress(values);
}

/**
 * Compute the complete list of every balance that changed in the ledger
 * as a result of the given transaction.
 *
 * @param metadata - Transaction metadata
 * @returns Parsed balance changes grouped by address
 */
export function parseBalanceChanges(
  metadata: RawMetadata | undefined
): BalanceChanges {
  return parseQuantities(metadata, computeBalanceChange);
}

/**
 * Compute the complete list of every final balance in the ledger
 * as a result of the given transaction.
 *
 * @param metadata - Transaction metadata
 * @returns Parsed final balances grouped by address
 */
export function parseFinalBalances(
  metadata: RawMetadata | undefined
): BalanceChanges {
  return parseQuantities(metadata, parseFinalBalance);
}
