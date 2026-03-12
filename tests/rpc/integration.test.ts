/**
 * RPC Client Integration Tests with DummyRpcServer
 *
 * These tests use the real RpcClient with a DummyRpcServer
 * to provide true integration testing without requiring
 * a running devnet or testnet.
 */

import { RpcClient, RpcError } from '@/rpc/client';
import { DummyRpcServer } from '@/dummy-rpc-server';

describe('RpcClient Integration with DummyRpcServer', () => {
  let server: DummyRpcServer;
  let client: RpcClient;

  beforeEach(async () => {
    // Restore real fetch for integration tests
    (global as any).fetch = (global as any).__NATIVE_FETCH__;

    // Start fresh server on random port
    server = new DummyRpcServer({ port: 0 });
    await server.start();

    // Create client pointing to server
    client = new RpcClient({
      server: server.getUrl(),
      timeout: 5000,
    });
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('Connection and Basic Operations', () => {
    it('should connect and get server info', async () => {
      const info = await client.serverInfo();

      expect(info.info.build_version).toBe('0.1.0-dummy');
      expect(info.info.server_state).toBe('full');
      expect(info.info.validated_ledger!.seq).toBeGreaterThan(0);
    });

    it('should ping the server', async () => {
      const result = await client.ping();
      expect(result.role).toBe('admin');
    });

    it('should get fee information', async () => {
      const result = await client.fee();

      expect(result.drops.base_fee).toBe('10');
      expect(result.drops.minimum_fee).toBe('10');
      expect(result.levels).toBeDefined();
    });
  });

  describe('Ledger Operations', () => {
    it('should get current ledger', async () => {
      const result = await client.ledger();

      expect(result.ledger.ledger_index).toBeDefined();
      expect(result.ledger.ledger_hash).toBeDefined();
      expect(result.validated).toBe(true);
    });

    it('should get specific ledger by index', async () => {
      const result = await client.ledger({ ledger_index: 1 });

      expect(result.ledger.ledger_index).toBe('1');
      expect(result.ledger.closed).toBe(true);
    });

    it('should get validated ledger', async () => {
      const result = await client.ledger({ ledger_index: 'validated' });

      expect(result.ledger.closed).toBe(true);
    });

    it('should track ledger progression', async () => {
      const initial = await client.ledger({ ledger_index: 'current' });
      const initialIndex = typeof initial.ledger.ledger_index === 'number'
        ? initial.ledger.ledger_index
        : parseInt(initial.ledger.ledger_index, 10);

      // Close a ledger
      server.closeLedger();

      const updated = await client.ledger({ ledger_index: 'current' });
      const updatedIndex = typeof updated.ledger.ledger_index === 'number'
        ? updated.ledger.ledger_index
        : parseInt(updated.ledger.ledger_index, 10);

      expect(updatedIndex).toBeGreaterThan(initialIndex);
    });
  });

  describe('Account Operations', () => {
    it('should get genesis account info', async () => {
      const result = await client.accountInfo({
        account: 'cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
      });

      expect(result.account_data.account).toBe('cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy');
      expect(result.account_data.balance).toBe('50000000000');
      expect(result.account_data.sequence).toBe(1);
      expect(result.validated).toBe(true);
    });

    it('should get all genesis accounts', async () => {
      const accounts = [
        'cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
        'c3K3xXhvsWBnP3TitQfeg2ihAuaYybvtc7',
        'cHSFoKcGXFZdbB7EKmWQMTUJbr66dwfMR1',
        'cKKeufyrSZymFeGmtF1Vhi11eCSf2i6MhR',
        'cUUsn5u9qPq7MiMiEDwdjMPsHHKyaesHPH',
      ];

      for (const account of accounts) {
        const result = await client.accountInfo({ account });
        expect(result.account_data.account).toBe(account);
        expect(parseInt(result.account_data.balance, 10)).toBeGreaterThan(0);
      }
    });

    it('should throw RpcError for non-existent account', async () => {
      await expect(
        client.accountInfo({ account: 'cNonExistentAccount123456789' })
      ).rejects.toThrow(RpcError);
    });

    it('should return error with correct code for missing account', async () => {
      try {
        await client.accountInfo({ account: 'cMissingAccount' });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RpcError);
        expect((error as RpcError).message).toContain('Account not found');
      }
    });
  });

  describe('Transaction Operations', () => {
    it('should submit a transaction', async () => {
      const txBlob = '120000220000000024000000016140000000000F424068400000000000000A8114' +
                     '50370298F2835F216D4F2956738E24369CBC3B77831450370298F2835F216D4F2956738E24369CBC3B77';

      const result = await client.submit({ tx_blob: txBlob });

      expect(result.engine_result).toBe('tesSUCCESS');
      expect(result.engine_result_code).toBe(0);
      expect(result.tx_blob).toBe(txBlob);
      expect(result.tx_json!.hash).toBeDefined();
    });

    it('should retrieve submitted transaction', async () => {
      // Submit a transaction
      const txBlob = '120000220000000024000000016140000000000F424068400000000000000A';
      const submitResult = await client.submit({ tx_blob: txBlob });
      const txHash = submitResult.tx_json!.hash!;

      // Retrieve it
      const result = await client.tx({ transaction: txHash });

      expect(result.tx.transaction.hash).toBe(txHash);
      expect(result.validated).toBe(true);
    });

    it('should throw for non-existent transaction', async () => {
      await expect(
        client.tx({ transaction: '1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF' })
      ).rejects.toThrow(RpcError);
    });

    it('should get account transactions', async () => {
      const result = await client.accountTx({
        account: 'cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
      });

      expect(result.account).toBe('cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy');
      expect(Array.isArray(result.transactions)).toBe(true);
    });
  });

  describe('Server State Management', () => {
    it('should track server state across requests', async () => {
      const info1 = await client.serverInfo();
      const ledger1 = info1.info.validated_ledger!.seq;

      // Close multiple ledgers
      server.closeLedger();
      server.closeLedger();
      server.closeLedger();

      const info2 = await client.serverInfo();
      const ledger2 = info2.info.validated_ledger!.seq;

      expect(ledger2).toBeGreaterThan(ledger1);
      expect(info2.info.complete_ledgers).toContain(ledger2.toString());
    });

    it('should maintain consistent ledger hash', async () => {
      const info = await client.serverInfo();
      const ledger = await client.ledger({ ledger_index: info.info.validated_ledger!.seq });

      expect(ledger.ledger.ledger_hash).toBe(info.info.validated_ledger!.hash);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON-RPC method', async () => {
      // Create a raw fetch to test invalid method
      const response = await fetch(server.getUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'invalid_method',
          id: 1,
        }),
      });

      const result = await response.json();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32601);
    });

    it('should handle missing parameters', async () => {
      await expect(
        client.accountInfo({} as { account: string })
      ).rejects.toThrow(RpcError);
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(server.getUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      });

      const result = await response.json();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32700); // Parse error
    });
  });

  describe('Custom Account Management', () => {
    it('should add and retrieve custom account', async () => {
      server.addAccount('cCustomAccount123456', '9999999999', 5);

      const result = await client.accountInfo({
        account: 'cCustomAccount123456',
      });

      expect(result.account_data.account).toBe('cCustomAccount123456');
      expect(result.account_data.balance).toBe('9999999999');
      expect(result.account_data.sequence).toBe(5);
    });

    it('should track multiple custom accounts', async () => {
      const accounts = [
        { account: 'cAccount1', balance: '1000000' },
        { account: 'cAccount2', balance: '2000000' },
        { account: 'cAccount3', balance: '3000000' },
      ];

      for (const { account, balance } of accounts) {
        server.addAccount(account, balance);
      }

      for (const { account, balance } of accounts) {
        const result = await client.accountInfo({ account });
        expect(result.account_data.balance).toBe(balance);
      }
    });
  });

  describe('Transaction History', () => {
    it('should track transaction history', async () => {
      const txBlob = '12000022000000002400000001';

      // Submit multiple transactions
      const results = await Promise.all([
        client.submit({ tx_blob: txBlob + '01' }),
        client.submit({ tx_blob: txBlob + '02' }),
        client.submit({ tx_blob: txBlob + '03' }),
      ]);

      // Each should succeed
      results.forEach((result) => {
        expect(result.engine_result).toBe('tesSUCCESS');
        expect(result.tx_json!.hash).toBeDefined();
      });

      // Should be able to retrieve each
      for (const result of results) {
        const txHash = result.tx_json!.hash!;
        const tx = await client.tx({ transaction: txHash });
        expect(tx.tx.transaction.hash).toBe(txHash);
      }
    });
  });
});

describe('RpcClient with auto-generated ledgers', () => {
  let server: DummyRpcServer;
  let client: RpcClient;

  beforeEach(async () => {
    // Restore real fetch for integration tests
    (global as any).fetch = (global as any).__NATIVE_FETCH__;

    server = new DummyRpcServer({
      port: 0,
      autoGenerateLedgers: true,
      ledgerInterval: 100,
    });
    await server.start();

    client = new RpcClient({ server: server.getUrl() });
  });

  afterEach(async () => {
    await server.stop();
  });

  it('should see ledger progression over time', async () => {
    const info1 = await client.serverInfo();
    const seq1 = info1.info.validated_ledger!.seq;

    // Wait for auto-generated ledgers
    await new Promise((resolve) => setTimeout(resolve, 350));

    const info2 = await client.serverInfo();
    const seq2 = info2.info.validated_ledger!.seq;

    expect(seq2).toBeGreaterThan(seq1);
  }, 5000);
});
