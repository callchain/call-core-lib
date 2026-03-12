/**
 * Keypairs tests
 */

import {
  generateSeed,
  encodeSeed,
  decodeSeed,
  deriveKeypair,
  deriveAddress,
  sign,
  verify,
  generateWallet,
  isValidAddress,
  isValidSecret,
} from '@/crypto/keypairs';

describe('Keypairs', () => {
  describe('generateSeed', () => {
    it('should generate 16-byte seed', () => {
      const seed = generateSeed();
      expect(seed.length).toBe(16);
    });

    it('should generate different seeds each time', () => {
      const seed1 = generateSeed();
      const seed2 = generateSeed();
      expect(seed1).not.toEqual(seed2);
    });
  });

  describe('encodeSeed / decodeSeed', () => {
    it('should encode and decode seed correctly', () => {
      const seed = new Uint8Array(16).fill(0xab);
      const encoded = encodeSeed(seed);
      expect(typeof encoded).toBe('string');
      expect(encoded.startsWith('s')).toBe(true);

      const decoded = decodeSeed(encoded);
      expect(decoded).toEqual(seed);
    });

    it('should throw on invalid seed', () => {
      expect(() => decodeSeed('invalid')).toThrow();
    });
  });

  describe('deriveKeypair', () => {
    it('should derive keypair from seed', () => {
      const seed = generateSeed();
      const keypair = deriveKeypair(seed);

      expect(keypair.publicKey).toBeDefined();
      expect(keypair.privateKey).toBeDefined();
      expect(keypair.publicKey.length).toBe(66); // 33 bytes compressed in hex
      expect(keypair.privateKey.length).toBe(64); // 32 bytes in hex
    });

    it('should derive same keypair from same seed', () => {
      const seed = generateSeed();
      const keypair1 = deriveKeypair(seed);
      const keypair2 = deriveKeypair(seed);

      expect(keypair1.publicKey).toBe(keypair2.publicKey);
      expect(keypair1.privateKey).toBe(keypair2.privateKey);
    });

    it('should derive different keypairs from different seeds', () => {
      const seed1 = generateSeed();
      const seed2 = generateSeed();
      const keypair1 = deriveKeypair(seed1);
      const keypair2 = deriveKeypair(seed2);

      expect(keypair1.publicKey).not.toBe(keypair2.publicKey);
    });
  });

  describe('deriveAddress', () => {
    it('should derive address from public key', () => {
      const seed = generateSeed();
      const keypair = deriveKeypair(seed);
      const address = deriveAddress(keypair.publicKey);

      expect(typeof address).toBe('string');
      expect(address.startsWith('c')).toBe(true);
      expect(address.length).toBeGreaterThan(25);
    });

    it('should derive same address from same public key', () => {
      const seed = generateSeed();
      const keypair = deriveKeypair(seed);
      const address1 = deriveAddress(keypair.publicKey);
      const address2 = deriveAddress(keypair.publicKey);

      expect(address1).toBe(address2);
    });
  });

  describe('sign / verify', () => {
    it('should sign and verify message', () => {
      const seed = generateSeed();
      const keypair = deriveKeypair(seed);
      const message = 'hello world';
      const messageHex = Buffer.from(message).toString('hex');

      const signature = sign(messageHex, keypair.privateKey);
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);

      const isValid = verify(messageHex, signature, keypair.publicKey);
      expect(isValid).toBe(true);
    });

    it('should not verify with wrong public key', () => {
      const seed1 = generateSeed();
      const seed2 = generateSeed();
      const keypair1 = deriveKeypair(seed1);
      const keypair2 = deriveKeypair(seed2);
      const message = 'hello world';
      const messageHex = Buffer.from(message).toString('hex');

      const signature = sign(messageHex, keypair1.privateKey);
      const isValid = verify(messageHex, signature, keypair2.publicKey);
      expect(isValid).toBe(false);
    });

    it('should not verify tampered message', () => {
      const seed = generateSeed();
      const keypair = deriveKeypair(seed);
      const message = 'hello world';
      const messageHex = Buffer.from(message).toString('hex');

      const signature = sign(messageHex, keypair.privateKey);
      const tamperedHex = Buffer.from('hello world!').toString('hex');
      const isValid = verify(tamperedHex, signature, keypair.publicKey);
      expect(isValid).toBe(false);
    });
  });

  describe('generateWallet', () => {
    it('should generate complete wallet', () => {
      const wallet = generateWallet();

      expect(wallet.seed).toBeDefined();
      expect(wallet.publicKey).toBeDefined();
      expect(wallet.privateKey).toBeDefined();
      expect(wallet.address).toBeDefined();

      expect(wallet.seed.startsWith('s')).toBe(true);
      expect(wallet.address.startsWith('c')).toBe(true);
    });

    it('should generate different wallets each time', () => {
      const wallet1 = generateWallet();
      const wallet2 = generateWallet();

      expect(wallet1.seed).not.toBe(wallet2.seed);
      expect(wallet1.address).not.toBe(wallet2.address);
    });
  });

  describe('isValidAddress', () => {
    it('should return true for valid address', () => {
      const wallet = generateWallet();
      expect(isValidAddress(wallet.address)).toBe(true);
    });

    it('should return false for invalid addresses', () => {
      expect(isValidAddress('')).toBe(false);
      expect(isValidAddress('notanaddress')).toBe(false);
      expect(isValidAddress('rN7n7otQDd6FczFgLdlqtyMVrn3HMfHgFj')).toBe(false); // Ripple address
      expect(isValidAddress('c')).toBe(false);
    });
  });

  describe('isValidSecret', () => {
    it('should return true for valid secret', () => {
      const wallet = generateWallet();
      expect(isValidSecret(wallet.seed)).toBe(true);
    });

    it('should return false for invalid secrets', () => {
      expect(isValidSecret('')).toBe(false);
      expect(isValidSecret('notasecret')).toBe(false);
      expect(isValidSecret('s')).toBe(false);
    });
  });
});
