/**
 * WebSocket client tests using dummy server
 */

import { WebSocketClient } from '@/websocket/client';
import { DummyWebSocketServer } from '@/dummy-websocket-server';

describe('WebSocketClient with DummyWebSocketServer', () => {
  let server: DummyWebSocketServer;
  let client: WebSocketClient;
  let consoleSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Suppress expected WebSocket errors during tests
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Start fresh server on random port
    server = new DummyWebSocketServer({ port: 0 });
    await server.start();

    // Create client pointing to server
    client = new WebSocketClient({
      url: server.getUrl(),
      reconnect: false,
      timeout: 5000,
    });
  });

  afterEach(async () => {
    await client.disconnect();
    consoleSpy.mockRestore();
    await server.stop();
  });

  describe('Connection', () => {
    it('should connect to server', async () => {
      await client.connect();
      expect(client.isConnected()).toBe(true);
    });

    it('should get connection state', async () => {
      expect(client.getConnectionState()).toBe('disconnected');
      await client.connect();
      expect(client.getConnectionState()).toBe('connected');
    });

    it('should disconnect from server', async () => {
      await client.connect();
      expect(client.isConnected()).toBe(true);

      await client.disconnect();
      expect(client.isConnected()).toBe(false);
      expect(client.getConnectionState()).toBe('disconnected');
    });

    it('should throw error when not connected', async () => {
      await expect(client.serverInfo()).rejects.toThrow('WebSocket not connected');
    });
  });

  describe('Ping', () => {
    it('should ping server', async () => {
      await client.connect();
      const result = await client.ping();
      expect(result.role).toBe('admin');
    });
  });

  describe('Server Info', () => {
    it('should get server info', async () => {
      await client.connect();
      const info = await client.serverInfo();

      expect(info.info.build_version).toBeDefined();
      expect(info.info.server_state).toBe('full');
      expect(info.info.validated_ledger?.seq).toBeGreaterThan(0);
    });
  });

  describe('Ledger', () => {
    it('should get current ledger', async () => {
      await client.connect();
      const result = await client.ledger();

      expect(result.ledger.ledger_index).toBeDefined();
      expect(result.ledger.ledger_hash).toBeDefined();
      expect(result.validated).toBe(true);
    });

    it('should get specific ledger', async () => {
      await client.connect();
      const result = await client.ledger({ ledger_index: 1 });

      expect(result.ledger.ledger_index).toBe('1');
      expect(result.ledger.closed).toBe(true);
    });
  });

  describe('Account Info', () => {
    it('should get genesis account info', async () => {
      await client.connect();
      const result = await client.accountInfo({
        account: 'cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
      });

      expect(result.account_data.account).toBe('cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy');
      expect(result.account_data.balance).toBe('50000000000');
      expect(result.validated).toBe(true);
    });

    it('should get another genesis account', async () => {
      await client.connect();
      const result = await client.accountInfo({
        account: 'cHSFoKcGXFZdbB7EKmWQMTUJbr66dwfMR1',
      });

      expect(result.account_data.balance).toBe('100000000000');
    });

    it('should return error for non-existent account', async () => {
      await client.connect();
      await expect(
        client.accountInfo({ account: 'cNonExistentAccount' })
      ).rejects.toThrow('Account not found');
    });
  });

  describe('Submit Transaction', () => {
    it('should submit transaction blob', async () => {
      await client.connect();
      const result = await client.submit({
        tx_blob: '120000220000000024000000006140000000000F424068400000000000000A',
      });

      expect(result.engine_result).toBe('tesSUCCESS');
      expect(result.engine_result_code).toBe(0);
      expect(result.tx_blob).toBeDefined();
    });

    it('should return error for missing tx_blob', async () => {
      await client.connect();
      await expect(
        client.submit({ tx_blob: '' })
      ).rejects.toThrow('Missing tx_blob');
    });
  });

  describe('Subscriptions', () => {
    it('should subscribe to ledger stream', async () => {
      await client.connect();

      const ledgers: unknown[] = [];
      const unsubscribe = client.onLedger((message) => {
        ledgers.push(message);
      });

      // Wait for a ledger close
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should subscribe to transaction stream', async () => {
      await client.connect();

      const transactions: unknown[] = [];
      const unsubscribe = client.onTransaction((message) => {
        transactions.push(message);
      });

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should subscribe to account transactions', async () => {
      await client.connect();

      const transactions: unknown[] = [];
      const unsubscribe = client.onAccountTransaction(
        'cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
        (message) => {
          transactions.push(message);
        }
      );

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should subscribe to validation stream', async () => {
      await client.connect();

      const validations: unknown[] = [];
      const unsubscribe = client.onValidation((message) => {
        validations.push(message);
      });

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should subscribe to consensus stream', async () => {
      await client.connect();

      const consensus: unknown[] = [];
      const unsubscribe = client.onConsensus((message) => {
        consensus.push(message);
      });

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should subscribe to peer status stream', async () => {
      await client.connect();

      const peers: unknown[] = [];
      const unsubscribe = client.onPeerStatus((message) => {
        peers.push(message);
      });

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should unsubscribe from all streams', async () => {
      await client.connect();

      // Subscribe to multiple streams
      client.onLedger(() => {});
      client.onTransaction(() => {});

      // Unsubscribe all
      await client.unsubscribeAll();
    });
  });

  describe('Ledger Stream', () => {
    it('should receive ledger close notifications', (done) => {
      client.connect().then(() => {
        let ledgerReceived = false;

        client.onLedger((message) => {
          if (!ledgerReceived) {
            ledgerReceived = true;
            expect(message.type).toBe('ledgerClosed');
            expect(message.ledger_index).toBeGreaterThan(0);
            expect(message.ledger_hash).toBeDefined();
            done();
          }
        });

        // Force close a ledger
        server.closeLedger();
      });
    }, 10000);
  });

  describe('Custom Accounts', () => {
    it('should add custom account', async () => {
      server.addAccount('cCustomAccount', '12345678900');

      await client.connect();
      const result = await client.accountInfo({
        account: 'cCustomAccount',
      });

      expect(result.account_data.balance).toBe('12345678900');
    });
  });
});

describe('WebSocketClient with auto-reconnect', () => {
  let server: DummyWebSocketServer;
  let client: WebSocketClient;

  afterEach(async () => {
    // Suppress expected disconnect errors during cleanup
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await client?.disconnect();
    consoleSpy.mockRestore();
    await server?.stop();
  });

  it('should reconnect after server restart', async () => {
    // Suppress expected reconnection error logs
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Start server
    server = new DummyWebSocketServer({ port: 9998 });
    await server.start();

    // Create client with reconnect
    client = new WebSocketClient({
      url: 'ws://localhost:9998',
      reconnect: true,
      reconnectDelay: 100,
      maxReconnectAttempts: 5,
    });

    await client.connect();
    expect(client.isConnected()).toBe(true);

    // Stop server
    await server.stop();

    // Wait for disconnect
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(client.isConnected()).toBe(false);

    // Restart server
    server = new DummyWebSocketServer({ port: 9998 });
    await server.start();

    // Wait for reconnect
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(client.isConnected()).toBe(true);

    consoleSpy.mockRestore();
  }, 15000);
});
