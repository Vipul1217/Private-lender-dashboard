import uuid
from sqlalchemy import Column, String


def gen_uuid() -> str:
    return str(uuid.uuid4())


def UUIDColumn(**kwargs):
    """Cross-database UUID primary/foreign key column (stored as a 36-char
    string). Using String instead of the Postgres-only UUID type means the
    same models work against the SQLite dev database and Postgres in
    docker-compose without any code changes."""
    return Column(String(36), **kwargs)
