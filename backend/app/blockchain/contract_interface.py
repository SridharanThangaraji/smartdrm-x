import json
from web3 import Web3
from .web3_client import web3

CONTRACT_ADDRESS = "0x609A56CbBf4Ec216b62243Ecad64E8824d4b1C50"

with open("blockchain/contracts/SmartDRMX_ABI.json") as f:
    abi = json.load(f)

contract = web3.eth.contract(
        address=Web3.to_checksum_address(CONTRACT_ADDRESS),
    abi=abi
)

DEFAULT_SENDER = web3.eth.accounts[0]

def register_asset_on_chain(asset_hash: str, transferable=True):
    tx = contract.functions.registerAsset(
        asset_hash, transferable
    ).transact({
        "from": DEFAULT_SENDER
    })

    receipt = web3.eth.wait_for_transaction_receipt(tx)
    return receipt.transactionHash.hex()

def issue_license_on_chain(
    asset_id: int,
    user_address: str,
    expiry_time: int,
    access_limit: int
):
    tx = contract.functions.issueLicense(
        asset_id,
        user_address,
        expiry_time,
        access_limit
    ).transact({
        "from": DEFAULT_SENDER,
        "gas": 3000000
    })

    receipt = web3.eth.wait_for_transaction_receipt(tx)
    return receipt.transactionHash.hex()

