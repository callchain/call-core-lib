/**
 * Main index exports tests
 */

import * as CallCore from '@/index';

describe('Index exports', () => {
  it('should export VERSION', () => {
    expect(CallCore.VERSION).toBe('1.0.0');
  });

  it('should export RpcClient', () => {
    expect(CallCore.RpcClient).toBeDefined();
  });

  it('should export RpcError', () => {
    expect(CallCore.RpcError).toBeDefined();
  });

  it('should export WebSocketClient', () => {
    expect(CallCore.WebSocketClient).toBeDefined();
  });

  it('should export WebSocketError', () => {
    expect(CallCore.WebSocketError).toBeDefined();
  });

  it('should export crypto functions', () => {
    expect(CallCore.encodeBase58).toBeDefined();
    expect(CallCore.decodeBase58).toBeDefined();
    expect(CallCore.encodeBase58Check).toBeDefined();
    expect(CallCore.decodeBase58Check).toBeDefined();
    expect(CallCore.sha256).toBeDefined();
    expect(CallCore.sha512).toBeDefined();
    expect(CallCore.deriveKeypair).toBeDefined();
    expect(CallCore.deriveAddress).toBeDefined();
    expect(CallCore.generateWallet).toBeDefined();
    expect(CallCore.isValidAddress).toBeDefined();
    expect(CallCore.isValidSecret).toBeDefined();
  });

  it('should export utility functions', () => {
    expect(CallCore.callToDrops).toBeDefined();
    expect(CallCore.dropsToCall).toBeDefined();
    expect(CallCore.nativeAmount).toBeDefined();
    expect(CallCore.issuedCurrencyAmount).toBeDefined();
  });

  it('should export transaction builders', () => {
    expect(CallCore.PaymentBuilder).toBeDefined();
    expect(CallCore.AccountSetBuilder).toBeDefined();
    expect(CallCore.TrustSetBuilder).toBeDefined();
    expect(CallCore.OfferCreateBuilder).toBeDefined();
    expect(CallCore.OfferCancelBuilder).toBeDefined();
    expect(CallCore.SetRegularKeyBuilder).toBeDefined();
    expect(CallCore.SignerListSetBuilder).toBeDefined();
    expect(CallCore.DepositPreauthBuilder).toBeDefined();
    expect(CallCore.createTransaction).toBeDefined();
    expect(CallCore.TxFlags).toBeDefined();
  });
});
