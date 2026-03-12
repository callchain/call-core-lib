# Call-Core JavaScript/TypeScript Library

A comprehensive TypeScript/JavaScript client library for interacting with the Call-Core blockchain. Supports both JSON-RPC and WebSocket APIs, works in Node.js and browsers.

## Features

- 🔌 **JSON-RPC Client** - Complete implementation of all 80+ Call-Core RPC methods
- 🌐 **WebSocket Client** - Real-time subscriptions with auto-reconnection
- 💰 **Crypto Utilities** - Native address codec, keypair generation, signing (secp256k1)
- 🏗️ **Transaction Builder** - Type-safe transaction construction with fluent API
- 📦 **No External Dependencies** - Uses standard npm crypto libraries (elliptic, hash.js)
- 🌐 **Universal** - Works in Node.js and browsers
- 📘 **TypeScript** - Full TypeScript support with comprehensive types

## Installation

```bash
npm install call-core-lib
```

## Quick Start

### RPC Client

```typescript
import { RpcClient } from 'call-core-lib';

const client = new RpcClient({ server: 'http://localhost:5005' });
const info = await client.serverInfo();
console.log('Server state:', info.info.server_state);
```

### WebSocket Client

```typescript
import { WebSocketClient } from 'call-core-lib';

const ws = new WebSocketClient({ url: 'ws://localhost:6005' });
await ws.connect();

ws.onLedger((ledger) => {
  console.log('New ledger:', ledger.ledger_index);
});
```

### Wallet Generation

```typescript
import { generateWallet } from 'call-core-lib';

const wallet = generateWallet();
console.log('Address:', wallet.address);
console.log('Seed:', wallet.seed);
```

### Transaction Building

```typescript
import { PaymentBuilder, callToDrops } from 'call-core-lib';

const payment = new PaymentBuilder('cSender...', 1)
  .setDestination('cDestination...')
  .setAmount(callToDrops('10'))
  .build();
```

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](./docs/getting-started.md) | Installation, quick start, and basic concepts |
| [RPC Client](./docs/rpc-client.md) | All 80+ RPC methods with examples |
| [WebSocket Client](./docs/websocket-client.md) | Real-time subscriptions and events |
| [Transactions](./docs/transactions.md) | Building and signing transactions |
| [Crypto](./docs/crypto.md) | Wallets, keys, signing, validation |
| [API Reference](./docs/api-reference.md) | Complete API reference |

## Browser Usage

```html
<script src="https://unpkg.com/call-core-lib/dist/browser/call-core-lib.min.js"></script>
<script>
  const { RpcClient, generateWallet } = CallCore;
  const wallet = generateWallet();
  console.log('Address:', wallet.address);
</script>
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Type check
npm run typecheck
```

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please submit issues and pull requests on GitHub.

## Support

For support, please open an issue on GitHub or contact the Call-Core team.
