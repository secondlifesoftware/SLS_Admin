from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from database import get_db
from models import ClientTimeline, Client
from schemas import ClientTimeline as ClientTimelineSchema, ClientTimelineCreate, ClientTimelineUpdate
import os
import json

router = APIRouter(prefix="/api/client-timeline", tags=["client-timeline"])


@router.get("/client/{client_id}", response_model=List[ClientTimelineSchema])
def get_client_timeline(client_id: int, db: Session = Depends(get_db)):
    """Get all timeline events for a specific client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    timeline = db.query(ClientTimeline).filter(ClientTimeline.client_id == client_id).order_by(ClientTimeline.event_date.desc()).all()
    return timeline


@router.get("/{timeline_id}", response_model=ClientTimelineSchema)
def get_timeline_event(timeline_id: int, db: Session = Depends(get_db)):
    """Get a specific timeline event by ID"""
    event = db.query(ClientTimeline).filter(ClientTimeline.id == timeline_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    return event


@router.post("/", response_model=ClientTimelineSchema)
def create_timeline_event(event: ClientTimelineCreate, db: Session = Depends(get_db)):
    """Create a new timeline event for a client"""
    client = db.query(Client).filter(Client.id == event.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db_event = ClientTimeline(**event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


@router.put("/{timeline_id}", response_model=ClientTimelineSchema)
def update_timeline_event(timeline_id: int, event_update: ClientTimelineUpdate, db: Session = Depends(get_db)):
    """Update a timeline event"""
    db_event = db.query(ClientTimeline).filter(ClientTimeline.id == timeline_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    
    update_data = event_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_event, field, value)
    
    db.commit()
    db.refresh(db_event)
    return db_event


@router.delete("/{timeline_id}")
def delete_timeline_event(timeline_id: int, db: Session = Depends(get_db)):
    """Delete a timeline event"""
    db_event = db.query(ClientTimeline).filter(ClientTimeline.id == timeline_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    
    db.delete(db_event)
    db.commit()
    return {"message": "Timeline event deleted successfully"}


class ParseTimelineRequest(BaseModel):
    text: str
    client_id: int


@router.post("/parse-timeline-with-ai")
def parse_timeline_with_ai(request: ParseTimelineRequest, db: Session = Depends(get_db)):
    """Use OpenAI to intelligently parse timeline text and extract milestones/sprints"""
    
    # Verify client exists
    client = db.query(Client).filter(Client.id == request.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise HTTPException(status_code=400, detail="OpenAI API is not configured")
    
    try:
        from openai import OpenAI
        client_ai = OpenAI(api_key=openai_api_key)
    except ImportError:
        raise HTTPException(status_code=500, detail="OpenAI package not installed")
    
    prompt = f"""You are an expert at parsing project timelines and extracting structured milestone and sprint information.

Parse the following timeline text and extract:
1. Project information (duration, start date, end date, engagement type, deposit info)
2. All milestones or sprints with their details (title, description, dates, deliverables, payment info)

Timeline Text:
{request.text}

Return a JSON object with this exact structure:
{{
  "projectInfo": {{
    "duration": "e.g., 6 Weeks",
    "startDate": "YYYY-MM-DD or null",
    "endDate": "YYYY-MM-DD or null",
    "engagement": "e.g., Time & Materials, Milestone-Based",
    "deposit": "e.g., 20% due at start of Milestone 1"
  }},
  "milestones": [
    {{
      "milestoneNumber": "1 or Milestone 1 or null",
      "title": "Milestone title",
      "description": "Full description including deliverables and focus areas",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "effort": "e.g., 6-8 hours or null",
      "acceptanceCriteria": "Acceptance criteria if mentioned",
      "payment": "Payment information if mentioned",
      "sprint": "Sprint/week number if mentioned",
      "keyDeliverables": "Key deliverables if mentioned"
    }}
  ]
}}

Important:
- Extract dates in any format and convert to YYYY-MM-DD
- If a row mentions multiple milestones (e.g., "Milestones 3 & 4"), create separate entries for each
- Include all relevant information from the text in the description
- If dates are in ranges like "Jan 1 – Jan 5, 2026", parse both start and end dates
- Return ONLY valid JSON, no markdown formatting or code blocks"""

    try:
        response = client_ai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at parsing project timelines. Always return valid JSON only, no markdown or code blocks."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=3000,
        )
        
        ai_content = response.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if ai_content.startswith("```json"):
            ai_content = ai_content[7:]
        if ai_content.startswith("```"):
            ai_content = ai_content[3:]
        if ai_content.endswith("```"):
            ai_content = ai_content[:-3]
        ai_content = ai_content.strip()
        
        parsed_data = json.loads(ai_content)
        
        return parsed_data
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing timeline with AI: {str(e)}")

