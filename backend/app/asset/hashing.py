import hashlib

def hash_asset(data: bytes):
    return hashlib.sha256(data).hexdigest()
