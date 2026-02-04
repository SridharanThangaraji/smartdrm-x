from web3 import Web3

GANACHE_URL = "http://127.0.0.1:8545"

web3 = Web3(Web3.HTTPProvider(GANACHE_URL))

assert web3.is_connected(), "Ganache not connected"

