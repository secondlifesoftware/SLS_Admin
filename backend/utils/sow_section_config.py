"""
Configuration for which SOW sections are customizable vs. standardized
"""

# Sections that should be CUSTOMIZED per project/contract
CUSTOMIZABLE_SECTIONS = {
    "1. Executive Summary / Purpose": True,  # Project-specific
    "3. Scope of Work (Core Section)": True,  # In-scope/Out-of-scope varies
    "4. Deliverables": True,  # Project-specific deliverables
    "5. Milestones & Timeline": True,  # Project-specific timeline
    "6. Technical Architecture": True,  # Tech stack varies by project
    "7. Roles & Responsibilities": True,  # May vary slightly
    "8. Acceptance Criteria & Review Process": True,  # May vary by project
    "10. Pricing & Payment Terms": True,  # Contract-specific
    "17. Assumptions & Constraints": True,  # Project-specific
}

# Sections that are STANDARDIZED (legal boilerplate, standard processes)
STANDARDIZED_SECTIONS = {
    "2. Definitions & Terminology": False,  # Standard definitions
    "9. Change Management": False,  # Standard process
    "11. IP Ownership & Licensing": False,  # Standard terms (unless contract specifies otherwise)
    "12. Confidentiality & Data Handling": False,  # Standard terms
    "13. Security & Compliance": False,  # Standard requirements
    "14. Testing & QA": False,  # Standard process
    "15. Deployment & Handoff": False,  # Standard process
    "16. Support, Maintenance & Warranty": False,  # Standard terms
    "18. Termination & Exit": False,  # Standard terms
    "19. Legal Boilerplate (Often Referenced)": False,  # Standard legal text
}

def is_customizable(section_title: str) -> bool:
    """Check if a section should be customizable"""
    if section_title in CUSTOMIZABLE_SECTIONS:
        return CUSTOMIZABLE_SECTIONS[section_title]
    if section_title in STANDARDIZED_SECTIONS:
        return STANDARDIZED_SECTIONS[section_title]
    # Default to customizable if not specified
    return True

def get_customizable_sections() -> list:
    """Get list of section titles that should be customizable"""
    return [title for title, customizable in CUSTOMIZABLE_SECTIONS.items() if customizable]

def get_standardized_sections() -> list:
    """Get list of section titles that are standardized"""
    return [title for title, standardized in STANDARDIZED_SECTIONS.items() if not standardized]

