#!/usr/bin/env python3
"""
Dump comprehensive data from call-core devnet for testing purposes.
This script extracts:
- Ledger state (accounts, trustlines, offers, etc.)
- Transaction history
- STObjects
- Full ledger snapshots
"""

import json
import requests
import os
from datetime import datetime

RPC_URL = "http://localhost:5005"
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

def rpc_call(method, params=None):
    """Make an RPC call to the devnet"""
    payload = {
        "jsonrpc": "2.0",
        "method": method,
        "id": 1
    }
    if params:
        payload["params"] = params

    try:
        response = requests.post(RPC_URL, json=payload, headers={"Content-Type": "application/json"})
        return response.json().get("result", {})
    except Exception as e:
        print(f"Error calling {method}: {e}")
        return {}

def dump_ledger():
    """Dump the full ledger state"""
    print("Dumping ledger state...")
    result = rpc_call("dump_ledger")

    with open(os.path.join(DATA_DIR, 'ledger_full_dump.json'), 'w') as f:
        json.dump(result, f, indent=2)

    print(f"  - Total entries: {result.get('statistics', {}).get('total_entries', 0)}")
    print(f"  - Accounts: {result.get('statistics', {}).get('account_count', 0)}")
    print(f"  - Transactions: {result.get('statistics', {}).get('transaction_count', 0)}")

    return result

def dump_server_info():
    """Dump server information"""
    print("Dumping server info...")
    result = rpc_call("server_info")

    with open(os.path.join(DATA_DIR, 'server_info.json'), 'w') as f:
        json.dump(result, f, indent=2)

    info = result.get('info', {})
    print(f"  - Version: {info.get('build_version', 'unknown')}")
    print(f"  - Ledger: {info.get('validated_ledger', {}).get('seq', 0)}")

    return result

def dump_ledger_info():
    """Dump current ledger info"""
    print("Dumping ledger info...")
    result = rpc_call("ledger", {"ledger_index": "current"})

    with open(os.path.join(DATA_DIR, 'ledger_info.json'), 'w') as f:
        json.dump(result, f, indent=2)

    ledger = result.get('ledger', {})
    print(f"  - Ledger index: {ledger.get('ledger_index', 'unknown')}")
    print(f"  - Closed: {ledger.get('closed', False)}")

    return result

def dump_transaction_history():
    """Dump transaction history"""
    print("Dumping transaction history...")
    result = rpc_call("tx_history", {"start": 0})

    with open(os.path.join(DATA_DIR, 'transaction_history.json'), 'w') as f:
        json.dump(result, f, indent=2)

    txs = result.get('transactions', [])
    print(f"  - Transactions: {len(txs)}")

    return result

def dump_fee_info():
    """Dump fee information"""
    print("Dumping fee info...")
    result = rpc_call("fee")

    with open(os.path.join(DATA_DIR, 'fee_info.json'), 'w') as f:
        json.dump(result, f, indent=2)

    print(f"  - Base fee: {result.get('droplets', 'unknown')} drops")

    return result

def dump_genesis_accounts():
    """Save genesis account information"""
    print("Dumping genesis accounts...")

    accounts = [
        {"address": "cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy", "hex": "50370298f2835f216d4f2956738e24369cbc3b77", "balance": "50000"},
        {"address": "cUUsn5u9qPq7MiMiEDwdjMPsHHKyaesHPH", "hex": "7abfb259dd4df0fe4f72398743542bd017a1e34b", "balance": "5000"},
        {"address": "cHSFoKcGXFZdbB7EKmWQMTUJbr66dwfMR1", "hex": "acea885a70534357d59c30ae4f5d9de02e336530", "balance": "100000"},
        {"address": "cKKeufyrSZymFeGmtF1Vhi11eCSf2i6MhR", "hex": "b4644fcd4f991451aa69693a60b6ca7689a58548", "balance": "25000"},
        {"address": "c3K3xXhvsWBnP3TitQfeg2ihAuaYybvtc7", "hex": "c8f96339b969bb5da024b9ab82e93460647416a7", "balance": "10000"}
    ]

    with open(os.path.join(DATA_DIR, 'genesis_accounts.json'), 'w') as f:
        json.dump(accounts, f, indent=2)

    print(f"  - Genesis accounts: {len(accounts)}")

    return accounts

def create_stobject_examples():
    """Create examples of STObjects (Serialized Transaction Objects)"""
    print("Creating STObject examples...")

    examples = {
        "AccountRoot": {
            "LedgerEntryType": "AccountRoot",
            "Account": "cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy",
            "Balance": "50000000000",
            "Sequence": 1,
            "OwnerCount": 0,
            "Flags": 0
        },
        "CallState": {
            "LedgerEntryType": "CallState",
            "Account": "cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy",
            "Issuer": "cHSFoKcGXFZdbB7EKmWQMTUJbr66dwfMR1",
            "Currency": "USD",
            "Balance": {
                "currency": "USD",
                "issuer": "cHSFoKcGXFZdbB7EKmWQMTUJbr66dwfMR1",
                "value": "100"
            },
            "Limit": {
                "currency": "USD",
                "issuer": "cHSFoKcGXFZdbB7EKmWQMTUJbr66dwfMR1",
                "value": "1000"
            },
            "Flags": 0
        },
        "Offer": {
            "LedgerEntryType": "Offer",
            "Account": "cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy",
            "Sequence": 1,
            "TakerPays": {
                "currency": "USD",
                "issuer": "cHSFoKcGXFZdbB7EKmWQMTUJbr66dwfMR1",
                "value": "100"
            },
            "TakerGets": "1000000",
            "BookDirectory": "ABC1230000000000000000000000000000000000000000000000000000000000",
            "Flags": 0
        },
        "PaymentTransaction": {
            "TransactionType": "Payment",
            "Account": "cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy",
            "Destination": "c3K3xXhvsWBnP3TitQfeg2ihAuaYybvtc7",
            "Amount": "1000000",
            "Fee": "10",
            "Sequence": 1
        },
        "TrustSetTransaction": {
            "TransactionType": "TrustSet",
            "Account": "cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy",
            "LimitAmount": {
                "currency": "USD",
                "issuer": "cHSFoKcGXFZdbB7EKmWQMTUJbr66dwfMR1",
                "value": "1000"
            },
            "Fee": "10",
            "Sequence": 1
        },
        "OfferCreateTransaction": {
            "TransactionType": "OfferCreate",
            "Account": "cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy",
            "TakerGets": "1000000",
            "TakerPays": {
                "currency": "USD",
                "issuer": "cHSFoKcGXFZdbB7EKmWQMTUJbr66dwfMR1",
                "value": "100"
            },
            "Fee": "10",
            "Sequence": 1
        },
        "SignerList": {
            "LedgerEntryType": "SignerList",
            "Account": "cGmJBrEfFssWuas4kCoHTX5r6aMEf6QHhy",
            "SignerQuorum": 2,
            "Signers": [
                {"SignerEntry": {"Account": "c3K3xXhvsWBnP3TitQfeg2ihAuaYybvtc7", "SignerWeight": 1}},
                {"SignerEntry": {"Account": "cHSFoKcGXFZdbB7EKmWQMTUJbr66dwfMR1", "SignerWeight": 1}}
            ],
            "Flags": 0
        }
    }

    with open(os.path.join(DATA_DIR, 'stobject_examples.json'), 'w') as f:
        json.dump(examples, f, indent=2)

    print(f"  - STObject examples: {len(examples)}")

    return examples

def create_metadata_examples():
    """Create examples of transaction metadata"""
    print("Creating metadata examples...")

    examples = {
        "PaymentMetadata": {
            "AffectedNodes": [
                {
                    "ModifiedNode": {
                        "LedgerEntryType": "AccountRoot",
                        "LedgerIndex": "ABC123...",
                        "PreviousFields": {
                            "Balance": "2000000"
                        },
                        "FinalFields": {
                            "Account": "cSender...",
                            "Balance": "1000000"
                        }
                    }
                },
                {
                    "ModifiedNode": {
                        "LedgerEntryType": "AccountRoot",
                        "LedgerIndex": "DEF456...",
                        "PreviousFields": {
                            "Balance": "5000000"
                        },
                        "FinalFields": {
                            "Account": "cReceiver...",
                            "Balance": "6000000"
                        }
                    }
                }
            ],
            "TransactionIndex": 0,
            "TransactionResult": "tesSUCCESS"
        },
        "OfferCreateMetadata": {
            "AffectedNodes": [
                {
                    "CreatedNode": {
                        "LedgerEntryType": "Offer",
                        "LedgerIndex": "ABC123...",
                        "NewFields": {
                            "Account": "cTrader...",
                            "TakerGets": "1000000",
                            "TakerPays": {"currency": "USD", "issuer": "cIssuer...", "value": "50"},
                            "Sequence": 1,
                            "Flags": 0
                        }
                    }
                }
            ],
            "TransactionIndex": 0,
            "TransactionResult": "tesSUCCESS"
        }
    }

    with open(os.path.join(DATA_DIR, 'metadata_examples.json'), 'w') as f:
        json.dump(examples, f, indent=2)

    print(f"  - Metadata examples: {len(examples)}")

    return examples

def main():
    """Main entry point"""
    print(f"Call-Core Devnet Data Dumper")
    print(f"RPC URL: {RPC_URL}")
    print(f"Data directory: {DATA_DIR}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("-" * 50)

    # Ensure data directory exists
    os.makedirs(DATA_DIR, exist_ok=True)

    # Dump all data
    dump_server_info()
    dump_ledger_info()
    dump_ledger()
    dump_transaction_history()
    dump_fee_info()
    dump_genesis_accounts()
    create_stobject_examples()
    create_metadata_examples()

    print("-" * 50)
    print("All data dumped successfully!")
    print(f"Files saved to: {DATA_DIR}")

if __name__ == "__main__":
    main()
