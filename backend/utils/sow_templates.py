"""
Templates for all 19 required SOW sections
These provide default content that can be customized
"""

SOW_SECTIONS = [
    {
        "title": "1. Executive Summary / Purpose",
        "order": 1,
        "template": """Why this exists

High-level description of the project

Business goals and success criteria

Who the SOW is for and what problem it solves

Example:
"This SOW defines the scope, deliverables, and responsibilities for building an internal AI-powered search tool for [CLIENT_NAME] employees." """
    },
    {
        "title": "2. Definitions & Terminology",
        "order": 2,
        "template": """Prevents arguments later.

Technical terms

Acronyms

Internal product names

What words like "done," "live," "MVP," "production" mean

Key Definitions:
- "Complete" means all acceptance criteria have been met and approved by the client
- "Live" refers to the production environment accessible to end users
- "MVP" (Minimum Viable Product) means the core functionality required for initial release
- "Production" refers to the live, customer-facing environment"""
    },
    {
        "title": "3. Scope of Work (Core Section)",
        "order": 3,
        "template": """3.1 In-Scope

Exactly what you are doing

Features

Systems

Integrations

Platforms

Environments

Be explicit and granular:

"User authentication via Firebase"

"Search API built with FastAPI"

"React frontend deployed on Netlify"

3.2 Out-of-Scope

Just as important

What you are not doing

Assumptions that are not included

Future features excluded unless added via change order

This is where most lawsuits are prevented."""
    },
    {
        "title": "4. Deliverables",
        "order": 4,
        "template": """Concrete, verifiable outputs:

Source code

Repositories

APIs

Documentation

Configurations

Test reports

Deployed environments

Each deliverable should include:

Description

Format

Acceptance criteria

Owner

Deliverables:
1. Source code repository with full version control history
2. API documentation (OpenAPI/Swagger specification)
3. Deployment documentation and runbooks
4. Test reports and coverage metrics
5. Production-ready application deployed to [HOSTING_PROVIDER]"""
    },
    {
        "title": "5. Milestones & Timeline",
        "order": 5,
        "template": """Clear sequencing with dependencies:

Milestone name

Description

Estimated duration

Start/end dates

Approval checkpoints

Often paired with payment milestones.

[MILESTONES_PLACEHOLDER]"""
    },
    {
        "title": "6. Technical Architecture",
        "order": 6,
        "template": """This separates amateurs from professionals.

High-level architecture overview

Tech stack (frontend, backend, infra)

Hosting providers

Authentication approach

Data storage

Third-party services

Optional but powerful:

Diagrams

Environment separation (dev/staging/prod)

Technical Stack:
- Frontend: [FRONTEND_TECH]
- Backend: [BACKEND_TECH]
- Database: [DATABASE_TECH]
- Hosting: [HOSTING_PROVIDER]
- Authentication: [AUTH_METHOD]"""
    },
    {
        "title": "7. Roles & Responsibilities",
        "order": 7,
        "template": """Who owns what:

Client Responsibilities

Providing access

Approving designs

Supplying requirements

Timely feedback

Vendor Responsibilities

Development

Testing

Documentation

Deployment support

This section prevents "we were blocked" disputes.

Client Responsibilities:
- Provide timely access to required systems and accounts
- Review and approve designs within [X] business days
- Supply complete requirements and specifications
- Provide timely feedback on deliverables

Vendor Responsibilities:
- Develop and test all features according to specifications
- Provide comprehensive documentation
- Deploy to staging and production environments
- Provide deployment support and troubleshooting"""
    },
    {
        "title": "8. Acceptance Criteria & Review Process",
        "order": 8,
        "template": """Defines how work is approved:

What constitutes "complete"

Review window (e.g., 5 business days)

What happens if feedback isn't given

Revision limits

Acceptance Criteria:
- All features meet the specified requirements
- Code passes all automated tests
- Documentation is complete and accurate
- Application is deployed and accessible

Review Process:
- Client has 5 business days to review each deliverable
- Feedback must be provided in writing
- If no feedback is received within the review window, the deliverable is considered accepted
- Up to 2 rounds of revisions are included per deliverable"""
    },
    {
        "title": "9. Change Management",
        "order": 9,
        "template": """Critical for scope creep control.

Includes:

How changes are requested

Impact analysis (time + cost)

Approval process

Written change orders required

Change Management Process:
1. All change requests must be submitted in writing
2. Vendor will provide impact analysis (time and cost) within 2 business days
3. Changes require written approval from both parties
4. Approved changes will be documented as change orders
5. No work on changes will begin until change order is approved"""
    },
    {
        "title": "10. Pricing & Payment Terms",
        "order": 10,
        "template": """Very explicit:

Fixed price or hourly

Rates

Payment schedule

Invoicing cadence

Late payment penalties

Deposits / retainers

For hourly:

Time tracking method

Minimum billing increments

Reporting cadence

Pricing Structure:
- Contract Type: [FIXED_PRICE or HOURLY]
- Total Amount: $[AMOUNT]
- Payment Schedule: [PAYMENT_SCHEDULE]
- Invoicing: [INVOICING_CADENCE]
- Late Payment: Interest charges at 1.5% per month (18% per annum)"""
    },
    {
        "title": "11. IP Ownership & Licensing",
        "order": 11,
        "template": """This is where things get dangerous if vague.

Who owns custom code

What happens to pre-existing IP

Rights to reuse generic components

Open-source usage disclosures

Good SOWs separate:

Client-owned project IP

Vendor-owned background IP

IP Ownership:
- All custom code developed specifically for this project is owned by [CLIENT_NAME]
- Vendor retains ownership of pre-existing code, frameworks, and tools
- Vendor may reuse generic components and patterns in future projects
- Open-source libraries will be used as appropriate and disclosed"""
    },
    {
        "title": "12. Confidentiality & Data Handling",
        "order": 12,
        "template": """Especially important for:

Healthcare

Finance

AI

PII

Covers:

Data access rules

Storage requirements

Breach notification

NDA references

Confidentiality:
- All client data and proprietary information will be kept confidential
- Data will be stored in secure, encrypted environments
- Access will be limited to authorized personnel only
- Any data breaches will be reported immediately
- This SOW is subject to the terms of the Master Services Agreement (MSA)"""
    },
    {
        "title": "13. Security & Compliance",
        "order": 13,
        "template": """Often skipped—big mistake.

May include:

Authentication standards

Encryption requirements

Access controls

Audit logging

Compliance needs (HIPAA, SOC2, etc.)

Security Requirements:
- All data in transit encrypted using TLS 1.2 or higher
- All data at rest encrypted using industry-standard encryption
- Multi-factor authentication required for admin access
- Comprehensive audit logging for all system access
- Compliance with [RELEVANT_COMPLIANCE_STANDARDS]"""
    },
    {
        "title": "14. Testing & QA",
        "order": 14,
        "template": """Defines quality expectations:

Unit testing

Integration testing

UAT

Bug severity levels

Fix timelines

Testing Requirements:
- Unit test coverage minimum of 80%
- Integration testing for all API endpoints
- User Acceptance Testing (UAT) with client participation
- Bug Severity Levels:
  - Critical: Fix within 24 hours
  - High: Fix within 3 business days
  - Medium: Fix within 1 week
  - Low: Fix within 2 weeks"""
    },
    {
        "title": "15. Deployment & Handoff",
        "order": 15,
        "template": """What happens at the end:

Deployment steps

Credentials handoff

Documentation delivery

Knowledge transfer

Training (if any)

Deployment & Handoff:
- Application will be deployed to production environment
- All credentials and access information will be securely transferred
- Complete documentation package will be delivered
- Knowledge transfer session will be conducted
- [TRAINING_DETAILS if applicable]"""
    },
    {
        "title": "16. Support, Maintenance & Warranty",
        "order": 16,
        "template": """Clarifies post-launch reality:

Warranty period

Bug fixes vs enhancements

Support SLAs

Optional maintenance packages

Support & Warranty:
- 30-day warranty period for bug fixes related to delivered functionality
- Warranty covers defects, not enhancements or new features
- Support SLA: Response within 24 hours for critical issues
- Optional maintenance packages available for ongoing support"""
    },
    {
        "title": "17. Assumptions & Constraints",
        "order": 17,
        "template": """Prevents silent expectations:

Dependencies on third parties

Budget assumptions

Tool availability

Team availability

Assumptions:
- Client will provide timely access to required systems
- Third-party services will be available and functional
- Client team will be available for reviews and approvals
- Budget is sufficient for scope outlined in this SOW

Constraints:
- Project timeline assumes no major scope changes
- Dependent on third-party API availability and performance
- Limited by client team availability for feedback and approvals"""
    },
    {
        "title": "18. Termination & Exit",
        "order": 18,
        "template": """Plans for failure before failure:

Termination rights

Payment for work completed

Code handoff on termination

Data deletion obligations

Termination:
- Either party may terminate with 30 days written notice
- Client will pay for all work completed up to termination date
- Vendor will provide all code, documentation, and deliverables completed to date
- Vendor will delete all client data from vendor systems within 30 days of termination"""
    },
    {
        "title": "19. Legal Boilerplate (Often Referenced)",
        "order": 19,
        "template": """Usually summarized and linked to MSA:

Governing law

Liability limits

Indemnification

Force majeure

Legal Terms:
- This SOW is governed by the laws of [STATE/JURISDICTION]
- Liability is limited to the total contract value
- Both parties agree to indemnify each other as specified in the MSA
- Force majeure events will be handled as specified in the MSA
- This SOW is subject to the terms and conditions of the Master Services Agreement (MSA) dated [MSA_DATE]"""
    }
]


def get_section_template(section_title: str) -> str:
    """Get template content for a specific section"""
    for section in SOW_SECTIONS:
        if section["title"] == section_title:
            return section["template"]
    return ""


def generate_milestones_template(num_milestones: int, start_date: str = None, end_date: str = None) -> str:
    """Generate milestones section based on number of milestones"""
    if num_milestones <= 0:
        return "No milestones defined."
    
    milestones = []
    for i in range(1, num_milestones + 1):
        milestones.append(f"""Milestone {i}:
- Name: [MILESTONE_{i}_NAME]
- Description: [MILESTONE_{i}_DESCRIPTION]
- Estimated Duration: [DURATION]
- Start Date: [START_DATE]
- End Date: [END_DATE]
- Approval Checkpoint: [APPROVAL_REQUIRED]""")
    
    return "\n\n".join(milestones)

