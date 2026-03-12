/**
 * RPC Client tests
 */

import { RpcClient, RpcError } from '@/rpc/client';

describe('RpcClient', () => {
  let client: RpcClient;

  beforeEach(() => {
    client = new RpcClient({ server: 'http://localhost:5005' });
    (global.fetch as jest.Mock).mockClear();
  });

  describe('constructor', () => {
    it('should create client with default options', () => {
      const c = new RpcClient({ server: 'http://localhost:5005' });
      expect(c.getServer()).toBe('http://localhost:5005');
    });

    it('should create client with custom timeout', () => {
      const c = new RpcClient({ server: 'http://localhost:5005', timeout: 5000 });
      expect(c.getServer()).toBe('http://localhost:5005');
    });

    it('should create client with custom headers', () => {
      const c = new RpcClient({
        server: 'http://localhost:5005',
        headers: { 'X-Custom': 'value' },
      });
      expect(c.getServer()).toBe('http://localhost:5005');
    });
  });

  describe('serverInfo', () => {
    it('should fetch server info', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        result: {
          info: {
            build_version: '1.0.0',
            complete_ledgers: '1-1000',
            io_latency_ms: 1,
            peers: 5,
            server_state: 'full',
            uptime: 3600,
            validated_ledger: {
              age: 3,
              base_fee: 10,
              hash: 'ABC123',
              reserve_base: 1000000,
              reserve_inc: 200000,
              seq: 1000,
            },
          },
        },
        id: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.serverInfo();

      expect(result.info.build_version).toBe('1.0.0');
      expect(result.info.server_state).toBe('full');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5005',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('server_info'),
        })
      );
    });
  });

  describe('accountInfo', () => {
    it('should fetch account info', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        result: {
          account_data: {
            account: 'c1234567890ABCDEF',
            balance: '1000000',
            sequence: 1,
            owner_count: 0,
            flags: 0,
            previous_txn_id: '0000000000000000',
            previous_txn_lgr_seq: 0,
          },
          ledger_current_index: 1000,
        },
        id: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.accountInfo({ account: 'c1234567890ABCDEF' });

      expect(result.account_data.account).toBe('c1234567890ABCDEF');
      expect(result.account_data.balance).toBe('1000000');
    });
  });

  describe('ledger', () => {
    it('should fetch current ledger', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        result: {
          ledger: {
            ledger_index: 1000,
            ledger_hash: 'ABC123',
            parent_hash: 'DEF456',
            account_hash: 'GHI789',
            close_time: 1234567890,
            closed: true,
          },
          validated: true,
        },
        id: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.ledger();

      expect(result.ledger.ledger_index).toBe(1000);
      expect(result.validated).toBe(true);
    });

    it('should fetch specific ledger by index', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        result: {
          ledger: {
            ledger_index: 500,
            ledger_hash: 'HASH123',
            parent_hash: 'PARENT456',
            account_hash: 'ACCOUNT789',
            close_time: 1234567800,
            closed: true,
          },
        },
        id: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.ledger({ ledger_index: 500 });

      expect(result.ledger.ledger_index).toBe(500);
    });
  });

  describe('submit', () => {
    it('should submit transaction blob', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        result: {
          engine_result: 'tesSUCCESS',
          engine_result_code: 0,
          engine_result_message: 'The transaction was applied.',
          tx_blob: '12000022000000002400000001...',
        },
        id: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.submit({
        tx_blob: '12000022000000002400000001...',
      });

      expect(result.engine_result).toBe('tesSUCCESS');
      expect(result.engine_result_code).toBe(0);
    });
  });

  describe('tx', () => {
    it('should fetch transaction by hash', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        result: {
          tx: {
            transaction: {
              transaction_type: 'Payment',
              account: 'c1234567890ABCDEF',
              destination: 'c0987654321FEDCBA',
              amount: '1000000',
            },
            validated: true,
          },
        },
        id: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.tx({
        transaction: 'ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ',
      });

      expect(result.tx.transaction.transaction_type).toBe('Payment');
      expect(result.tx.validated).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw RpcError on JSON-RPC error', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: 'Method not found',
        },
        id: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(client.serverInfo()).rejects.toThrow(RpcError);
      await expect(client.serverInfo()).rejects.toThrow('Method not found');
    });

    it('should throw on HTTP error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(client.serverInfo()).rejects.toThrow('HTTP error! status: 500');
    });

    it('should throw on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(client.serverInfo()).rejects.toThrow('Network error');
    });

    it('should throw on timeout', async () => {
      const slowClient = new RpcClient({ server: 'http://localhost:5005', timeout: 1 });

      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      await expect(slowClient.serverInfo()).rejects.toThrow('timeout');
    });
  });

  describe('setServer', () => {
    it('should update server URL', () => {
      client.setServer('http://newserver:5005');
      expect(client.getServer()).toBe('http://newserver:5005');
    });
  });
});
