"""
Password encryption utilities for client admin accounts
"""
from cryptography.fernet import Fernet
import os

# Store the key in a file for consistency
KEY_FILE = "encryption_key.key"

def get_encryption_key():
    """Get or generate encryption key"""
    # Try to load from environment first
    key = os.getenv('ENCRYPTION_KEY')
    if key:
        if isinstance(key, str) and len(key) == 44:
            return key.encode()
        elif isinstance(key, bytes) and len(key) == 44:
            return key
    
    # Try to load from file
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, 'rb') as f:
            key = f.read()
        if len(key) == 44:
            return key
    
    # Generate new key and save it
    key = Fernet.generate_key()
    with open(KEY_FILE, 'wb') as f:
        f.write(key)
    return key

def encrypt_password(password: str) -> str:
    """Encrypt a password"""
    if not password:
        return ""
    key = get_encryption_key()
    f = Fernet(key)
    encrypted = f.encrypt(password.encode())
    return encrypted.decode()

def decrypt_password(encrypted_password: str) -> str:
    """Decrypt a password"""
    if not encrypted_password:
        return ""
    try:
        key = get_encryption_key()
        f = Fernet(key)
        decrypted = f.decrypt(encrypted_password.encode())
        return decrypted.decode()
    except Exception as e:
        raise ValueError(f"Failed to decrypt password: {str(e)}")

