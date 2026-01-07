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
        "age": 22,
        "title": "Molecular Biotechnology Student & Researcher",
        "location": "Istanbul, Turkey (Koç University Hospital)",
        "email": "fatih.mertkoca2@gmail.com",
        "bio": """I am a researcher and amateur photographer combining molecular biotechnology with computational neuroscience. 
        I specifically focus on Expansion Microscopy (ExM) and AI-supported 3D modeling. 
        I am also working on bionic systems and personalized educational technologies (EdTech).""",

        "expertise": [
            "Expansion Microscopy (ExM) & Protocols (DMAA, LICONN, proExM)",
            "Computational Neuroscience (3D Image Stitching - SOFIMA)",
            "Deep Learning (U-Net, FFN, Local Shape Descriptors)",
            "Embedded Systems & Electronics (ESP32-S3, PlatformIO)",
            "Signal Processing (EMG Data, Feature Extraction)",
            "Full-stack Web Development (React, Vite, FastAPI, Azure)",
            "Computer Hardware & Motherboard Components"
        ],

        "current_projects": [
            "3D Modeling of the Pericyte-Vascular Interface in the Mouse Brain (TÜBİTAK 2209-A)",
            "EMG-Controlled Bionic Hand Development (Machine Learning & Servo Control)",
            "easyegitim (Personalized AI Professor Platform)",
            "mertoshi.online & Lundo (Agentic AI System with Memory)"
        ],

        "academic_background": {
            "institution": "Koç University",
            "major": "Molecular Biotechnology",
            "advisor": "Atay Vural (Vural Lab) and Betül Uluca",
            "collaborators": ["Narges Shomalizadeh (Research Professor)"]
        },

        "technical_stack": {
            "languages": ["Python", "C++", "JavaScript", "TypeScript", "HTML", "CSS", "React", "Vite", "FastAPI", "Azure"],
            "frameworks": ["PyTorch", "TensorFlow Lite", "PyQt6", "Docker"],
            "operating_systems": ["Linux (WSL)", "Windows"]
        },

        "languages": [
            "Turkish (Native)", 
            "English (Advanced)", 
            "German (Advanced)"
        ],

        "interests": [
            "Amateur Photography",
            "Latin Quotes & Philosophy",
            "Neuroscience History (Santiago Ramón y Cajal)",
            "PC Hardware Architecture"
        ],

        "links": {
            "portfolio": "https://mertoshi.online",
            "github": "https://github.com/ikoshos-gland",
            "linkedin": "https://linkedin.com/in/mertkoca"
        }
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
        description="Get Mert's basic profile information including bio, expertise, current projects, academic background, technical skills, and contact details. Use for introductions, questions about who Mert is, what he does, or how to contact him.",
    )
    def get_profile(
        self,
        section: Annotated[
            str,
            "Which section to retrieve: 'bio', 'expertise', 'projects', 'academic', 'tech', 'interests', 'contact', 'links', or 'all' for complete profile",
        ] = "all",
    ) -> Annotated[str, "Profile information formatted as markdown"]:
        """Get profile information."""
        profile = self._get_profile()

        section = section.lower().strip()

        if section == "bio":
            age = profile.get('age', '')
            age_str = f" ({age} years old)" if age else ""
            return f"**{profile['name']}**{age_str} - {profile['title']}\n\n{profile['bio']}"

        elif section == "expertise":
            expertise_list = "\n".join(f"- {e}" for e in profile["expertise"])
            return f"**Expertise & Skills:**\n{expertise_list}"

        elif section == "projects":
            projects_list = "\n".join(f"- {p}" for p in profile.get("current_projects", []))
            return f"**Current Projects:**\n{projects_list}"

        elif section == "academic":
            academic = profile.get("academic_background", {})
            collaborators = ", ".join(academic.get("collaborators", []))
            return f"""**Academic Background:**
- Institution: {academic.get('institution', 'N/A')}
- Major: {academic.get('major', 'N/A')}
- Advisor: {academic.get('advisor', 'N/A')}
- Collaborators: {collaborators}"""

        elif section == "tech":
            tech = profile.get("technical_stack", {})
            langs = ", ".join(tech.get("languages", []))
            frameworks = ", ".join(tech.get("frameworks", []))
            os_list = ", ".join(tech.get("operating_systems", []))
            return f"""**Technical Stack:**
- Languages & Tools: {langs}
- Frameworks: {frameworks}
- Operating Systems: {os_list}"""

        elif section == "interests":
            interests_list = "\n".join(f"- {i}" for i in profile.get("interests", []))
            return f"**Interests & Hobbies:**\n{interests_list}"

        elif section == "contact":
            return f"""**Contact Information:**
- Email: {profile['email']}
- Location: {profile['location']}
- Portfolio: {profile['links'].get('portfolio', 'N/A')}"""

        elif section == "links":
            links_list = "\n".join(f"- {k.title()}: {v}" for k, v in profile["links"].items())
            return f"**Links & Profiles:**\n{links_list}"

        else:  # "all" or default
            # Basic info
            age = profile.get('age', '')
            age_str = f" ({age})" if age else ""
            
            # Lists
            expertise_list = "\n".join(f"  - {e}" for e in profile["expertise"])
            projects_list = "\n".join(f"  - {p}" for p in profile.get("current_projects", []))
            interests_list = "\n".join(f"  - {i}" for i in profile.get("interests", []))
            links_list = "\n".join(f"  - {k.title()}: {v}" for k, v in profile["links"].items())
            languages = ", ".join(profile.get("languages", []))
            
            # Academic background
            academic = profile.get("academic_background", {})
            collaborators = ", ".join(academic.get("collaborators", []))
            
            # Technical stack
            tech = profile.get("technical_stack", {})
            tech_langs = ", ".join(tech.get("languages", []))
            frameworks = ", ".join(tech.get("frameworks", []))

            return f"""# {profile['name']}{age_str}
**{profile['title']}** | {profile['location']}

## About
{profile['bio']}

## Expertise
{expertise_list}

## Current Projects
{projects_list}

## Academic Background
- Institution: {academic.get('institution', 'N/A')}
- Major: {academic.get('major', 'N/A')}
- Advisor: {academic.get('advisor', 'N/A')}
- Collaborators: {collaborators}

## Technical Stack
- Languages & Tools: {tech_langs}
- Frameworks: {frameworks}

## Spoken Languages
{languages}

## Interests
{interests_list}

## Links
{links_list}

## Contact
Email: {profile['email']}
"""
