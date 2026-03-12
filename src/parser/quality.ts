/**
 * Quality parser for orderbook exchange rates
 *
 * The quality is stored in the last 64 bits of a directory index as the quotient
 * of TakerPays/TakerGets. It uses drops (1e-6 CALL) for CALL values.
 */

import { BigNumber } from 'bignumber.js';

/**
 * Adjust quality for CALL currency (6 decimal places)
 * @param quality - Raw quality string
 * @param takerGetsCurrency - Taker gets currency
 * @param takerPaysCurrency - Taker pays currency
 * @returns Adjusted quality string
 */
function adjustQualityForCALL(
  quality: string,
  takerGetsCurrency: string,
  takerPaysCurrency: string
): string {
  const numeratorShift = takerPaysCurrency === 'CALL' ? -6 : 0;
  const denominatorShift = takerGetsCurrency === 'CALL' ? -6 : 0;
  const shift = numeratorShift - denominatorShift;

  if (shift === 0) {
    return new BigNumber(quality).toString();
  }

  return new BigNumber(quality).shiftedBy(shift).toString();
}

/**
 * Parse quality from hex string
 * @param qualityHex - 16-character hex string
 * @param takerGetsCurrency - Taker gets currency
 * @param takerPaysCurrency - Taker pays currency
 * @returns Parsed quality as string
 * @throws Error if qualityHex is not 16 characters
 */
export function parseQuality(
  qualityHex: string,
  takerGetsCurrency: string,
  takerPaysCurrency: string
): string {
  if (qualityHex.length !== 16) {
    throw new Error('Quality hex must be 16 characters');
  }

  const mantissa = new BigNumber(qualityHex.substring(2), 16);
  const offset = parseInt(qualityHex.substring(0, 2), 16) - 100;
  const quality = mantissa.toString() + 'e' + offset.toString();

  return adjustQualityForCALL(quality, takerGetsCurrency, takerPaysCurrency);
}
