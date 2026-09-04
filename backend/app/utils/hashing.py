import hashlib


def hash_otp(otp: str, identifier: str) -> str:
    """Simple salted hash for OTP storage. Salting with the identifier
    means the same OTP digits hash differently per user/session."""
    return hashlib.sha256(f"{identifier}:{otp}".encode()).hexdigest()
