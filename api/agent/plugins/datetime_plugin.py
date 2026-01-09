"""
DateTime Plugin - Current time and date calculations.
"""

from datetime import datetime, timedelta
from typing import Annotated
import logging

logger = logging.getLogger(__name__)

# Try to import pytz, fall back to basic timezone handling
try:
    import pytz
    HAS_PYTZ = True
except ImportError:
    HAS_PYTZ = False
    logger.warning("pytz not installed, using basic timezone handling")

from semantic_kernel.functions import kernel_function


class DateTimePlugin:
    """Plugin for date and time operations."""

    DEFAULT_TIMEZONE = "Europe/Istanbul"

    def _get_timezone(self, timezone_name: str = None):
        """Get timezone object."""
        tz_name = timezone_name or self.DEFAULT_TIMEZONE
        if HAS_PYTZ:
            try:
                return pytz.timezone(tz_name)
            except pytz.exceptions.UnknownTimeZoneError:
                logger.warning(f"Unknown timezone: {tz_name}, using UTC")
                return pytz.UTC
        else:
            # Fallback: return None, use naive datetime
            return None

    @kernel_function(
        name="get_current_time",
        description="Get the current date and time. Optionally specify a timezone. Use when the user asks about the current date, time, day of week, or needs time-based context.",
    )
    def get_current_time(
        self,
        timezone: Annotated[
            str,
            "Timezone name (e.g., 'Europe/Istanbul', 'America/New_York', 'UTC'). Default is Europe/Istanbul.",
        ] = None,
    ) -> Annotated[str, "Current date and time information"]:
        """Get current date and time."""
        try:
            tz = self._get_timezone(timezone)

            if tz and HAS_PYTZ:
                now = datetime.now(tz)
                tz_display = tz.zone
            else:
                now = datetime.now()
                tz_display = "Local Time"

            return f"""**Current Date & Time:**
- Date: {now.strftime('%A, %B %d, %Y')}
- Time: {now.strftime('%I:%M %p')} ({now.strftime('%H:%M')})
- Timezone: {tz_display}
- Week: {now.strftime('%W')} of {now.year}
- Day of Year: {now.strftime('%j')}"""

        except Exception as e:
            logger.error(f"Error getting time: {e}")
            return f"Error getting current time: {str(e)}"

    @kernel_function(
        name="calculate_date",
        description="Calculate a date relative to today. Use for questions like 'what date is 30 days from now', 'what was the date 2 weeks ago', deadline calculations, etc.",
    )
    def calculate_date(
        self,
        days: Annotated[int, "Number of days to add (positive for future) or subtract (negative for past)"],
        timezone: Annotated[str, "Timezone name (optional)"] = None,
    ) -> Annotated[str, "Calculated date information"]:
        """Calculate relative dates."""
        try:
            tz = self._get_timezone(timezone)

            if tz and HAS_PYTZ:
                now = datetime.now(tz)
            else:
                now = datetime.now()

            target = now + timedelta(days=days)

            if days > 0:
                direction = "from now"
                verb = "will be"
            elif days < 0:
                direction = "ago"
                verb = "was"
            else:
                direction = "(today)"
                verb = "is"

            abs_days = abs(days)
            weeks = abs_days // 7
            remaining_days = abs_days % 7

            # Format the duration nicely
            if weeks > 0 and remaining_days > 0:
                duration = f"{weeks} week{'s' if weeks > 1 else ''} and {remaining_days} day{'s' if remaining_days > 1 else ''}"
            elif weeks > 0:
                duration = f"{weeks} week{'s' if weeks > 1 else ''}"
            else:
                duration = f"{abs_days} day{'s' if abs_days > 1 else ''}"

            return f"""**Date Calculation:**
- Today: {now.strftime('%A, %B %d, %Y')}
- {duration} {direction} {verb}: **{target.strftime('%A, %B %d, %Y')}**
- Days difference: {days:+d} days"""

        except Exception as e:
            logger.error(f"Error calculating date: {e}")
            return f"Error calculating date: {str(e)}"

    @kernel_function(
        name="days_until",
        description="Calculate the number of days until a specific date. Use for countdown questions like 'how many days until Christmas', 'days until my deadline', etc.",
    )
    def days_until(
        self,
        target_date: Annotated[str, "Target date in YYYY-MM-DD format (e.g., '2025-12-25')"],
        timezone: Annotated[str, "Timezone name (optional)"] = None,
    ) -> Annotated[str, "Days until the target date"]:
        """Calculate days until a specific date."""
        try:
            tz = self._get_timezone(timezone)

            if tz and HAS_PYTZ:
                now = datetime.now(tz)
            else:
                now = datetime.now()

            target = datetime.strptime(target_date, "%Y-%m-%d")
            if tz and HAS_PYTZ:
                target = tz.localize(target)

            delta = target.date() - now.date()
            days = delta.days

            if days > 0:
                status = f"**{days} days** remaining"
            elif days < 0:
                status = f"**{abs(days)} days** ago (already passed)"
            else:
                status = "**Today!**"

            return f"""**Days Until {target.strftime('%B %d, %Y')}:**
- Today: {now.strftime('%A, %B %d, %Y')}
- Target: {target.strftime('%A, %B %d, %Y')}
- Status: {status}"""

        except ValueError:
            return f"Invalid date format. Please use YYYY-MM-DD format (e.g., '2025-12-25')"
        except Exception as e:
            logger.error(f"Error calculating days until: {e}")
            return f"Error calculating days: {str(e)}"
