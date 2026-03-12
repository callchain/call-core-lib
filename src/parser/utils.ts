/**
 * Parser utility functions
 */

import { BigNumber } from 'bignumber.js';
import type {
  RawMetadata,
  AffectedNode,
  NormalizedNode,
  ParsedCurrencyAmount,
} from './types';

/**
 * Convert drops to CALL
 * @param drops - Amount in drops
 * @returns Amount in CALL
 */
export function dropsToCALL(drops: BigNumber): BigNumber {
  return drops.dividedBy(1000000);
}

/**
 * Normalize a raw affected node into a consistent format
 * @param affectedNode - Raw affected node from metadata
 * @returns Normalized node
 */
export function normalizeNode(affectedNode: AffectedNode): NormalizedNode {
  const diffType = Object.keys(affectedNode)[0] as
    | 'CreatedNode'
    | 'ModifiedNode'
    | 'DeletedNode';
  const node = affectedNode[diffType]!;

  return {
    diffType,
    entryType: node.LedgerEntryType,
    ledgerIndex: node.LedgerIndex,
    newFields: (node as { NewFields?: Record<string, unknown> }).NewFields || {},
    finalFields:
      (node as { FinalFields?: Record<string, unknown> }).FinalFields || {},
    previousFields:
      (node as { PreviousFields?: Record<string, unknown> }).PreviousFields ||
      {},
  };
}

/**
 * Normalize all affected nodes from metadata
 * @param metadata - Raw transaction metadata
 * @returns Array of normalized nodes
 */
export function normalizeNodes(
  metadata: RawMetadata | undefined
): NormalizedNode[] {
  if (!metadata?.AffectedNodes) {
    return [];
  }
  return metadata.AffectedNodes.map(normalizeNode);
}

/**
 * Parse a currency amount from metadata format
 * @param currencyAmount - Raw currency amount
 * @returns Parsed currency amount
 */
export function parseCurrencyAmount(
  currencyAmount: string | { currency: string; issuer?: string; value: string } | undefined
): ParsedCurrencyAmount | undefined {
  if (currencyAmount === undefined) {
    return undefined;
  }

  if (typeof currencyAmount === 'string') {
    return {
      currency: 'CALL',
      value: dropsToCALL(new BigNumber(currencyAmount)).toString(),
    };
  }

  return {
    currency: currencyAmount.currency,
    counterparty: currencyAmount.issuer,
    value: currencyAmount.value,
  };
}

/**
 * Check if field name is an account field
 * @param fieldName - Field name to check
 * @returns True if account field
 */
function isAccountField(fieldName: string): boolean {
  const fieldNames = ['Account', 'Owner', 'Destination', 'Issuer', 'Target'];
  return fieldNames.includes(fieldName);
}

/**
 * Check if field name is an amount field that affects issuer
 * @param fieldName - Field name to check
 * @returns True if amount field affecting issuer
 */
function isAmountFieldAffectingIssuer(fieldName: string): boolean {
  const fieldNames = ['LowLimit', 'HighLimit', 'TakerPays', 'TakerGets'];
  return fieldNames.includes(fieldName);
}

/**
 * Get all accounts affected by a transaction
 * @param metadata - Raw transaction metadata
 * @returns Array of affected account addresses
 */
export function getAffectedAccounts(
  metadata: RawMetadata | undefined
): string[] {
  const accounts: string[] = [];

  for (const node of normalizeNodes(metadata)) {
    const fields =
      node.diffType === 'CreatedNode' ? node.newFields : node.finalFields;

    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      if (typeof fieldValue === 'string' && isAccountField(fieldName)) {
        accounts.push(fieldValue);
      } else if (
        typeof fieldValue === 'object' &&
        fieldValue !== null &&
        'issuer' in fieldValue &&
        typeof fieldValue.issuer === 'string' &&
        isAmountFieldAffectingIssuer(fieldName)
      ) {
        accounts.push(fieldValue.issuer);
      }
    }
  }

  // Remove duplicates
  return [...new Set(accounts)];
}
