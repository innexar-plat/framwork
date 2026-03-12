"""Rate limiting for public and auth endpoints. Use get_remote_address as key."""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
