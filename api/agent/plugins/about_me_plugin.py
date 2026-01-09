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
        "bio": """I am an undergraduate researcher and amateur photographer combining molecular biotechnology with computational neuroscience. 
        I specifically focus on Expansion Microscopy (ExM) and AI-supported 3D modeling in my internship at Koç University Hospital. 
        I am also working on bionic systems and personalized educational technologies.""",

        "expertise": [
            "Expansion Microscopy (ExM) & Protocols (DMAA, LICONN, proExM,Magnify)",
            "Computational Neuroscience (3D Image Stitching - SOFIMA, CLAHE, )",
            "Deep Learning Based Brain Segmentation and Modeling (U-Net, FFN, Local Shape Descriptors)",
            "Embedded Systems & Electronics (ESP32-S3, PlatformIO)",
            "Signal Processing (EMG Data, Feature Extraction)",
            "Full-stack Web Development (I am kidding I vibe coded all this stuff LMAO)",
            "Computer Hardware & Motherboard Components"
        ],

        "current_projects": [
            "3D Reconstruction of the Pericyte-Vascular Interface in the Mouse Brain (TÜBİTAK 2209-A)",
            "EMG-Controlled Bionic Hand Development (Machine Learning & Servo Control)",
            "easyegitim (Personalized AI Professor Platform)",
            "mertoshi.online & Lundo (Agentic AI System with Memory)"
        ],

        "academic_background": {
            "institution": "Turkish-German University",
            "major": "Molecular Biotechnology",
            "advisor": "Atay Vural (Vural Lab) and Betül Uluca",
            "collaborators": ["Narges Shomalizadeh (Research Professor), Özkur Kuran"]
        },

        "technical_stack": {
            "languages": ["Python", "C++", "Azure"],
            "frameworks": ["PyTorch", "TensorFlow Lite", "Docker", "Azure CycleCloud"],
            "operating_systems": ["Ubuntu", "Windows"]
        },

        "languages": [
            "Turkish (Native)", 
            "English (Advanced)", 
            "German (Advanced)"
        ],

        "interests": [
            "Amateur Photography",
            "Neuroscience",
            "Bionic Systems",
            "Personalized Education",
            "Boxing",
            "Learning New Stuff"
        ],

        "links": {
            "portfolio": "https://mertoshi.online",
            "github": "https://github.com/ikoshos-gland",
            "linkedin": "https://linkedin.com/in/mertkoca"
        },

        "internship": {
            "company": "Koç University Hospital / Vural Lab",
            "role": "Research Intern",
            "duration": "2024 - Present",
            "focus": [
                "3D Reconstruction of Pericyte-Vascular Interface in Mouse Brain",
                "Expansion Microscopy (ExM) protocol optimization (DMAA, LICONN, proExM)",
                "SOFIMA-based image stitching pipeline development",
                "Deep learning models for vascular segmentation (U-Net, FFN)"
            ],
            "goals": [
                "Complete TÜBİTAK 2209-A project deliverables",
                "Publish research findings in neuroscience journal",
                "Master ExM protocols for connectomics research",
                "Build computational pipeline for 3D brain vasculature modeling"
            ]
        },

        "current_state": {
            "status": "Stuck - Supply Shortage",
            "last_updated": "2026-01-01",
            "description": "I am fucked. Currently the internship is stuck because of the lack of supplies.",
            "bottlenecks": [
                "NHS-Ester Dye (AF 488 NHS Ester)",
                "Anhydrous DMSO"
            ]
        },

        "childhood_crush": {
            "name": "Elif Ece",
            "location": "Manisa, Turkey",
            "description": "A blue-eyed, yellow-haired girl I loved for 8 years during my childhood.",
            "traits": ["Extremely smart", "Beautiful blue eyes", "Yellow/blonde hair"],
            "duration": "8 years",
            "status": "Lost contact after moving to Kayseri. No contact anymore."
        },

        "chatbot": {
            "name": "Lundo",
            "type": "AI Assistant",
            "creator": "Mert Koca",
            "purpose": "To help visitors learn about Mert, his work, research, and personal life.",
            "capabilities": [
                "Search Mert's personal knowledge base (RAG)",
                "Search the web for real-time information",
                "Provide Mert's profile and contact information",
                "Answer questions about Mert's research, projects, and interests"
            ],
            "personality": "Friendly, helpful, and slightly witty. I speak ABOUT Mert in third person - I am not Mert himself.",
            "note": "I am Lundo, an AI assistant created by Mert. When you ask 'who are you?', you're asking about me (Lundo), not about Mert. If you want to know about Mert, ask 'who is Mert?' or 'tell me about Mert'."
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
        description="Get information about Mert OR the chatbot (Lundo). Use 'chatbot' section when user asks 'who are you?' to describe Lundo. Use other sections for questions about Mert's bio, expertise, projects, academic background, internship, current state, childhood crush, technical skills, and contact details.",
    )
    def get_profile(
        self,
        section: Annotated[
            str,
            "Which section to retrieve: 'chatbot' (for 'who are you?' questions about Lundo), 'bio', 'expertise', 'projects', 'academic', 'internship', 'current_state', 'childhood_crush', 'tech', 'interests', 'contact', 'links', or 'all' for complete profile",
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

        elif section == "internship":
            internship = profile.get("internship", {})
            focus_list = "\n".join(f"- {f}" for f in internship.get("focus", []))
            goals_list = "\n".join(f"- {g}" for g in internship.get("goals", []))
            return f"""**Internship Details:**
- Company: {internship.get('company', 'N/A')}
- Role: {internship.get('role', 'N/A')}
- Duration: {internship.get('duration', 'N/A')}

**Current Focus:**
{focus_list}

**Goals:**
{goals_list}"""

        elif section == "current_state":
            state = profile.get("current_state", {})
            bottlenecks = "\n".join(f"- {b}" for b in state.get("bottlenecks", []))
            return f"""**Current State:**
- Status: {state.get('status', 'N/A')}
- Last Updated: {state.get('last_updated', 'N/A')}

{state.get('description', '')}

**Bottlenecks:**
{bottlenecks}"""

        elif section == "childhood_crush":
            crush = profile.get("childhood_crush", {})
            traits = ", ".join(crush.get("traits", []))
            return f"""**Childhood Crush:**
- Name: {crush.get('name', 'N/A')}
- Location: {crush.get('location', 'N/A')}
- Duration: {crush.get('duration', 'N/A')}
- Traits: {traits}

{crush.get('description', '')}

**Status:** {crush.get('status', 'N/A')}"""

        elif section == "chatbot":
            bot = profile.get("chatbot", {})
            capabilities = "\n".join(f"- {c}" for c in bot.get("capabilities", []))
            return f"""**About Me (Lundo):**

Hi! I'm **{bot.get('name', 'Lundo')}**, a {bot.get('type', 'AI Assistant')} created by {bot.get('creator', 'Mert Koca')}.

**Purpose:** {bot.get('purpose', 'N/A')}

**My Capabilities:**
{capabilities}

**Personality:** {bot.get('personality', 'N/A')}

> {bot.get('note', '')}"""

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

            # Internship
            internship = profile.get("internship", {})
            internship_focus = "\n".join(f"  - {f}" for f in internship.get("focus", []))
            internship_goals = "\n".join(f"  - {g}" for g in internship.get("goals", []))

            # Current state
            state = profile.get("current_state", {})
            bottlenecks = "\n".join(f"  - {b}" for b in state.get("bottlenecks", []))

            # Childhood crush
            crush = profile.get("childhood_crush", {})
            crush_traits = ", ".join(crush.get("traits", []))

            return f"""# {profile['name']}{age_str}
**{profile['title']}** | {profile['location']}

## About
{profile['bio']}

## Expertise
{expertise_list}

## Current Projects
{projects_list}

## Internship at {internship.get('company', 'N/A')}
**Role:** {internship.get('role', 'N/A')} | **Duration:** {internship.get('duration', 'N/A')}

**Focus Areas:**
{internship_focus}

**Goals:**
{internship_goals}

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

## Current State
- Status: {state.get('status', 'N/A')}
- Last Updated: {state.get('last_updated', 'N/A')}
- {state.get('description', '')}
- Bottlenecks:
{bottlenecks}

## Childhood Crush 💔
- Name: {crush.get('name', 'N/A')} ({crush.get('location', 'N/A')})
- Duration: {crush.get('duration', 'N/A')}
- Traits: {crush_traits}
- {crush.get('description', '')}
- Status: {crush.get('status', 'N/A')}
"""
