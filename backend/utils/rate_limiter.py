"""
Rate limiter for AI SOW generation
Allows 3 uses, then 5-minute cooldown before it can be used again
Admin users bypass rate limiting
"""
from datetime import datetime, timedelta
from typing import Optional
import threading

# List of admin emails that bypass rate limiting
ADMIN_EMAILS = [
    "dks1018@gmail.com",
    "info@secondlifesoftware.com"
]

class RateLimiter:
    """
    Simple in-memory rate limiter with admin bypass
    Tracks: number of requests and cooldown expiration time
    Admin users bypass all rate limits
    """
    def __init__(self, max_requests: int = 3, cooldown_seconds: int = 300):
        """
        Args:
            max_requests: Maximum number of requests allowed (default: 3)
            cooldown_seconds: Cooldown period in seconds after max_requests (default: 300 = 5 minutes)
        """
        self.max_requests = max_requests
        self.cooldown_seconds = cooldown_seconds
        self.request_count = 0
        self.first_request_time: Optional[datetime] = None
        self.cooldown_until: Optional[datetime] = None
        self.lock = threading.Lock()
    
    def check_rate_limit(self, user_email: Optional[str] = None, is_admin: bool = False) -> tuple[bool, Optional[str]]:
        """
        Check if request is allowed
        
        Args:
            user_email: Email of the user making the request
            is_admin: Whether the user is an admin (bypasses rate limiting)
        
        Returns:
            (is_allowed, error_message)
            - is_allowed: True if request can proceed, False if rate limited
            - error_message: None if allowed, or error message if rate limited
        """
        # Admin users bypass rate limiting
        if is_admin or (user_email and user_email.lower() in [email.lower() for email in ADMIN_EMAILS]):
            return True, None
        
        with self.lock:
            now = datetime.now()
            
            # Check if we're in cooldown period
            if self.cooldown_until and now < self.cooldown_until:
                remaining_seconds = int((self.cooldown_until - now).total_seconds())
                minutes = remaining_seconds // 60
                seconds = remaining_seconds % 60
                if minutes > 0:
                    error_msg = f"Rate limit exceeded. Please wait {minutes} minute{'s' if minutes > 1 else ''} and {seconds} second{'s' if seconds != 1 else ''} before generating another SOW."
                else:
                    error_msg = f"Rate limit exceeded. Please wait {seconds} second{'s' if seconds != 1 else ''} before generating another SOW."
                return False, error_msg
            
            # Reset if cooldown expired
            if self.cooldown_until and now >= self.cooldown_until:
                self.request_count = 0
                self.first_request_time = None
                self.cooldown_until = None
            
            # Check if we've hit the limit
            if self.request_count >= self.max_requests:
                # Start cooldown period
                self.cooldown_until = now + timedelta(seconds=self.cooldown_seconds)
                remaining_seconds = self.cooldown_seconds
                minutes = remaining_seconds // 60
                seconds = remaining_seconds % 60
                error_msg = f"Rate limit exceeded ({self.max_requests} uses). Please wait {minutes} minute{'s' if minutes > 1 else ''} and {seconds} second{'s' if seconds != 1 else ''} before generating another SOW."
                return False, error_msg
            
            # Increment request count
            if self.request_count == 0:
                self.first_request_time = now
            self.request_count += 1
            
            return True, None
    
    def get_status(self) -> dict:
        """
        Get current rate limit status
        
        Returns:
            dict with:
            - requests_used: Number of requests used
            - requests_remaining: Number of requests remaining
            - cooldown_until: When cooldown expires (None if not in cooldown)
            - can_use: Whether a request can be made now
        """
        with self.lock:
            now = datetime.now()
            
            # Check if in cooldown
            if self.cooldown_until and now < self.cooldown_until:
                remaining_seconds = int((self.cooldown_until - now).total_seconds())
                return {
                    "requests_used": self.max_requests,
                    "requests_remaining": 0,
                    "cooldown_until": self.cooldown_until.isoformat(),
                    "cooldown_remaining_seconds": remaining_seconds,
                    "can_use": False
                }
            
            # Reset if cooldown expired
            if self.cooldown_until and now >= self.cooldown_until:
                self.request_count = 0
                self.first_request_time = None
                self.cooldown_until = None
            
            remaining = self.max_requests - self.request_count
            return {
                "requests_used": self.request_count,
                "requests_remaining": remaining,
                "cooldown_until": None,
                "cooldown_remaining_seconds": 0,
                "can_use": True
            }


# Global rate limiter instance
# 3 requests, then 5-minute (300 seconds) cooldown
sow_ai_rate_limiter = RateLimiter(max_requests=3, cooldown_seconds=300)

