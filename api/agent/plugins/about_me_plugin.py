"""
About Me Plugin - Returns personal info and resume context.
This can be customized with your actual information.
"""

import os
import json
import logging
from typing import Annotated
from semantic_kernel.functions import kernel_function

logger = logging.getLogger(__name__)


class AboutMePlugin:
    """Plugin for personal information and resume data."""

    # Default profile data - customize this with your actual information
    # Can also be loaded from a JSON file or database
    DEFAULT_PROFILE = {
        "name": "Mert Koca",
        "title": "Digital Creator & AI Engineer",
        "location": "Turkey",
        "email": "contact@mertkoca.dev",
        "bio": """I'm a passionate digital creator and AI engineer focused on building innovative solutions
at the intersection of technology and creativity. I specialize in developing AI-powered applications,
interactive web experiences, and cloud-native solutions. My work spans from academic research in
computer vision and machine learning to practical implementations of RAG systems and intelligent agents.""",
        "expertise": [
            "AI/ML Engineering (RAG, Agents, Computer Vision)",
            "Full-Stack Development (React, TypeScript, Python)",
            "Cloud Architecture (Azure, AWS)",
            "3D Web Experiences (Spline, Three.js)",
            "Research & Academic Writing",
        ],
        "current_focus": [
            "Building agentic AI systems with Semantic Kernel",
            "Developing RAG-powered knowledge assistants",
            "Creating immersive web experiences with 3D elements",
        ],
        "education": "Computer Science / Engineering background with focus on AI/ML",
        "languages": ["Turkish (Native)", "English (Fluent)"],
        "links": {
            "portfolio": "https://mertkoca.dev",
            "github": "https://github.com/mertkoca",
            "linkedin": "https://linkedin.com/in/mertkoca",
        },
    }

    def __init__(self):
        self._profile = None

    def _get_profile(self) -> dict:
        """Load profile data. Can be extended to load from file/DB."""
        if self._profile is None:
            # Try to load from environment or file
            profile_json = os.environ.get("ABOUT_ME_PROFILE")
            if profile_json:
                try:
                    self._profile = json.loads(profile_json)
                except json.JSONDecodeError:
                    logger.warning("Invalid ABOUT_ME_PROFILE JSON, using defaults")
                    self._profile = self.DEFAULT_PROFILE
            else:
                self._profile = self.DEFAULT_PROFILE
        return self._profile

    @kernel_function(
        name="get_profile",
        description="Get Mert's basic profile information including bio, expertise, current projects, and contact details. Use for introductions, questions about who Mert is, what he does, or how to contact him.",
    )
    def get_profile(
        self,
        section: Annotated[
            str,
            "Which section to retrieve: 'bio', 'expertise', 'education', 'contact', 'current', 'links', or 'all' for complete profile",
        ] = "all",
    ) -> Annotated[str, "Profile information formatted as markdown"]:
        """Get profile information."""
        profile = self._get_profile()

        section = section.lower().strip()

        if section == "bio":
            return f"**{profile['name']}** - {profile['title']}\n\n{profile['bio']}"

        elif section == "expertise":
            expertise_list = "\n".join(f"- {e}" for e in profile["expertise"])
            return f"**Expertise & Skills:**\n{expertise_list}"

        elif section == "current":
            current_list = "\n".join(f"- {c}" for c in profile["current_focus"])
            return f"**Current Focus:**\n{current_list}"

        elif section == "contact":
            return f"""**Contact Information:**
- Email: {profile['email']}
- Location: {profile['location']}
- Portfolio: {profile['links'].get('portfolio', 'N/A')}"""

        elif section == "education":
            languages = ", ".join(profile.get("languages", []))
            return f"""**Education & Background:**
{profile['education']}

**Languages:** {languages}"""

        elif section == "links":
            links_list = "\n".join(f"- {k.title()}: {v}" for k, v in profile["links"].items())
            return f"**Links & Profiles:**\n{links_list}"

        else:  # "all" or default
            expertise_list = "\n".join(f"  - {e}" for e in profile["expertise"])
            current_list = "\n".join(f"  - {c}" for c in profile["current_focus"])
            links_list = "\n".join(f"  - {k.title()}: {v}" for k, v in profile["links"].items())
            languages = ", ".join(profile.get("languages", []))

            return f"""# {profile['name']}
**{profile['title']}** | {profile['location']}

## About
{profile['bio']}

## Expertise
{expertise_list}

## Currently Working On
{current_list}

## Education
{profile['education']}

## Languages
{languages}

## Links
{links_list}

## Contact
Email: {profile['email']}
"""
