"""
This module provides cryptographic services for SmartDRM-X using AES-256-GCM.
It handles key generation, persistence, and authenticated encryption/decryption of digital assets. 
In a production environment, keys should be managed via a hardware security module (HSM) or secure vault.
"""
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

KEY_FILE = "secret.key"

def get_cipher():
    """Retrieves or creates the 256-bit encryption key and initializes the AES-GCM cipher."""
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "rb") as f:
            key = f.read()
        if len(key) == 32:
            return AESGCM(key)
    
    # Generate new 256-bit key if missing or invalid
    key = AESGCM.generate_key(bit_length=256)
    with open(KEY_FILE, "wb") as f:
        f.write(key)
    return AESGCM(key)

# Global cipher instance
aesgcm = get_cipher()

def encrypt_data(data: bytes) -> bytes:
    """Encrypts bytes using AES-256-GCM, returning [nonce][ciphertext]."""
    nonce = os.urandom(12)
    return nonce + aesgcm.encrypt(nonce, data, None)

def decrypt_data(data: bytes) -> bytes:
    """Decrypts bytes using AES-256-GCM, expecting [nonce(12 bytes)][ciphertext]."""
    return aesgcm.decrypt(data[:12], data[12:], None)
