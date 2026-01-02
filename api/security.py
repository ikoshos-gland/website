"""
Security Module for Azure Function API
Implements rate limiting, request validation, and authentication.
"""

import os
import time
import hashlib
import hmac
import logging
from functools import wraps
from typing import Optional, Callable
from collections import defaultdict
import azure.functions as func
import json

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

# Rate limiting settings
RATE_LIMIT_WINDOW = int(os.environ.get("RATE_LIMIT_WINDOW", 60))  # seconds
RATE_LIMIT_MAX_REQUESTS = int(os.environ.get("RATE_LIMIT_MAX_REQUESTS", 20))  # per window
RATE_LIMIT_CHAT_MAX = int(os.environ.get("RATE_LIMIT_CHAT_MAX", 10))  # stricter for chat

# Allowed origins (set in environment or use defaults)
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "https://proud-grass-02ea7a610.azurestaticapps.net,http://localhost:3000,http://localhost:5173"
).split(",")

# API Key for additional protection (optional, set in Azure)
API_SECRET_KEY = os.environ.get("API_SECRET_KEY", "")

# ═══════════════════════════════════════════════════════════════════════════
# IN-MEMORY RATE LIMITER (Use Redis for production scaling)
# ═══════════════════════════════════════════════════════════════════════════

class RateLimiter:
    """
    Simple in-memory rate limiter using sliding window.
    For multi-instance deployments, replace with Redis-based solution.
    """

    def __init__(self):
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._blocked: dict[str, float] = {}  # IP -> blocked until timestamp
        self._violation_count: dict[str, int] = defaultdict(int)

    def _clean_old_requests(self, key: str, window: int):
        """Remove requests outside the current window."""
        now = time.time()
        self._requests[key] = [
            ts for ts in self._requests[key]
            if now - ts < window
        ]

    def is_blocked(self, client_ip: str) -> bool:
        """Check if IP is temporarily blocked."""
        if client_ip in self._blocked:
            if time.time() < self._blocked[client_ip]:
                return True
            else:
                del self._blocked[client_ip]
        return False

    def block_ip(self, client_ip: str, duration: int = 300):
        """Block an IP for specified duration (default 5 minutes)."""
        self._blocked[client_ip] = time.time() + duration
        logger.warning(f"Blocked IP {client_ip} for {duration} seconds")

    def check_rate_limit(self, client_ip: str, max_requests: int, window: int) -> tuple[bool, int]:
        """
        Check if request is within rate limit.
        Returns (is_allowed, remaining_requests)
        """
        if self.is_blocked(client_ip):
            return False, 0

        self._clean_old_requests(client_ip, window)
        current_count = len(self._requests[client_ip])

        if current_count >= max_requests:
            # Track violations
            self._violation_count[client_ip] += 1

            # Block IP after repeated violations
            if self._violation_count[client_ip] >= 5:
                self.block_ip(client_ip, 600)  # 10 min block
                self._violation_count[client_ip] = 0

            return False, 0

        # Record this request
        self._requests[client_ip].append(time.time())
        return True, max_requests - current_count - 1

    def get_retry_after(self, client_ip: str, window: int) -> int:
        """Get seconds until rate limit resets."""
        if client_ip in self._blocked:
            return int(self._blocked[client_ip] - time.time())

        if self._requests[client_ip]:
            oldest = min(self._requests[client_ip])
            return int(window - (time.time() - oldest))
        return 0


# Global rate limiter instance
rate_limiter = RateLimiter()


# ═══════════════════════════════════════════════════════════════════════════
# SECURITY HELPERS
# ═══════════════════════════════════════════════════════════════════════════

def get_client_ip(req: func.HttpRequest) -> str:
    """Extract client IP from request headers."""
    # Azure Functions behind load balancer
    forwarded = req.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()

    # Direct connection
    return req.headers.get("X-Real-IP", req.headers.get("REMOTE_ADDR", "unknown"))


def get_cors_headers(req: func.HttpRequest) -> dict:
    """Generate CORS headers with origin validation."""
    origin = req.headers.get("Origin", "")

    headers = {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
    }

    # Only allow whitelisted origins
    if origin in ALLOWED_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        headers["Access-Control-Allow-Headers"] = "Content-Type, X-API-Key, X-Request-Timestamp, X-Request-Signature"
        headers["Access-Control-Max-Age"] = "86400"

    return headers


def validate_request_signature(req: func.HttpRequest) -> bool:
    """
    Validate HMAC signature for request authentication.
    Frontend must sign requests with shared secret.
    """
    if not API_SECRET_KEY:
        return True  # Skip if not configured

    signature = req.headers.get("X-Request-Signature", "")
    timestamp = req.headers.get("X-Request-Timestamp", "")

    if not signature or not timestamp:
        return False

    # Check timestamp freshness (prevent replay attacks)
    try:
        request_time = int(timestamp)
        if abs(time.time() - request_time) > 300:  # 5 minute window
            logger.warning("Request timestamp too old or in future")
            return False
    except ValueError:
        return False

    # Verify HMAC signature
    body = req.get_body().decode("utf-8", errors="ignore")
    message = f"{timestamp}:{body}"
    expected_signature = hmac.new(
        API_SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)


def validate_content_type(req: func.HttpRequest) -> bool:
    """Ensure POST requests have correct content type."""
    if req.method == "POST":
        content_type = req.headers.get("Content-Type", "")
        return "application/json" in content_type
    return True


def sanitize_input(text: str, max_length: int = 2000) -> str:
    """Sanitize user input to prevent injection attacks."""
    if not text:
        return ""

    # Truncate to max length
    text = text[:max_length]

    # Remove null bytes and control characters (except newlines/tabs)
    text = "".join(
        char for char in text
        if char == "\n" or char == "\t" or (ord(char) >= 32 and ord(char) != 127)
    )

    return text.strip()


# ═══════════════════════════════════════════════════════════════════════════
# SECURITY DECORATORS
# ═══════════════════════════════════════════════════════════════════════════

def secure_endpoint(max_requests: int = RATE_LIMIT_MAX_REQUESTS, require_signature: bool = False):
    """
    Decorator to add security to Azure Function endpoints.

    Args:
        max_requests: Maximum requests per window for this endpoint
        require_signature: Whether to require HMAC signature
    """
    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(req: func.HttpRequest) -> func.HttpResponse:
            headers = get_cors_headers(req)
            client_ip = get_client_ip(req)

            # Handle CORS preflight
            if req.method == "OPTIONS":
                return func.HttpResponse(status_code=204, headers=headers)

            # Check if IP is blocked
            if rate_limiter.is_blocked(client_ip):
                retry_after = rate_limiter.get_retry_after(client_ip, RATE_LIMIT_WINDOW)
                headers["Retry-After"] = str(retry_after)
                return func.HttpResponse(
                    json.dumps({"error": "Too many requests. You have been temporarily blocked."}),
                    status_code=429,
                    headers=headers,
                )

            # Check rate limit
            allowed, remaining = rate_limiter.check_rate_limit(
                client_ip, max_requests, RATE_LIMIT_WINDOW
            )

            headers["X-RateLimit-Limit"] = str(max_requests)
            headers["X-RateLimit-Remaining"] = str(remaining)
            headers["X-RateLimit-Reset"] = str(int(time.time()) + RATE_LIMIT_WINDOW)

            if not allowed:
                retry_after = rate_limiter.get_retry_after(client_ip, RATE_LIMIT_WINDOW)
                headers["Retry-After"] = str(retry_after)
                logger.warning(f"Rate limit exceeded for {client_ip}")
                return func.HttpResponse(
                    json.dumps({"error": "Rate limit exceeded. Please try again later."}),
                    status_code=429,
                    headers=headers,
                )

            # Validate content type for POST
            if not validate_content_type(req):
                return func.HttpResponse(
                    json.dumps({"error": "Invalid content type. Use application/json."}),
                    status_code=415,
                    headers=headers,
                )

            # Validate signature if required
            if require_signature and not validate_request_signature(req):
                logger.warning(f"Invalid signature from {client_ip}")
                return func.HttpResponse(
                    json.dumps({"error": "Invalid or missing request signature."}),
                    status_code=401,
                    headers=headers,
                )

            # Call the actual function
            try:
                response = fn(req)
                return response
            except Exception as e:
                logger.error(f"Error in {fn.__name__}: {e}")
                return func.HttpResponse(
                    json.dumps({"error": "Internal server error"}),
                    status_code=500,
                    headers=headers,
                )

        return wrapper
    return decorator


# ═══════════════════════════════════════════════════════════════════════════
# REQUEST VALIDATION
# ═══════════════════════════════════════════════════════════════════════════

def validate_chat_request(req: func.HttpRequest) -> tuple[bool, Optional[str], Optional[dict]]:
    """
    Validate chat request body.
    Returns (is_valid, error_message, parsed_body)
    """
    try:
        body = req.get_json()
    except ValueError:
        return False, "Invalid JSON body", None

    message = body.get("message", "")

    if not message:
        return False, "Message is required", None

    if not isinstance(message, str):
        return False, "Message must be a string", None

    # Sanitize message
    sanitized_message = sanitize_input(message, max_length=4000)

    if len(sanitized_message) < 1:
        return False, "Message cannot be empty", None

    # Validate conversation history if present
    history = body.get("conversation_history", [])
    if not isinstance(history, list):
        return False, "Conversation history must be an array", None

    # Limit history length to prevent abuse
    if len(history) > 20:
        history = history[-20:]

    # Sanitize history messages
    sanitized_history = []
    for msg in history:
        if isinstance(msg, dict) and "role" in msg and "content" in msg:
            if msg["role"] in ("user", "assistant"):
                sanitized_history.append({
                    "role": msg["role"],
                    "content": sanitize_input(str(msg["content"]), max_length=2000)
                })

    return True, None, {
        "message": sanitized_message,
        "conversation_history": sanitized_history
    }
