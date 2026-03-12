/**
 * Dummy Call-Core Blockchain for Testing
 *
 * Provides a mock blockchain implementation for unit tests without
 * requiring a running devnet or testnet.
 *
 * @example
 * ```typescript
 * import { DummyBlockchain } from 'call-core-lib/dummy-blockchain';
 *
 * const blockchain = new DummyBlockchain();
 *
 * // Add genesis accounts
 * await blockchain.fundAccount('cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy', '100000');
 *
 * // Create transactions
 * const tx = await blockchain.submitPayment({
 *   Account: 'cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy',
 *   Destination: 'c3K3xXhvsWBnP3TitQfeg2ihAuaYybvtc7',
 *   Amount: '1000000'
 * });
 *
 * // Query ledger
 * const account = await blockchain.getAccount('cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy');
 * console.log(account.Balance); // '99000000'
 * ```
 */

/** Account root ledger entry */
export interface AccountRoot {
  LedgerEntryType: 'AccountRoot';
  LedgerIndex: string;
  Account: string;
  Balance: string;
  Sequence: number;
  OwnerCount: number;
  PreviousTxnID?: string;
  PreviousTxnLgrSeq?: number;
  Flags?: number;
  RegularKey?: string;
  EmailHash?: string;
  MessageKey?: string;
  Domain?: string;
  TransferRate?: number;
  TickSize?: number;
}

/** CallState (trust line) ledger entry */
export interface CallState {
  LedgerEntryType: 'CallState';
  LedgerIndex: string;
  Account: string;
  Issuer: string;
  Currency: string;
  Balance: CurrencyAmount;
  Limit: CurrencyAmount;
  LimitPeer?: CurrencyAmount;
  QualityIn?: number;
  QualityOut?: number;
  Flags?: number;
  PreviousTxnID?: string;
  PreviousTxnLgrSeq?: number;
}

/** Offer ledger entry */
export interface Offer {
  LedgerEntryType: 'Offer';
  LedgerIndex: string;
  Account: string;
  Sequence: number;
  TakerPays: CurrencyAmount | string;
  TakerGets: CurrencyAmount | string;
  BookDirectory: string;
  BookNode?: string;
  OwnerNode?: string;
  Expiration?: number;
  Flags?: number;
  PreviousTxnID?: string;
  PreviousTxnLgrSeq?: number;
}

/** SignerList ledger entry */
export interface SignerList {
  LedgerEntryType: 'SignerList';
  LedgerIndex: string;
  Account: string;
  SignerQuorum: number;
  Signers: SignerEntry[];
  Flags?: number;
  PreviousTxnID?: string;
  PreviousTxnLgrSeq?: number;
}

/** Signer entry within SignerList */
export interface SignerEntry {
  Account: string;
  SignerWeight: number;
}

/** Currency amount (issued or native) */
export interface CurrencyAmount {
  currency: string;
  issuer: string;
  value: string;
}

/** Transaction metadata */
export interface TransactionMetadata {
  AffectedNodes: AffectedNode[];
  TransactionIndex: number;
  TransactionResult: string;
  DeliveredAmount?: CurrencyAmount | string;
}

/** Affected node in transaction metadata */
export interface AffectedNode {
  CreatedNode?: LedgerEntry;
  ModifiedNode?: LedgerEntry;
  DeletedNode?: LedgerEntry;
}

/** Generic ledger entry */
export type LedgerEntry = AccountRoot | CallState | Offer | SignerList;

/** Transaction record */
export interface TransactionRecord {
  hash: string;
  tx: Transaction;
  meta: TransactionMetadata;
  ledger_index: number;
  validated: boolean;
  date?: number;
}

/** Payment transaction (for testing) */
export interface Payment {
  TransactionType: 'Payment';
  Account: string;
  Destination: string;
  Amount: string | CurrencyAmount;
  Fee?: string;
  Sequence?: number;
}

/** TrustSet transaction (for testing) */
export interface TrustSet {
  TransactionType: 'TrustSet';
  Account: string;
  LimitAmount: CurrencyAmount;
  Fee?: string;
  Sequence?: number;
}

/** OfferCreate transaction (for testing) */
export interface OfferCreate {
  TransactionType: 'OfferCreate';
  Account: string;
  TakerGets: string | CurrencyAmount;
  TakerPays: string | CurrencyAmount;
  Fee?: string;
  Sequence?: number;
}

/** AccountSet transaction (for testing) */
export interface AccountSet {
  TransactionType: 'AccountSet';
  Account: string;
  Domain?: string;
  Fee?: string;
  Sequence?: number;
}

/** SignerListSet transaction (for testing) */
export interface SignerListSet {
  TransactionType: 'SignerListSet';
  Account: string;
  SignerQuorum: number;
  Signers: SignerEntry[];
  Fee?: string;
  Sequence?: number;
}

/** Transaction types */
export type Transaction =
  | Payment
  | TrustSet
  | OfferCreate
  | AccountSet
  | SignerListSet;

/** Ledger header */
export interface LedgerHeader {
  ledger_index: number;
  ledger_hash: string;
  parent_hash: string;
  close_time: number;
  close_time_resolution: number;
  close_flags: number;
  account_hash: string;
  transaction_hash: string;
  total_coins: string;
}

/** Ledger data */
export interface Ledger {
  header: LedgerHeader;
  entries: Map<string, LedgerEntry>;
  transactions: TransactionRecord[];
}

/** RPC response format */
export interface RpcResponse<T = unknown> {
  result: T;
  status: string;
  warning?: string;
}

/**
 * Dummy blockchain implementation for testing
 */
export class DummyBlockchain {
  private ledgers: Map<number, Ledger> = new Map();
  private accounts: Map<string, AccountRoot> = new Map();
  private callStates: Map<string, CallState[]> = new Map();
  private offers: Map<string, Offer[]> = new Map();
  private signerLists: Map<string, SignerList> = new Map();
  private transactions: TransactionRecord[] = [];

  private currentLedgerIndex = 1;
  private currentLedgerHash = '0000000000000000000000000000000000000000000000000000000000000001';
  private transactionCounter = 0;

  /** Base fee in drops */
  baseFee = '10';

  /** Reserve base in drops */
  reserveBase = '10000000';

  /** Reserve increment in drops */
  reserveIncrement = '2000000';

  constructor() {
    this.initializeGenesisLedger();
  }

  /**
   * Initialize the genesis ledger with default state
   */
  private initializeGenesisLedger(): void {
    const header: LedgerHeader = {
      ledger_index: 1,
      ledger_hash: this.currentLedgerHash,
      parent_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      close_time: Math.floor(Date.now() / 1000),
      close_time_resolution: 10,
      close_flags: 0,
      account_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      transaction_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      total_coins: '100000000000000000',
    };

    this.ledgers.set(1, {
      header,
      entries: new Map(),
      transactions: [],
    });
  }

  /**
   * Fund an account with initial balance
   */
  async fundAccount(address: string, balance: string): Promise<AccountRoot> {
    const ledgerIndex = this.computeLedgerIndex('AccountRoot', address);

    const account: AccountRoot = {
      LedgerEntryType: 'AccountRoot',
      LedgerIndex: ledgerIndex,
      Account: address,
      Balance: balance,
      Sequence: 1,
      OwnerCount: 0,
      Flags: 0,
      PreviousTxnID: '0000000000000000000000000000000000000000000000000000000000000000',
      PreviousTxnLgrSeq: 1,
    };

    this.accounts.set(address, account);

    // Add to current ledger
    const ledger = this.ledgers.get(this.currentLedgerIndex);
    if (ledger) {
      ledger.entries.set(ledgerIndex, account);
    }

    return account;
  }

  /**
   * Get account information
   */
  async getAccount(address: string): Promise<AccountRoot | null> {
    return this.accounts.get(address) || null;
  }

  /**
   * Get account trust lines (CallStates)
   */
  async getTrustLines(address: string): Promise<CallState[]> {
    return this.callStates.get(address) || [];
  }

  /**
   * Get account offers
   */
  async getOffers(address: string): Promise<Offer[]> {
    return this.offers.get(address) || [];
  }

  /**
   * Get signer list for account
   */
  async getSignerList(address: string): Promise<SignerList | null> {
    return this.signerLists.get(address) || null;
  }

  /**
   * Submit a payment transaction
   */
  async submitPayment(tx: Payment): Promise<TransactionRecord> {
    const { Account, Destination, Amount, Fee } = tx;
    const fee = parseInt(Fee || this.baseFee, 10);
    const amount = typeof Amount === 'string' ? parseInt(Amount, 10) : 0;

    // Get source account
    const sourceAccount = this.accounts.get(Account);
    if (!sourceAccount) {
      throw new Error(`Source account not found: ${Account}`);
    }

    // Check balance
    const sourceBalance = parseInt(sourceAccount.Balance, 10);
    if (sourceBalance < amount + fee) {
      throw new Error('Insufficient balance');
    }

    // Update source account
    sourceAccount.Balance = (sourceBalance - amount - fee).toString();
    sourceAccount.Sequence++;

    // Update or create destination account
    let destAccount = this.accounts.get(Destination);
    if (!destAccount) {
      destAccount = await this.fundAccount(Destination, '0');
    }
    const destBalance = parseInt(destAccount.Balance, 10);
    destAccount.Balance = (destBalance + amount).toString();

    // Create transaction record
    const txHash = this.computeTransactionHash();
    const record: TransactionRecord = {
      hash: txHash,
      tx,
      meta: this.createPaymentMetadata(sourceAccount, destAccount, Amount),
      ledger_index: this.currentLedgerIndex,
      validated: true,
      date: Math.floor(Date.now() / 1000),
    };

    this.transactions.push(record);
    return record;
  }

  /**
   * Submit a trust set transaction
   */
  async submitTrustSet(tx: TrustSet): Promise<TransactionRecord> {
    const { Account, LimitAmount } = tx;

    if (typeof LimitAmount === 'string') {
      throw new Error('LimitAmount must be a CurrencyAmount');
    }

    const callState: CallState = {
      LedgerEntryType: 'CallState',
      LedgerIndex: this.computeLedgerIndex('CallState', Account + LimitAmount.issuer + LimitAmount.currency),
      Account,
      Issuer: LimitAmount.issuer,
      Currency: LimitAmount.currency,
      Balance: { currency: LimitAmount.currency, issuer: LimitAmount.issuer, value: '0' },
      Limit: LimitAmount,
      Flags: 0,
      PreviousTxnID: '0000000000000000000000000000000000000000000000000000000000000000',
      PreviousTxnLgrSeq: this.currentLedgerIndex,
    };

    // Add to account's trust lines
    const existing = this.callStates.get(Account) || [];
    existing.push(callState);
    this.callStates.set(Account, existing);

    // Update account owner count
    const account = this.accounts.get(Account);
    if (account) {
      account.OwnerCount++;
    }

    const txHash = this.computeTransactionHash();
    const record: TransactionRecord = {
      hash: txHash,
      tx,
      meta: this.createTrustSetMetadata(callState),
      ledger_index: this.currentLedgerIndex,
      validated: true,
      date: Math.floor(Date.now() / 1000),
    };

    this.transactions.push(record);
    return record;
  }

  /**
   * Submit an offer create transaction
   */
  async submitOfferCreate(tx: OfferCreate): Promise<TransactionRecord> {
    const { Account, TakerGets, TakerPays } = tx;

    if (!Account) {
      throw new Error('Account is required');
    }

    const sequence = this.accounts.get(Account)?.Sequence || 1;

    const offer: Offer = {
      LedgerEntryType: 'Offer',
      LedgerIndex: this.computeLedgerIndex('Offer', Account + sequence.toString()),
      Account: Account,
      Sequence: sequence,
      TakerGets: TakerGets,
      TakerPays: TakerPays,
      BookDirectory: this.computeBookDirectory(TakerGets, TakerPays),
      Flags: 0,
      PreviousTxnID: '0000000000000000000000000000000000000000000000000000000000000000',
      PreviousTxnLgrSeq: this.currentLedgerIndex,
    };

    // Add to account's offers
    const existing = this.offers.get(Account) || [];
    existing.push(offer);
    this.offers.set(Account, existing);

    // Update account owner count
    const accountInfo = this.accounts.get(Account);
    if (accountInfo) {
      accountInfo.OwnerCount++;
      accountInfo.Sequence++;
    }

    const txHash = this.computeTransactionHash();
    const record: TransactionRecord = {
      hash: txHash,
      tx,
      meta: this.createOfferCreateMetadata(offer),
      ledger_index: this.currentLedgerIndex,
      validated: true,
      date: Math.floor(Date.now() / 1000),
    };

    this.transactions.push(record);
    return record;
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<TransactionRecord | null> {
    return this.transactions.find((t) => t.hash === hash) || null;
  }

  /**
   * Get account transaction history
   */
  async getAccountTransactions(address: string): Promise<TransactionRecord[]> {
    return this.transactions.filter((t) => {
      const tx = t.tx as { Account?: string; Destination?: string };
      return tx.Account === address || tx.Destination === address;
    });
  }

  /**
   * Close the current ledger and start a new one
   */
  async closeLedger(): Promise<void> {
    this.currentLedgerIndex++;
    this.currentLedgerHash = this.computeLedgerHash();

    const header: LedgerHeader = {
      ledger_index: this.currentLedgerIndex,
      ledger_hash: this.currentLedgerHash,
      parent_hash: this.currentLedgerHash,
      close_time: Math.floor(Date.now() / 1000),
      close_time_resolution: 10,
      close_flags: 0,
      account_hash: this.computeAccountHash(),
      transaction_hash: this.computeTransactionHash(),
      total_coins: '100000000000000000',
    };

    this.ledgers.set(this.currentLedgerIndex, {
      header,
      entries: new Map(),
      transactions: [],
    });
  }

  /**
   * Get current ledger info
   */
  async getCurrentLedger(): Promise<LedgerHeader> {
    const ledger = this.ledgers.get(this.currentLedgerIndex);
    if (!ledger) {
      throw new Error('No current ledger');
    }
    return ledger.header;
  }

  /**
   * Dump full ledger state (similar to RPC dump_ledger)
   */
  async dumpLedger(): Promise<{
    ledger_info: {
      ledger_index: number;
      ledger_hash: string;
    };
    entries: {
      account_roots: AccountRoot[];
      call_states: CallState[];
      offers: Offer[];
      signer_lists: SignerList[];
    };
    statistics: {
      total_entries: number;
      account_count: number;
      trust_line_count: number;
      offer_count: number;
      signer_list_count: number;
    };
  }> {
    const accountRoots = Array.from(this.accounts.values());
    const callStates = Array.from(this.callStates.values()).flat();
    const allOffers = Array.from(this.offers.values()).flat();
    const signerLists = Array.from(this.signerLists.values());

    return {
      ledger_info: {
        ledger_index: this.currentLedgerIndex,
        ledger_hash: this.currentLedgerHash,
      },
      entries: {
        account_roots: accountRoots,
        call_states: callStates,
        offers: allOffers,
        signer_lists: signerLists,
      },
      statistics: {
        total_entries: accountRoots.length + callStates.length + allOffers.length + signerLists.length,
        account_count: accountRoots.length,
        trust_line_count: callStates.length,
        offer_count: allOffers.length,
        signer_list_count: signerLists.length,
      },
    };
  }

  // Private helper methods

  private computeLedgerIndex(entryType: string, key: string): string {
    // Simple hash for testing
    let hash = 0;
    const str = entryType + key;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  private computeTransactionHash(): string {
    this.transactionCounter++;
    return this.transactionCounter.toString(16).padStart(64, '0');
  }

  private computeLedgerHash(): string {
    return Math.random().toString(16).slice(2).padStart(64, '0');
  }

  private computeAccountHash(): string {
    return '0000000000000000000000000000000000000000000000000000000000000000';
  }

  private computeBookDirectory(takerGets: CurrencyAmount | string, takerPays: CurrencyAmount | string): string {
    const gets = typeof takerGets === 'string' ? 'CALL' : takerGets.currency;
    const pays = typeof takerPays === 'string' ? 'CALL' : takerPays.currency;
    return (gets + pays).padStart(64, '0');
  }

  private createPaymentMetadata(
    source: AccountRoot,
    dest: AccountRoot,
    _amount: CurrencyAmount | string
  ): TransactionMetadata {
    return {
      AffectedNodes: [
        {
          ModifiedNode: {
            ...(source as AccountRoot),
            LedgerEntryType: 'AccountRoot',
            LedgerIndex: source.LedgerIndex,
          },
        },
        {
          ModifiedNode: {
            ...(dest as AccountRoot),
            LedgerEntryType: 'AccountRoot',
            LedgerIndex: dest.LedgerIndex,
          },
        },
      ],
      TransactionIndex: 0,
      TransactionResult: 'tesSUCCESS',
    };
  }

  private createTrustSetMetadata(callState: CallState): TransactionMetadata {
    return {
      AffectedNodes: [
        {
          CreatedNode: {
            ...(callState as CallState),
            LedgerEntryType: 'CallState',
            LedgerIndex: callState.LedgerIndex,
          },
        },
      ],
      TransactionIndex: 0,
      TransactionResult: 'tesSUCCESS',
    };
  }

  private createOfferCreateMetadata(offer: Offer): TransactionMetadata {
    return {
      AffectedNodes: [
        {
          CreatedNode: {
            ...(offer as Offer),
            LedgerEntryType: 'Offer',
            LedgerIndex: offer.LedgerIndex,
          },
        },
      ],
      TransactionIndex: 0,
      TransactionResult: 'tesSUCCESS',
    };
  }
}

/**
 * Create a pre-configured dummy blockchain with genesis accounts
 */
export function createDummyBlockchain(): DummyBlockchain {
  const blockchain = new DummyBlockchain();

  // Fund genesis accounts (matches devnet genesis)
  void blockchain.fundAccount('cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy', '50000000000');
  void blockchain.fundAccount('c3K3xXhvsWBnP3TitQfeg2ihAuaYybvtc7', '10000000000');
  void blockchain.fundAccount('cHSFoKcGXFZdbB7EKmWQMTUJbr66dwfMR1', '100000000000');
  void blockchain.fundAccount('cKKeufyrSZymFeGmtF1Vhi11eCSf2i6MhR', '25000000000');
  void blockchain.fundAccount('cUUsn5u9qPq7MiMiEDwdjMPsHHKyaesHPH', '5000000000');

  return blockchain;
}

export default DummyBlockchain;
