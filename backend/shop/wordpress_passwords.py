"""Compatibility hasher for accounts imported from WordPress.

Imported hashes are stored as ``wordpress$<original wp hash>`` so Django can
identify the verifier. ``must_update`` forces a normal PBKDF2 hash to replace
the legacy value after the user's first successful password login.
"""

import base64
import hashlib
import hmac

from django.contrib.auth.hashers import BasePasswordHasher
from django.utils.crypto import constant_time_compare


ITOA64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"


def _phpass(password: str, encoded: str) -> str:
    if len(encoded) < 12 or encoded[:3] not in ("$P$", "$H$"):
        return ""
    count_log2 = ITOA64.find(encoded[3])
    if count_log2 < 7 or count_log2 > 30:
        return ""
    salt = encoded[4:12].encode()
    password_bytes = password.encode("utf-8")
    digest = hashlib.md5(salt + password_bytes).digest()
    for _ in range(1 << count_log2):
        digest = hashlib.md5(digest + password_bytes).digest()

    output = ""
    idx = 0
    while idx < 16:
        value = digest[idx]
        idx += 1
        output += ITOA64[value & 0x3F]
        if idx < 16:
            value |= digest[idx] << 8
        output += ITOA64[(value >> 6) & 0x3F]
        if idx >= 16:
            break
        idx += 1
        if idx < 16:
            value |= digest[idx] << 16
        output += ITOA64[(value >> 12) & 0x3F]
        if idx >= 16:
            break
        idx += 1
        output += ITOA64[(value >> 18) & 0x3F]
    return encoded[:12] + output


class WordPressPasswordHasher(BasePasswordHasher):
    algorithm = "wordpress"

    def salt(self):
        return ""

    def encode(self, password, salt, iterations=None):
        raise NotImplementedError("WordPress hashes are imported, never generated")

    def decode(self, encoded):
        if not encoded.startswith(f"{self.algorithm}$"):
            raise ValueError("Not a WordPress password hash")
        return {"algorithm": self.algorithm, "hash": encoded.split("$", 1)[1]}

    def verify(self, password, encoded):
        original = self.decode(encoded)["hash"]
        if original.startswith(("$P$", "$H$")):
            return constant_time_compare(_phpass(password, original), original)
        if original.startswith("$wp$2y$"):
            try:
                import bcrypt
                prepared = base64.b64encode(
                    hmac.new(b"wp-sha384", password.encode("utf-8"), hashlib.sha384).digest()
                )
                bcrypt_hash = original[3:].replace("$2y$", "$2b$", 1).encode("ascii")
                return bcrypt.checkpw(prepared, bcrypt_hash)
            except (ImportError, ValueError, TypeError):
                return False
        return False

    def safe_summary(self, encoded):
        original = self.decode(encoded)["hash"]
        scheme = "wordpress-bcrypt" if original.startswith("$wp$") else "phpass"
        return {"algorithm": self.algorithm, "scheme": scheme, "hash": self.mask_hash(original)}

    def must_update(self, encoded):
        return True

    def harden_runtime(self, password, encoded):
        return None
