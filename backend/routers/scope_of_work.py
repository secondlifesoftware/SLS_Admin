from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import os
from database import get_db
from models import ScopeOfWork, ScopeSection, Client
from schemas import ScopeOfWork as ScopeOfWorkSchema, ScopeOfWorkCreate, ScopeOfWorkUpdate
from utils.sow_templates import SOW_SECTIONS
from utils.sow_pdf_generator import generate_sow_pdf
from utils.rate_limiter import sow_ai_rate_limiter

router = APIRouter(prefix="/api/scope-of-work", tags=["scope-of-work"])


@router.get("/", response_model=List[ScopeOfWorkSchema])
def get_scopes(skip: int = 0, limit: int = 100, client_id: int = None, status: str = None, db: Session = Depends(get_db)):
    """Get all scope of work documents with optional filtering"""
    query = db.query(ScopeOfWork)
    
    if client_id:
        query = query.filter(ScopeOfWork.client_id == client_id)
    if status:
        query = query.filter(ScopeOfWork.status == status)
    
    scopes = query.offset(skip).limit(limit).all()
    return scopes


@router.get("/{scope_id}", response_model=ScopeOfWorkSchema)
def get_scope(scope_id: int, db: Session = Depends(get_db)):
    """Get a specific scope of work by ID"""
    scope = db.query(ScopeOfWork).filter(ScopeOfWork.id == scope_id).first()
    if not scope:
        raise HTTPException(status_code=404, detail="Scope of work not found")
    return scope


@router.post("/", response_model=ScopeOfWorkSchema)
def create_scope(scope: ScopeOfWorkCreate, db: Session = Depends(get_db)):
    """Create a new scope of work"""
    # Verify client exists
    client = db.query(Client).filter(Client.id == scope.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Create scope
    scope_data = scope.dict(exclude={"sections"})
    db_scope = ScopeOfWork(**scope_data)
    db.add(db_scope)
    db.flush()  # Get the scope ID
    
    # Create sections
    sections_data = scope.sections or []
    for section_data in sections_data:
        db_section = ScopeSection(
            scope_id=db_scope.id,
            title=section_data.title,
            content=section_data.content,
            order=section_data.order
        )
        db.add(db_section)
    
    db.commit()
    db.refresh(db_scope)
    return db_scope


@router.put("/{scope_id}", response_model=ScopeOfWorkSchema)
def update_scope(scope_id: int, scope_update: ScopeOfWorkUpdate, db: Session = Depends(get_db)):
    """Update a scope of work"""
    db_scope = db.query(ScopeOfWork).filter(ScopeOfWork.id == scope_id).first()
    if not db_scope:
        raise HTTPException(status_code=404, detail="Scope of work not found")
    
    update_data = scope_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_scope, field, value)
    
    db.commit()
    db.refresh(db_scope)
    return db_scope


@router.delete("/{scope_id}")
def delete_scope(scope_id: int, db: Session = Depends(get_db)):
    """Delete a scope of work"""
    db_scope = db.query(ScopeOfWork).filter(ScopeOfWork.id == scope_id).first()
    if not db_scope:
        raise HTTPException(status_code=404, detail="Scope of work not found")
    
    db.delete(db_scope)
    db.commit()
    return {"message": "Scope of work deleted successfully"}


@router.get("/templates/sections")
def get_sow_section_templates():
    """Get all SOW section templates"""
    return SOW_SECTIONS


@router.get("/ai/rate-limit-status")
def get_rate_limit_status():
    """Get current rate limit status for AI SOW generation"""
    status = sow_ai_rate_limiter.get_status()
    return status


@router.post("/ai/regenerate-section")
def regenerate_section_with_ai(
    request: dict,
    db: Session = Depends(get_db)
):
    """Regenerate a specific section of an existing SOW using AI"""
    # Check rate limit
    is_allowed, error_message = sow_ai_rate_limiter.check_rate_limit()
    if not is_allowed:
        raise HTTPException(status_code=429, detail=error_message)
    
    # Get existing SOW
    scope = db.query(ScopeOfWork).filter(ScopeOfWork.id == request.scope_id).first()
    if not scope:
        raise HTTPException(status_code=404, detail="Scope of work not found")
    
    # Get client and context
    client = db.query(Client).filter(Client.id == scope.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    from models import ClientTechStack, Contract, ClientNote
    tech_stack = db.query(ClientTechStack).filter(ClientTechStack.client_id == client.id).all()
    contracts = db.query(Contract).filter(Contract.client_id == client.id).all()
    recent_notes = db.query(ClientNote).filter(ClientNote.client_id == client.id).order_by(ClientNote.created_at.desc()).limit(5).all()
    
    client_context = {
        "name": f"{client.first_name} {client.last_name}",
        "company": client.company or "",
        "email": client.email or "",
        "address": client.address or "",
        "description": client.description or "",
        "tech_stack": [f"{t.technology} ({t.category})" for t in tech_stack] if tech_stack else [],
        "contracts": [{"title": c.title, "type": c.contract_type, "status": c.status} for c in contracts],
        "recent_notes": [n.content[:200] for n in recent_notes[:3]],
        "hourly_rate": client.hourly_rate if client.hourly_rate else None,
        "notes_from_last_meeting": client.notes_from_last_meeting if client.notes_from_last_meeting else None,
        "timeline": client.timeline if client.timeline else None,
        "contract_status": client.contract_status if client.contract_status else None,
        "contract_type": client.contract_type if client.contract_type else None,
        "contract_due_date": client.contract_due_date.strftime('%Y-%m-%d') if client.contract_due_date else None,
    }
    
    # Get existing sections for context
    existing_sections = db.query(ScopeSection).filter(ScopeSection.scope_id == request.scope_id).order_by(ScopeSection.order).all()
    
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise HTTPException(status_code=400, detail="OpenAI API is not configured")
    
    try:
        from openai import OpenAI
        client_ai = OpenAI(api_key=openai_api_key)
        
        section_prompt = f"""Regenerate ONLY the following section for an existing Statement of Work (SOW):

EXISTING SOW CONTEXT:
- Title: {scope.title}
- Start Date: {scope.start_date.strftime('%Y-%m-%d') if scope.start_date else 'Not specified'}
- End Date: {scope.end_date.strftime('%Y-%m-%d') if scope.end_date else 'Not specified'}

CLIENT INFORMATION:
- Name: {client_context['name']}
- Company: {client_context['company']}
- Project Description: {client_context['description']}

TECHNICAL STACK:
{chr(10).join(f"- {tech}" for tech in client_context['tech_stack']) if client_context['tech_stack'] else "- Not specified"}

EXISTING SECTIONS (for context):
{chr(10).join(f"- {s.title}: {s.content[:200]}..." for s in existing_sections[:5])}

SECTION TO REGENERATE:
{request.section_title}

INSTRUCTIONS:
- Regenerate ONLY the section specified above
- Use the existing SOW context and client information provided
- Ensure the regenerated section aligns with the overall SOW structure
- Make it professional, comprehensive, and legally sound

Return ONLY the content for this section:
SECTION: {request.section_title}
CONTENT: [regenerated content]
"""
        
        response = client_ai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at writing professional Statements of Work (SOW) sections. Regenerate the specified section based on the provided context."
                },
                {
                    "role": "user",
                    "content": section_prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000,
        )
        
        ai_content = response.choices[0].message.content
        lines = ai_content.split('\n')
        content_lines = []
        in_content = False
        
        for line in lines:
            if line.startswith('SECTION:'):
                continue
            elif line.startswith('CONTENT:'):
                in_content = True
                content_line = line.replace('CONTENT:', '').strip()
                if content_line:
                    content_lines.append(content_line)
            elif in_content and line.strip():
                content_lines.append(line)
        
        regenerated_content = '\n'.join(content_lines).strip()
        
        return {
            "section_title": request.section_title,
            "content": regenerated_content,
            "ai_available": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI regeneration failed: {str(e)}")


@router.post("/{scope_id}/ai/regenerate-full")
def regenerate_full_sow_with_ai(
    scope_id: int,
    db: Session = Depends(get_db)
):
    """Regenerate the entire SOW for an existing scope using AI"""
    # Check rate limit
    is_allowed, error_message = sow_ai_rate_limiter.check_rate_limit()
    if not is_allowed:
        raise HTTPException(status_code=429, detail=error_message)
    
    # Get existing SOW
    scope = db.query(ScopeOfWork).filter(ScopeOfWork.id == scope_id).first()
    if not scope:
        raise HTTPException(status_code=404, detail="Scope of work not found")
    
    # Determine pricing type from existing SOW or default to milestones
    # We'll need to infer this or store it - for now, default to milestones
    pricing_type = "milestones"  # Could be stored in scope model later
    num_milestones = 3  # Default, could be calculated from sections
    
    # Create request object for existing SOW
    ai_request = AIGenerateSOWRequest(
        client_id=scope.client_id,
        project_title=scope.title,
        project_description=None,
        start_date=scope.start_date.strftime('%Y-%m-%d') if scope.start_date else None,
        end_date=scope.end_date.strftime('%Y-%m-%d') if scope.end_date else None,
        pricing_type=pricing_type,
        num_milestones=num_milestones,
    )
    
    # Use the existing generation function
    return generate_sow_with_ai(ai_request, db)


@router.get("/{scope_id}/generate-pdf")
def generate_sow_pdf_endpoint(scope_id: int, db: Session = Depends(get_db)):
    """Generate PDF for a Scope of Work"""
    scope = db.query(ScopeOfWork).filter(ScopeOfWork.id == scope_id).first()
    if not scope:
        raise HTTPException(status_code=404, detail="Scope of work not found")
    
    client = db.query(Client).filter(Client.id == scope.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get sections
    sections = db.query(ScopeSection).filter(
        ScopeSection.scope_id == scope_id
    ).order_by(ScopeSection.order.asc()).all()
    
    if not sections:
        raise HTTPException(status_code=400, detail="No sections found for this SOW")
    
    # Prepare client info
    client_info = {
        "name": f"{client.first_name} {client.last_name}",
        "company": client.company,
        "email": client.email,
        "address": client.address,
    }
    
    # Generate PDF
    pdf_buffer = generate_sow_pdf(scope, client_info, sections)
    
    # Return PDF as response
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="SOW_{scope.title.replace(" ", "_")}.pdf"'
        }
    )


# Preview PDF Schema
class SectionPreview(BaseModel):
    title: str
    content: str
    order: int


class SOWPreviewRequest(BaseModel):
    title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    client_name: str
    client_company: Optional[str] = None
    client_email: Optional[str] = None
    client_address: Optional[str] = None
    sections: List[SectionPreview]


@router.post("/preview-pdf")
def preview_sow_pdf(request: SOWPreviewRequest):
    """Generate a preview PDF for a Scope of Work without saving it"""
    from datetime import datetime
    
    # Create a temporary scope-like object
    class TempScope:
        def __init__(self, title, start_date, end_date):
            self.title = title
            try:
                self.start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00')) if start_date else None
            except (AttributeError, ValueError):
                self.start_date = None
            try:
                self.end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00')) if end_date else None
            except (AttributeError, ValueError):
                self.end_date = None
    
    # Create a temporary client info dict
    client_info = {
        "name": request.client_name,
        "company": request.client_company or "",
        "email": request.client_email or "",
        "address": request.client_address or "",
    }
    
    # Create temporary section objects
    class TempSection:
        def __init__(self, title, content, order):
            self.title = title
            self.content = content
            self.order = order
    
    temp_scope = TempScope(request.title, request.start_date, request.end_date)
    temp_sections = [
        TempSection(section.title, section.content, section.order)
        for section in sorted(request.sections, key=lambda x: x.order)
    ]
    
    # Generate PDF
    pdf_buffer = generate_sow_pdf(temp_scope, client_info, temp_sections)
    
    # Return PDF as response (inline for preview, not attachment)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'inline; filename="SOW_Preview.pdf"'
        }
    )


# AI Integration Schemas
class AIGenerateSOWRequest(BaseModel):
    client_id: int
    project_title: str
    project_description: Optional[str] = None
    budget: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    pricing_type: str = "milestones"  # "milestones" or "hourly"
    num_milestones: Optional[int] = None  # Required if pricing_type is "milestones"
    hourly_rate: Optional[float] = None  # Required if pricing_type is "hourly"


@router.post("/ai/generate-sow")
def generate_sow_with_ai(
    request: AIGenerateSOWRequest,
    db: Session = Depends(get_db)
):
    """
    Generate complete SOW with all sections using AI
    
    This makes ONE comprehensive API call to OpenAI with all client context.
    No RAG needed - we pass all structured data in the prompt.
    
    Rate Limited: 3 uses, then 5-minute cooldown
    
    Returns all 19 sections with AI-generated content.
    """
    # Check rate limit
    is_allowed, error_message = sow_ai_rate_limiter.check_rate_limit()
    if not is_allowed:
        raise HTTPException(status_code=429, detail=error_message)
    
    # Validate pricing type
    pricing_type = request.pricing_type.lower() if request.pricing_type else "milestones"
    if pricing_type not in ["milestones", "hourly"]:
        raise HTTPException(status_code=400, detail="pricing_type must be 'milestones' or 'hourly'")
    
    # Verify client exists
    client = db.query(Client).filter(Client.id == request.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Validate required fields based on pricing type
    if pricing_type == "milestones" and (not request.num_milestones or request.num_milestones <= 0):
        raise HTTPException(status_code=400, detail="num_milestones is required and must be > 0 for milestone-based pricing")
    if pricing_type == "hourly":
        # Try to get hourly rate from request or client
        hourly_rate = request.hourly_rate or (client.hourly_rate if client.hourly_rate else None)
        if not hourly_rate or hourly_rate <= 0:
            raise HTTPException(status_code=400, detail="hourly_rate is required and must be > 0 for hourly pricing")
    
    # Get client context
    from models import ClientTechStack, Contract, ClientNote
    tech_stack = db.query(ClientTechStack).filter(
        ClientTechStack.client_id == request.client_id
    ).all()
    
    contracts = db.query(Contract).filter(
        Contract.client_id == request.client_id
    ).all()
    
    recent_notes = db.query(ClientNote).filter(
        ClientNote.client_id == request.client_id
    ).order_by(ClientNote.created_at.desc()).limit(5).all()
    
    # Build comprehensive context for AI - include ALL available client fields
    client_context = {
        "name": f"{client.first_name} {client.last_name}",
        "company": client.company or "",
        "email": client.email or "",
        "address": client.address or "",
        "description": client.description or "",
        "tech_stack": [f"{t.technology} ({t.category})" for t in tech_stack] if tech_stack else [],
        "contracts": [{"title": c.title, "type": c.contract_type, "status": c.status} for c in contracts],
        "recent_notes": [n.content[:200] for n in recent_notes[:3]],  # First 200 chars of recent notes
        # Additional client fields (only include if available)
        "hourly_rate": client.hourly_rate if client.hourly_rate else None,
        "notes_from_last_meeting": client.notes_from_last_meeting if client.notes_from_last_meeting else None,
        "timeline": client.timeline if client.timeline else None,
        "contract_status": client.contract_status if client.contract_status else None,
        "contract_type": client.contract_type if client.contract_type else None,
        "contract_due_date": client.contract_due_date.strftime('%Y-%m-%d') if client.contract_due_date else None,
        "client_date": client.client_date.strftime('%Y-%m-%d') if client.client_date else None,
        "status": client.status if client.status else None,
    }
    
    # Get max_tokens from environment or use default
    max_tokens = int(os.getenv("SOW_AI_MAX_TOKENS", "8000"))
    
    # Check if OpenAI is configured
    openai_api_key = os.getenv("OPENAI_API_KEY")
    
    if not openai_api_key:
        # Fallback: Use enhanced templates
        result = generate_sow_with_templates(request, client_context, db)
        result["ai_available"] = False
        result["note"] = "OpenAI API is not available. Generated using templates. You can manually edit all sections."
        return result
    
    try:
        # Import OpenAI (will fail if not installed)
        try:
            from openai import OpenAI
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="OpenAI package not installed. Run: pip install openai"
            )
        
        client_ai = OpenAI(api_key=openai_api_key)
        
        # Build comprehensive prompt
        prompt = build_sow_prompt(request, client_context)
        
        # Make ONE API call for all sections
        # Model options:
        # - "gpt-4o-mini" (recommended): Best balance of quality and cost for SOW generation
        # - "gpt-4o": Premium option for highest quality
        # - "gpt-3.5-turbo": Budget option, fastest
        response = client_ai.chat.completions.create(
            model="gpt-4o-mini",  # Recommended: Best balance for SOW generation
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at writing professional Statements of Work (SOW) for software development projects. Generate comprehensive, legally-sound SOW content based on the provided context."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=max_tokens,  # Configurable via SOW_AI_MAX_TOKENS env var (default: 8000)
        )
        
        # Parse AI response into sections and suggestions
        ai_content = response.choices[0].message.content
        
        # Parse the response (AI should return structured format)
        sections, suggestions = parse_ai_response_to_sections(ai_content, request)
        
        return {
            "sections": sections,
            "suggestions": suggestions,
            "ai_available": True,
            "note": "SOW generated using AI. Please review and customize as needed."
        }
        
    except Exception as e:
        # Fallback to templates if AI fails
        print(f"AI generation failed: {e}")
        result = generate_sow_with_templates(request, client_context, db)
        result["suggestions"] = []
        result["ai_available"] = False
        result["note"] = f"OpenAI API is not available ({str(e)}). Generated using templates. You can manually edit all sections."
        return result


def build_sow_prompt(request: AIGenerateSOWRequest, client_context: dict) -> str:
    """Build comprehensive prompt for AI to generate all SOW sections"""
    
    # Determine pricing structure
    pricing_type = request.pricing_type.lower() if request.pricing_type else "milestones"
    
    if pricing_type == "hourly":
        # Hourly pricing structure
        hourly_rate = request.hourly_rate or client_context.get("hourly_rate") or 0
        payment_schedule_note = f"""
PAYMENT SCHEDULE REQUIREMENTS (CRITICAL - MUST FOLLOW EXACTLY):
- Pricing Type: HOURLY
- Hourly Rate: ${hourly_rate:.2f} per hour
- Payment Terms: Invoice monthly based on hours worked
- Time Tracking: All work will be tracked and reported weekly
- Minimum Billing: Standard hourly increments apply
- In section 10 (Pricing & Payment Terms), clearly state this is an hourly contract with the rate of ${hourly_rate:.2f}/hour
"""
        num_milestones_display = "N/A (Hourly contract)"
    else:
        # Milestone-based pricing structure
        num_milestones = request.num_milestones or 3
        first_payment_percent = 20
        remaining_percent = 80
        
        if num_milestones > 0:
            # Calculate exact payment per milestone
            milestone_payment_exact = remaining_percent / num_milestones
            milestone_payment_percent = round(milestone_payment_exact, 2)
            calculated_total = first_payment_percent + (milestone_payment_percent * num_milestones)
            if abs(calculated_total - 100.0) > 0.01:
                difference = 100.0 - calculated_total
                milestone_payment_percent = round(milestone_payment_percent + (difference / num_milestones), 2)
        else:
            milestone_payment_percent = 0
        
        payment_schedule_note = f"""
PAYMENT SCHEDULE REQUIREMENTS (CRITICAL - MUST FOLLOW EXACTLY):
- Pricing Type: MILESTONE-BASED
- First payment: {first_payment_percent}% upon project kickoff (ALWAYS)
- Remaining {remaining_percent}% split evenly among {num_milestones} milestones
- Each milestone payment: {milestone_payment_percent}% upon completion of that milestone
- Total must equal 100%: {first_payment_percent}% + ({milestone_payment_percent}% × {num_milestones}) = {first_payment_percent + (milestone_payment_percent * num_milestones)}%
- In section 10 (Pricing & Payment Terms), list each milestone with its corresponding payment percentage
"""
        num_milestones_display = str(num_milestones)
    
    # Build additional client context string (only include if available)
    additional_context = []
    if client_context.get("hourly_rate"):
        additional_context.append(f"- Hourly Rate: ${client_context['hourly_rate']:.2f}/hour")
    if client_context.get("notes_from_last_meeting"):
        additional_context.append(f"- Notes from Last Meeting: {client_context['notes_from_last_meeting'][:300]}")
    if client_context.get("timeline"):
        additional_context.append(f"- Timeline: {client_context['timeline']}")
    if client_context.get("contract_type"):
        additional_context.append(f"- Contract Type: {client_context['contract_type']}")
    if client_context.get("contract_status"):
        additional_context.append(f"- Contract Status: {client_context['contract_status']}")
    if client_context.get("contract_due_date"):
        additional_context.append(f"- Contract Due Date: {client_context['contract_due_date']}")
    
    additional_context_str = "\n".join(additional_context) if additional_context else "- No additional context available"
    
    # Calculate project duration if dates are provided
    project_duration = None
    if request.start_date and request.end_date:
        try:
            from datetime import datetime
            start = datetime.fromisoformat(request.start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(request.end_date.replace('Z', '+00:00'))
            duration_days = (end - start).days
            duration_weeks = duration_days / 7
            duration_months = duration_days / 30
            if duration_days > 0:
                project_duration = f"{duration_days} days ({duration_weeks:.1f} weeks, {duration_months:.1f} months)"
        except:
            pass
    
    # Build budget information
    budget_info = ""
    if request.budget:
        budget_info = f"""
BUDGET INFORMATION (CRITICAL - USE THIS IN PRICING SECTIONS):
- Total Project Budget: ${request.budget:,.2f}
- This budget should be reflected in section 10 (Pricing & Payment Terms)
- If milestone-based, calculate milestone amounts based on this total budget
- If hourly, estimate total hours based on budget and hourly rate
"""
    
    prompt = f"""Generate a complete Statement of Work (SOW) with all 19 required sections for the following project.

CRITICAL INSTRUCTIONS:
- DO NOT use generic templates or placeholder content
- USE ALL the specific project details provided below to create CUSTOMIZED content
- Reference the actual project title, description, budget, timeline, and client information throughout
- Make each section specific to THIS project, not generic boilerplate
- The content must reflect the actual project scope, deliverables, and requirements provided

PROJECT INFORMATION:
- Title: {request.project_title}
- Description: {request.project_description or 'Not provided - use client context and project title to infer'}
- Start Date: {request.start_date or 'Not specified'}
- End Date: {request.end_date or 'Not specified'}
- Project Duration: {project_duration or 'Not specified'}
- Pricing Type: {pricing_type.upper()}
- Number of Milestones: {num_milestones_display}
{budget_info}{payment_schedule_note}

CLIENT INFORMATION:
- Name: {client_context['name']}
- Company: {client_context['company']}
- Email: {client_context['email']}
- Address: {client_context['address']}
- Project Description/Idea: {client_context['description']}

ADDITIONAL CLIENT CONTEXT (if available):
{additional_context_str}

TECHNICAL STACK:
{chr(10).join(f"- {tech}" for tech in client_context['tech_stack']) if client_context['tech_stack'] else "- Not specified"}

EXISTING CONTRACTS:
{chr(10).join(f"- {c['title']} ({c['type']}, {c['status']})" for c in client_context['contracts']) if client_context['contracts'] else "- None"}

RECENT PROJECT NOTES:
{chr(10).join(f"- {note}" for note in client_context['recent_notes']) if client_context['recent_notes'] else "- None"}

REQUIRED SECTIONS (generate content for each):
1. Executive Summary / Purpose
2. Definitions & Terminology
3. Scope of Work (Core Section) - Include In-Scope and Out-of-Scope
4. Deliverables
5. Milestones & Timeline - Create {num_milestones_display if pricing_type == "milestones" else "timeline milestones"} milestones
6. Technical Architecture
7. Roles & Responsibilities
8. Acceptance Criteria & Review Process
9. Change Management
10. Pricing & Payment Terms
11. IP Ownership & Licensing
12. Confidentiality & Data Handling
13. Security & Compliance
14. Testing & QA
15. Deployment & Handoff
16. Support, Maintenance & Warranty
17. Assumptions & Constraints
18. Termination & Exit
19. Legal Boilerplate (Often Referenced)

CRITICAL REQUIREMENTS FOR EACH SECTION:
1. Executive Summary / Purpose: 
   - Start with the project title: "{request.project_title}"
   - Reference the client: {client_context['name']} from {client_context['company']}
   - Include the project description: {request.project_description or 'Use client description and context'}
   - Mention budget if provided: {f"${request.budget:,.2f}" if request.budget else "Not specified"}
   - Reference timeline: {project_duration or f"{request.start_date} to {request.end_date}" if request.start_date and request.end_date else "As specified"}

2. Definitions & Terminology: Use terms specific to this project and tech stack

3. Scope of Work (Core Section):
   - Base this on the project description: {request.project_description or client_context.get('description', 'Use project title and client context')}
   - Clearly define what IS included based on the project details
   - Clearly define what is NOT included (out of scope)
   - Reference the tech stack: {', '.join(client_context['tech_stack'][:5]) if client_context['tech_stack'] else 'As specified in Technical Architecture'}

4. Deliverables:
   - Create specific deliverables based on the project description and tech stack
   - Reference the timeline and milestones
   - Make them measurable and tied to the project goals

5. Milestones & Timeline:
   - Use the actual dates: Start {request.start_date or 'TBD'}, End {request.end_date or 'TBD'}
   - Duration: {project_duration or 'Calculate from dates'}
   - Create {num_milestones_display if pricing_type == "milestones" else "realistic"} milestones that align with the project timeline
   - Each milestone should have specific deliverables tied to the project description

6. Technical Architecture:
   - MUST use the actual tech stack: {chr(10).join(f"  - {tech}" for tech in client_context['tech_stack']) if client_context['tech_stack'] else "  - Use client's tech stack from context"}
   - Be specific about technologies, frameworks, and tools
   - Reference how they relate to the project description
   - Include hosting providers, authentication approach, data storage, and third-party services
   - This section is CRITICAL - do not skip it

7. Roles & Responsibilities:
   - Clearly define client responsibilities (access, approvals, feedback, requirements)
   - Clearly define vendor/development team responsibilities (development, testing, documentation, deployment)
   - Be specific about timelines for approvals and feedback
   - This section is CRITICAL - do not skip it

8. Acceptance Criteria & Review Process:
   - Define what constitutes "complete" for deliverables
   - Specify review windows (e.g., 5 business days)
   - Define what happens if feedback isn't given
   - Include revision limits
   - This section is CRITICAL - do not skip it

9. Change Management:
   - Define how changes are requested
   - Include impact analysis requirements (time + cost)
   - Specify approval process
   - Require written change orders
   - This section is CRITICAL - do not skip it

10. Pricing & Payment Terms:
   - {f"Total Budget: ${request.budget:,.2f}" if request.budget else "Calculate based on project scope"}
   - {payment_schedule_note.split(chr(10))[1] if payment_schedule_note else ""}
   - Break down costs by milestone or hours as appropriate
   - Reference the pricing type: {pricing_type.upper()}
   - Include invoicing cadence and late payment terms
   - This section is CRITICAL - do not skip it

11. IP Ownership & Licensing:
   - Specify who owns custom code developed for this project
   - Define what happens to pre-existing IP
   - Address rights to reuse generic components
   - Include open-source usage disclosures
   - This section is CRITICAL - do not skip it

12. Confidentiality & Data Handling:
   - Define data access rules
   - Specify storage requirements
   - Include breach notification procedures
   - Reference NDA or MSA if applicable
   - This section is CRITICAL - do not skip it

13. Security & Compliance:
   - Define authentication standards
   - Specify encryption requirements
   - Include access controls
   - Address audit logging
   - Include compliance needs (PCI DSS, HIPAA, SOC2, etc. as relevant)
   - This section is CRITICAL - do not skip it

14. Testing & QA:
   - Define unit testing requirements
   - Specify integration testing
   - Include User Acceptance Testing (UAT) process
   - Define bug severity levels and fix timelines
   - This section is CRITICAL - do not skip it

15. Deployment & Handoff:
   - Specify deployment steps
   - Define credentials handoff process
   - Include documentation delivery requirements
   - Specify knowledge transfer sessions
   - Include training if applicable
   - This section is CRITICAL - do not skip it

16. Support, Maintenance & Warranty:
   - Define warranty period (typically 30 days)
   - Distinguish bug fixes vs enhancements
   - Specify support SLAs
   - Mention optional maintenance packages
   - This section is CRITICAL - do not skip it

17. Assumptions & Constraints:
   - List dependencies on third parties
   - Include budget assumptions
   - Specify tool availability requirements
   - Define team availability expectations
   - This section is CRITICAL - do not skip it

18. Termination & Exit:
   - Define termination rights
   - Specify payment for work completed
   - Include code handoff on termination
   - Define data deletion obligations
   - This section is CRITICAL - do not skip it

19. Legal Boilerplate (Often Referenced):
   - Specify governing law
   - Include liability limits
   - Address indemnification
   - Include force majeure clause
   - Reference Master Services Agreement (MSA) if applicable
   - This section is CRITICAL - do not skip it

ALL SECTIONS:
- Make content professional, comprehensive, and legally sound
- Use SPECIFIC details from the project information above - DO NOT use generic templates
- Reference the actual project title "{request.project_title}" throughout
- Reference the client {client_context['name']} and company {client_context['company']} by name
- Use the tech stack provided: {', '.join(client_context['tech_stack'][:3]) if client_context['tech_stack'] else 'As specified'}
- Ensure all sections flow logically and reference each other
- Be explicit about what is included and excluded based on the project description
- Generate realistic milestones based on the actual project timeline
- Use budget, timeline, dates, and all provided context to inform content
- After generating all sections, provide SUGGESTIONS for improvements, missing information, or potential issues

CRITICAL FORMATTING REQUIREMENTS:
- You MUST generate ALL 19 sections listed above
- Each section MUST start with exactly: "SECTION: [section number]. [section title]"
- Follow immediately with: "CONTENT: [your generated content]"
- Do NOT use markdown headers (###) in the section titles
- Do NOT include "SECTION:" or "CONTENT:" markers inside the content itself
- Generate comprehensive, project-specific content for EVERY section
- Do NOT skip any sections or use placeholders

Return the content in the following EXACT format (no markdown, no ###):
SECTION: 1. Executive Summary / Purpose
CONTENT: [generated content - multiple paragraphs as needed]

SECTION: 2. Definitions & Terminology
CONTENT: [generated content - multiple paragraphs as needed]

SECTION: 3. Scope of Work (Core Section)
CONTENT: [generated content - include In-Scope and Out-of-Scope subsections]

SECTION: 4. Deliverables
CONTENT: [generated content]

SECTION: 5. Milestones & Timeline
CONTENT: [generated content with specific milestones]

SECTION: 6. Technical Architecture
CONTENT: [generated content - MUST include tech stack details]

SECTION: 7. Roles & Responsibilities
CONTENT: [generated content - MUST include client and vendor responsibilities]

SECTION: 8. Acceptance Criteria & Review Process
CONTENT: [generated content - MUST include acceptance criteria and review process]

SECTION: 9. Change Management
CONTENT: [generated content - MUST include change request process]

SECTION: 10. Pricing & Payment Terms
CONTENT: [generated content - MUST include budget and payment schedule]

SECTION: 11. IP Ownership & Licensing
CONTENT: [generated content - MUST include IP ownership details]

SECTION: 12. Confidentiality & Data Handling
CONTENT: [generated content - MUST include confidentiality terms]

SECTION: 13. Security & Compliance
CONTENT: [generated content - MUST include security requirements]

SECTION: 14. Testing & QA
CONTENT: [generated content - MUST include testing requirements]

SECTION: 15. Deployment & Handoff
CONTENT: [generated content - MUST include deployment and handoff process]

SECTION: 16. Support, Maintenance & Warranty
CONTENT: [generated content - MUST include warranty and support terms]

SECTION: 17. Assumptions & Constraints
CONTENT: [generated content - MUST include assumptions and constraints]

SECTION: 18. Termination & Exit
CONTENT: [generated content - MUST include termination terms]

SECTION: 19. Legal Boilerplate (Often Referenced)
CONTENT: [generated content - MUST include legal terms]

SUGGESTIONS:
[Provide suggestions for improvements, missing information, potential issues, or recommendations based on the client context and project details]
"""
    return prompt


def parse_ai_response_to_sections(ai_content: str, request: AIGenerateSOWRequest) -> tuple:
    """Parse AI response into structured sections and suggestions"""
    sections = []
    suggestions = []
    current_section = None
    current_content = []
    in_suggestions = False
    
    lines = ai_content.split('\n')
    
    # Expected section titles (for matching)
    expected_sections = [
        "1. Executive Summary / Purpose",
        "2. Definitions & Terminology",
        "3. Scope of Work (Core Section)",
        "4. Deliverables",
        "5. Milestones & Timeline",
        "6. Technical Architecture",
        "7. Roles & Responsibilities",
        "8. Acceptance Criteria & Review Process",
        "9. Change Management",
        "10. Pricing & Payment Terms",
        "11. IP Ownership & Licensing",
        "12. Confidentiality & Data Handling",
        "13. Security & Compliance",
        "14. Testing & QA",
        "15. Deployment & Handoff",
        "16. Support, Maintenance & Warranty",
        "17. Assumptions & Constraints",
        "18. Termination & Exit",
        "19. Legal Boilerplate (Often Referenced)",
    ]
    
    for line in lines:
        line_stripped = line.strip()
        line_upper = line_stripped.upper()
        
        # Check for suggestions section
        if 'SUGGESTIONS' in line_upper and ':' in line:
            in_suggestions = True
            continue
        elif in_suggestions:
            if line_stripped:
                suggestions.append(line_stripped)
            continue
        
        # Check for section header - more flexible matching
        section_found = False
        # Handle ### SECTION: format (markdown headers)
        if line_stripped.startswith('### SECTION:') or line_stripped.startswith('## SECTION:'):
            # Markdown format: ### SECTION: 1. Title
            section_text = line_stripped.replace('### SECTION:', '').replace('## SECTION:', '').replace('SECTION:', '').strip()
            section_found = True
        elif line_stripped.startswith('SECTION:'):
            # Standard format: SECTION: 1. Title
            section_text = line_stripped.replace('SECTION:', '').strip()
            section_found = True
        elif line_stripped.startswith('###') and any(exp in line_stripped for exp in expected_sections):
            # Markdown format: ### 6. Technical Architecture
            section_text = line_stripped.replace('###', '').strip()
            section_found = True
        elif any(line_stripped.startswith(exp) for exp in expected_sections):
            # Direct section title match
            section_text = line_stripped
            section_found = True
        elif line_stripped and any(exp in line_stripped for exp in expected_sections):
            # Partial match - find the matching section
            for exp in expected_sections:
                if exp in line_stripped:
                    section_text = exp
                    section_found = True
                    break
        
        if section_found:
            # Save previous section
            if current_section and current_content:
                # Clean up previous section title
                cleaned_prev_title = current_section
                if cleaned_prev_title.startswith('###'):
                    cleaned_prev_title = cleaned_prev_title.replace('###', '').strip()
                if cleaned_prev_title.startswith('##'):
                    cleaned_prev_title = cleaned_prev_title.replace('##', '').strip()
                if cleaned_prev_title.startswith('SECTION:'):
                    cleaned_prev_title = cleaned_prev_title.replace('SECTION:', '').strip()
                
                # Clean up content
                cleaned_prev_content = []
                for line in current_content:
                    line_stripped = line.strip()
                    if line_stripped in ['SECTION:', 'CONTENT:'] or line_stripped.startswith('### SECTION:') or line_stripped.startswith('## SECTION:'):
                        continue
                    if line_stripped.startswith('SECTION: ') and len(line_stripped) > 10:
                        cleaned_prev_content.append(line.replace('SECTION: ', ''))
                    elif line_stripped.startswith('CONTENT: ') and len(line_stripped) > 10:
                        cleaned_prev_content.append(line.replace('CONTENT: ', ''))
                    else:
                        cleaned_prev_content.append(line)
                
                sections.append({
                    "title": cleaned_prev_title,
                    "content": '\n'.join(cleaned_prev_content).strip(),
                    "order": len(sections) + 1
                })
            # Start new section
            current_section = section_text
            current_content = []
            continue
        
        # Check for content marker
        if line_stripped.startswith('CONTENT:'):
            content_line = line_stripped.replace('CONTENT:', '').strip()
            if content_line:
                current_content.append(content_line)
            continue
        
        # Skip lines that look like section headers in content (clean up)
        if current_section and (line_stripped.startswith('### SECTION:') or line_stripped.startswith('## SECTION:') or 
                               (line_stripped.startswith('SECTION:') and not line_stripped.startswith('SECTION: '))):
            continue
        
        # Continue content if we're in a section
        if current_section:
            # Skip empty lines only if we haven't started content yet
            if line_stripped or current_content:
                # Clean up any remaining SECTION: or CONTENT: markers in content
                cleaned_line = line
                if line_stripped.startswith('SECTION:') and 'CONTENT:' not in line:
                    continue  # Skip standalone SECTION: lines in content
                current_content.append(cleaned_line)
    
    # Save last section
    if current_section and current_content:
        # Clean up content - remove any SECTION: or CONTENT: markers that might be in the content
        cleaned_content = []
        for line in current_content:
            line_stripped = line.strip()
            # Skip lines that are just markers
            if line_stripped in ['SECTION:', 'CONTENT:'] or line_stripped.startswith('### SECTION:') or line_stripped.startswith('## SECTION:'):
                continue
            # Remove SECTION: or CONTENT: prefixes if they appear in the middle of content
            if line_stripped.startswith('SECTION: ') and len(line_stripped) > 10:
                cleaned_content.append(line.replace('SECTION: ', ''))
            elif line_stripped.startswith('CONTENT: ') and len(line_stripped) > 10:
                cleaned_content.append(line.replace('CONTENT: ', ''))
            else:
                cleaned_content.append(line)
        
        # Clean up section title - remove any markdown formatting
        cleaned_title = current_section
        if cleaned_title.startswith('###'):
            cleaned_title = cleaned_title.replace('###', '').strip()
        if cleaned_title.startswith('##'):
            cleaned_title = cleaned_title.replace('##', '').strip()
        # Remove SECTION: prefix if it somehow got into the title
        if cleaned_title.startswith('SECTION:'):
            cleaned_title = cleaned_title.replace('SECTION:', '').strip()
        
        # Final cleanup of content - remove any remaining markers
        final_content = '\n'.join(cleaned_content).strip()
        # Remove any SECTION: or CONTENT: lines that might be in the middle
        final_lines = []
        for line in final_content.split('\n'):
            line_stripped = line.strip()
            # Skip lines that are just markers
            if line_stripped in ['SECTION:', 'CONTENT:', '### SECTION:', '## SECTION:']:
                continue
            # Remove SECTION: or CONTENT: prefixes if they appear
            if line_stripped.startswith('SECTION: '):
                final_lines.append(line.replace('SECTION: ', ''))
            elif line_stripped.startswith('CONTENT: '):
                final_lines.append(line.replace('CONTENT: ', ''))
            elif line_stripped.startswith('### SECTION: '):
                final_lines.append(line.replace('### SECTION: ', ''))
            elif line_stripped.startswith('## SECTION: '):
                final_lines.append(line.replace('## SECTION: ', ''))
            else:
                final_lines.append(line)
        
        sections.append({
            "title": cleaned_title,
            "content": '\n'.join(final_lines).strip(),
            "order": len(sections) + 1
        })
    
    # If we got some sections but not all, that's okay - return what we have
    # Only fallback to templates if we got very few sections (likely parsing failure)
    if len(sections) < 5:
        print(f"Warning: Only parsed {len(sections)} sections from AI response. Falling back to templates.")
        print(f"First 500 chars of AI response: {ai_content[:500]}")
        template_result = generate_sow_with_templates(request, {}, None)["sections"]
        return template_result, []
    
    # If we have sections but not all 19, pad with templates for missing ones
    if len(sections) < 19:
        print(f"Warning: Parsed {len(sections)} sections, expected 19. Some sections may be missing.")
        # Get template sections to fill in gaps
        template_sections = generate_sow_with_templates(request, {}, None)["sections"]
        existing_titles = {s["title"] for s in sections}
        
        # Add missing sections from templates
        for template_section in template_sections:
            if template_section["title"] not in existing_titles:
                sections.append(template_section)
    
    return sections, suggestions


def generate_sow_with_templates(request: AIGenerateSOWRequest, client_context: dict, db=None) -> dict:
    """Fallback: Generate SOW using enhanced templates"""
    sections = []
    for section_template in SOW_SECTIONS:
        content = section_template["template"]
        
        # Replace placeholders
        content = content.replace("[CLIENT_NAME]", client_context.get("name", "[CLIENT_NAME]"))
        content = content.replace("[CLIENT_COMPANY]", client_context.get("company", "[CLIENT_COMPANY]"))
        
        # Handle milestones
        if "Milestones" in section_template["title"]:
            from utils.sow_templates import generate_milestones_template
            content = generate_milestones_template(
                request.num_milestones,
                request.start_date,
                request.end_date
            )
        
        # Handle tech stack
        if "Technical Architecture" in section_template["title"]:
            tech_list = client_context.get("tech_stack", [])
            if tech_list:
                tech_text = "\n".join(f"- {tech}" for tech in tech_list)
                content = content.replace("[TECH_STACK]", tech_text)
        
        sections.append({
            "title": section_template["title"],
            "content": content,
            "order": section_template["order"]
        })
    
    return {
        "sections": sections,
        "ai_available": False,
        "note": "Generated using templates. Enable AI for enhanced content."
    }

