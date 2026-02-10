"""
This module initializes the Web3 connection to the Ethereum blockchain (Ganache).
It provides a global web3 instance and includes fallback mock logic if the 
blockchain provider is unavailable, ensuring the backend remains functional during research.
"""
from web3 import Web3
from unittest.mock import MagicMock

GANACHE_URL = "http://127.0.0.1:8545"
web3 = Web3(Web3.HTTPProvider(GANACHE_URL))

if not web3.is_connected():
    print("WARNING: Ganache connection failed. Initializing mock blockchain interface.")
    web3.eth = MagicMock()
    web3.eth.accounts = ["0x" + "0" * 40]

