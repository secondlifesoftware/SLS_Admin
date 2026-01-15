from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from database import get_db
from models import Client, ClientContact, ClientNote, CalendarEvent
from schemas import Client as ClientSchema, ClientList, ClientCreate, ClientUpdate
import os
from collections import defaultdict

router = APIRouter(prefix="/api/clients", tags=["clients"])

# Initialize OpenAI client
openai_client = None
try:
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key:
        from openai import OpenAI
        openai_client = OpenAI(api_key=openai_api_key)
        print("✅ OpenAI client initialized successfully")
    else:
        print("⚠️  WARNING: OPENAI_API_KEY not found in environment variables")
except ImportError:
    print("⚠️  WARNING: OpenAI package not installed. Run: pip install openai")
    openai_client = None
except Exception as e:
    print(f"⚠️  WARNING: Error initializing OpenAI client: {e}")
    openai_client = None


@router.get("/", response_model=List[ClientList])
def get_clients(skip: int = 0, limit: int = 100, status: str = None, contract_status: str = None, db: Session = Depends(get_db)):
    """Get all clients with optional filtering, ordered by creation date (newest first)"""
    query = db.query(Client)
    
    if status:
        query = query.filter(Client.status == status)
    
    if contract_status:
        query = query.filter(Client.contract_status == contract_status)
    
    # Order by created_at descending (newest first)
    clients = query.order_by(Client.created_at.desc()).offset(skip).limit(limit).all()
    return clients


@router.get("/{client_id}", response_model=ClientSchema)
def get_client(client_id: int, db: Session = Depends(get_db)):
    """Get a specific client by ID with all relationships"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("/", response_model=ClientSchema)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    """Create a new client with contacts"""
    client_data = client.dict()
    contacts_data = client_data.pop('contacts', [])
    
    db_client = Client(**client_data)
    db.add(db_client)
    db.flush()  # Flush to get the client ID
    
    # Add contacts
    for contact_data in contacts_data:
        contact_data['client_id'] = db_client.id
        db_contact = ClientContact(**contact_data)
        db.add(db_contact)
    
    db.commit()
    db.refresh(db_client)
    return db_client


@router.put("/{client_id}", response_model=ClientSchema)
def update_client(client_id: int, client_update: ClientUpdate, db: Session = Depends(get_db)):
    """Update a client"""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = client_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_client, field, value)
    
    db.commit()
    db.refresh(db_client)
    return db_client


class UpdateDescriptionRequest(BaseModel):
    description: str

@router.patch("/{client_id}/description")
def update_client_description(client_id: int, request: UpdateDescriptionRequest, db: Session = Depends(get_db)):
    """Update a client's description"""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db_client.description = request.description
    db.commit()
    db.refresh(db_client)
    return {"message": "Description updated successfully", "description": db_client.description}


# Google Calendar Integration
class CreateCalendarEventRequest(BaseModel):
    client_id: int
    event_start: str  # ISO format datetime
    event_end: str  # ISO format datetime
    client_name: str
    client_email: EmailStr
    client_phone: str
    project_description: str


def get_google_calendar_service():
    """Initialize Google Calendar API service with domain-wide delegation"""
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        import json
        
        # Check for service account credentials
        credentials_json = os.getenv("GOOGLE_CALENDAR_CREDENTIALS_JSON")
        if not credentials_json:
            print("⚠️  WARNING: GOOGLE_CALENDAR_CREDENTIALS_JSON not found")
            return None
        
        # If it's a JSON string, parse it; if it's a file path, read it
        try:
            if os.path.exists(credentials_json):
                with open(credentials_json, 'r') as f:
                    credentials_info = json.load(f)
            else:
                credentials_info = json.loads(credentials_json)
        except json.JSONDecodeError:
            print("⚠️  ERROR: Invalid JSON in GOOGLE_CALENDAR_CREDENTIALS_JSON")
            return None
        
        SCOPES = ['https://www.googleapis.com/auth/calendar']
        
        # Use domain-wide delegation to impersonate the calendar owner
        # This requires: 1) Service account with domain-wide delegation enabled
        # 2) Admin Console configured with Client ID and scope
        # 3) GOOGLE_CALENDAR_IMPERSONATE_USER set to the email to impersonate
        impersonate_user = os.getenv("GOOGLE_CALENDAR_IMPERSONATE_USER", "info@secondlifesoftware.com")
        
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info, 
            scopes=SCOPES,
            subject=impersonate_user  # Domain-wide delegation: impersonate this user
        )
        
        service = build('calendar', 'v3', credentials=credentials)
        print(f"✅ Google Calendar service initialized (impersonating {impersonate_user})")
        return service
    except ImportError:
        print("⚠️  WARNING: Google Calendar API libraries not installed. Run: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib")
        return None
    except Exception as e:
        print(f"⚠️  ERROR: Failed to initialize Google Calendar service: {e}")
        import traceback
        traceback.print_exc()
        return None


@router.post("/{client_id}/create-calendar-event")
def create_calendar_event(client_id: int, request: CreateCalendarEventRequest, db: Session = Depends(get_db)):
    """Create a Google Calendar event with attendees and custom information"""
    try:
        # Verify client exists
        db_client = db.query(Client).filter(Client.id == client_id).first()
        if not db_client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        # Get Google Calendar service
        service = get_google_calendar_service()
        if not service:
            raise HTTPException(
                status_code=500, 
                detail="Google Calendar service not available. Please configure GOOGLE_CALENDAR_CREDENTIALS_JSON"
            )
        
        # Parse datetime strings
        event_start = datetime.fromisoformat(request.event_start.replace('Z', '+00:00'))
        event_end = datetime.fromisoformat(request.event_end.replace('Z', '+00:00'))
        
        # Create event description with all client information
        event_description = f"""Project Discussion Call

Client Information:
- Name: {request.client_name}
- Email: {request.client_email}
- Phone: {request.client_phone}

Project Description:
{request.project_description}

---
This meeting was scheduled through the Second Life Software booking system.
"""
        
        # Create calendar event - use main calendar
        calendar_id = os.getenv("GOOGLE_CALENDAR_ID", "info@secondlifesoftware.com")
        
        event = {
            'summary': f'Project Discussion - {request.client_name}',
            'description': event_description,
            'start': {
                'dateTime': event_start.isoformat(),
                'timeZone': 'Europe/Madrid',
            },
            'end': {
                'dateTime': event_end.isoformat(),
                'timeZone': 'Europe/Madrid',
            },
            'attendees': [
                {'email': request.client_email},
                {'email': 'katia@secondlifesoftware.com'},
                {'email': 'darius@secondlifesoftware.com'},
            ],
            'organizer': {
                'email': 'info@secondlifesoftware.com',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                    {'method': 'popup', 'minutes': 15},  # 15 minutes before
                ],
            },
            'conferenceData': {
                'createRequest': {
                    'requestId': f"meet-{client_id}-{int(datetime.now().timestamp())}",
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                }
            }
        }
        
        # Insert event
        created_event = service.events().insert(
            calendarId=calendar_id,
            body=event,
            conferenceDataVersion=1,
            sendUpdates='all'  # Send invites to all attendees
        ).execute()
        
        return {
            "message": "Calendar event created successfully",
            "event_id": created_event.get('id'),
            "event_link": created_event.get('htmlLink'),
            "meet_link": created_event.get('hangoutLink'),
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid datetime format: {str(e)}")
    except Exception as e:
        print(f"ERROR creating calendar event: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create calendar event: {str(e)}")


@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db)):
    """Delete a client"""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db.delete(db_client)
    db.commit()
    return {"message": "Client deleted successfully"}


# Booking form schemas
class BookCallRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role_type: str  # founder, employee, business_representative, other
    project_description: str
    timeline: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    budget: float
    urgency: int  # 0-10
    use_ai_summarization: bool = False  # Opt-in for AI summarization


def summarize_project_description(description: str) -> str:
    """Use AI to create a detailed summary of the project description"""
    if not openai_client:
        print("WARNING: OpenAI client not initialized. Check OPENAI_API_KEY in .env file.")
        # Fallback to original description if OpenAI is not available
        return description
    
    if not description or not description.strip():
        return description
    
    try:
        print(f"Calling OpenAI to enhance project description (length: {len(description)} chars)")
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at analyzing and enhancing project descriptions for software development companies. Your task is to take a client's project description and create a clear, detailed, professional, and well-organized summary that:\n\n1. Expands on key requirements and goals\n2. Clarifies technical needs and specifications\n3. Highlights important details that might be missing\n4. Organizes the information in a logical structure\n5. Makes it suitable for a client profile in a CRM system\n\nIMPORTANT: You must enhance and expand the description. Do NOT just return the original text. Add detail, clarity, and structure."
                },
                {
                    "role": "user",
                    "content": f"Please enhance and expand the following project description. Make it more detailed, clear, and professional. Add structure and clarify any ambiguous points:\n\n{description}\n\nReturn an enhanced version that is more detailed and better organized than the original."
                }
            ],
            temperature=0.7,
            max_tokens=1500,
        )
        
        enhanced_description = response.choices[0].message.content.strip()
        print(f"AI enhancement successful. Original length: {len(description)}, Enhanced length: {len(enhanced_description)}")
        
        # Ensure we actually got an enhanced version
        if not enhanced_description or enhanced_description == description:
            print("WARNING: AI returned same or empty description. Using original.")
            return description
            
        return enhanced_description
    except Exception as e:
        print(f"ERROR: AI summarization failed: {e}")
        import traceback
        traceback.print_exc()
        # Fallback to original description
        return description


# Rate limiter for booking requests (prevent spam)
booking_rate_limiter = defaultdict(list)

def check_booking_rate_limit(identifier: str, max_requests: int = 3, window_minutes: int = 60) -> Tuple[bool, str]:
    """
    Check if booking request is within rate limit.
    identifier: email or IP address
    max_requests: maximum requests allowed in window
    window_minutes: time window in minutes
    Returns: (is_allowed, error_message)
    """
    now = datetime.now()
    window_start = now - timedelta(minutes=window_minutes)
    
    # Clean old entries
    booking_rate_limiter[identifier] = [
        timestamp for timestamp in booking_rate_limiter[identifier]
        if timestamp > window_start
    ]
    
    # Check limit
    if len(booking_rate_limiter[identifier]) >= max_requests:
        return False, f"Too many booking requests. Please wait {window_minutes} minutes before submitting again."
    
    # Add current request
    booking_rate_limiter[identifier].append(now)
    return True, ""


@router.post("/book-call")
def book_call(request: BookCallRequest, db: Session = Depends(get_db)):
    """Handle booking form submission - creates a client with optional AI-summarized description"""
    try:
        # Check rate limit (by email)
        is_allowed, error_message = check_booking_rate_limit(request.email, max_requests=3, window_minutes=60)
        if not is_allowed:
            raise HTTPException(status_code=429, detail=error_message)
        
        # Check if client already exists by email
        existing_client = db.query(Client).filter(Client.email == request.email).first()
        
        # Use AI summarization only if user opted in
        if request.use_ai_summarization:
            print(f"[BOOK-CALL] AI summarization requested. Original description: {request.project_description[:100]}...")
            if not openai_client:
                print("[BOOK-CALL] ERROR: OpenAI client not initialized. Check OPENAI_API_KEY in backend/.env")
                # Still proceed but use original description
                summarized_description = request.project_description
            else:
                summarized_description = summarize_project_description(request.project_description)
                print(f"[BOOK-CALL] AI summarization completed. Enhanced description: {summarized_description[:100]}...")
                if summarized_description == request.project_description:
                    print("[BOOK-CALL] WARNING: AI returned same description as original - check OpenAI API key and logs")
        else:
            summarized_description = request.project_description
        
        if existing_client:
            # Update existing client with new information
            existing_client.first_name = request.first_name
            existing_client.last_name = request.last_name
            existing_client.description = summarized_description
            existing_client.status = "Lead"
            existing_client.contract_status = "No Contract"
            
            # Update timeline if provided
            if request.timeline:
                existing_client.timeline = request.timeline
            
            # Create a note for this booking/meeting
            notes_content = f"Booking Request Details:\n"
            notes_content += f"Role Type: {request.role_type}\n"
            notes_content += f"Budget: ${request.budget:,.2f}\n"
            notes_content += f"Urgency Level: {request.urgency}/10\n"
            notes_content += f"Start Date: {request.start_date}\n"
            if request.end_date:
                notes_content += f"End Date: {request.end_date}\n"
            notes_content += f"\nOriginal Project Description:\n{request.project_description}"
            
            meeting_note = ClientNote(
                client_id=existing_client.id,
                title="Booking Request Update",
                content=notes_content,
                note_type="Meeting",
                meeting_date=datetime.now(),
                created_by="System"
            )
            db.add(meeting_note)
            
            db.commit()
            db.refresh(existing_client)
            return {
                "message": "Booking request received. Your information has been updated.",
                "client_id": existing_client.id,
                "ai_summarized_description": summarized_description if request.use_ai_summarization else None,
                "original_description": request.project_description
            }
        
        # Create new client
        
        # Parse dates
        try:
            start_date = datetime.fromisoformat(request.start_date.replace('Z', '+00:00')) if request.start_date else datetime.now()
        except:
            start_date = datetime.now()
        
        try:
            end_date = datetime.fromisoformat(request.end_date.replace('Z', '+00:00')) if request.end_date else None
        except:
            end_date = None
        
        # Create client
        new_client = Client(
            first_name=request.first_name,
            last_name=request.last_name,
            email=request.email,
            client_date=datetime.now(),
            description=summarized_description,
            timeline=request.timeline,
            contract_status="No Contract",
            status="Lead",  # New booking requests are leads
            contract_type=None,
            contract_due_date=end_date,
        )
        
        # Store budget and urgency in notes_from_last_meeting for now
        # (You could add these as separate fields in the Client model if needed)
        notes_content = f"Booking Request Details:\n"
        notes_content += f"Role Type: {request.role_type}\n"
        notes_content += f"Budget: ${request.budget:,.2f}\n"
        notes_content += f"Urgency Level: {request.urgency}/10\n"
        notes_content += f"Start Date: {request.start_date}\n"
        if request.end_date:
            notes_content += f"End Date: {request.end_date}\n"
        notes_content += f"\nOriginal Project Description:\n{request.project_description}"
        
        new_client.notes_from_last_meeting = notes_content
        
        db.add(new_client)
        db.flush()
        
        # Create a contact entry
        contact = ClientContact(
            client_id=new_client.id,
            name=f"{request.first_name} {request.last_name}",
            email=request.email,
            phone=request.phone,
            title=request.role_type.replace('_', ' ').title(),
            order=1,
        )
        db.add(contact)
        
        # Create a note in the Notes tab for the booking/meeting
        meeting_note = ClientNote(
            client_id=new_client.id,
            title="Initial Booking Request",
            content=notes_content,
            note_type="Meeting",
            meeting_date=datetime.now(),
            created_by="System"
        )
        db.add(meeting_note)
        
        db.commit()
        db.refresh(new_client)
        
        return {
            "message": "Booking request received successfully. Your information has been saved and a client profile has been created.",
            "client_id": new_client.id,
            "ai_summarized_description": summarized_description if request.use_ai_summarization else None,
            "original_description": request.project_description
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process booking request: {str(e)}")


# Google Calendar Booking Sync
def sync_calendar_bookings_internal(db: Session):
    """Internal function for calendar sync (can be called from scheduler)"""
    return sync_calendar_bookings(db)

@router.post("/sync-calendar-bookings")
def sync_calendar_bookings(db: Session = Depends(get_db)):
    """
    Poll Google Calendar for new booking events and match them to CRM clients.
    This should be called periodically (e.g., every 5 minutes via cron or scheduled task).
    """
    try:
        service = get_google_calendar_service()
        if not service:
            raise HTTPException(
                status_code=500,
                detail="Google Calendar service not available. Check configuration."
            )
        
        # Use main calendar for booking sync
        calendar_id = os.getenv("GOOGLE_CALENDAR_ID", "info@secondlifesoftware.com")
        
        # Get events from the last 24 hours and next 30 days
        time_min = (datetime.now() - timedelta(days=1)).isoformat() + 'Z'
        time_max = (datetime.now() + timedelta(days=30)).isoformat() + 'Z'
        
        print(f"[CALENDAR-SYNC] Fetching events from {time_min} to {time_max}")
        
        events_result = service.events().list(
            calendarId=calendar_id,
            timeMin=time_min,
            timeMax=time_max,
            maxResults=100,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        print(f"[CALENDAR-SYNC] Found {len(events)} events")
        
        synced_count = 0
        matched_count = 0
        created_count = 0
        
        for event in events:
            google_event_id = event.get('id')
            if not google_event_id:
                continue
            
            # Check if we already have this event
            existing_event = db.query(CalendarEvent).filter(
                CalendarEvent.google_event_id == google_event_id
            ).first()
            
            # Parse event data
            start = event.get('start', {}).get('dateTime') or event.get('start', {}).get('date')
            end = event.get('end', {}).get('dateTime') or event.get('end', {}).get('date')
            timezone = event.get('start', {}).get('timeZone', 'America/Los_Angeles')
            
            if not start or not end:
                continue
            
            # Parse datetime
            try:
                if 'T' in start:
                    start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                else:
                    start_dt = datetime.fromisoformat(start)
                
                if 'T' in end:
                    end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))
                else:
                    end_dt = datetime.fromisoformat(end)
            except Exception as e:
                print(f"[CALENDAR-SYNC] Error parsing dates for event {google_event_id}: {e}")
                continue
            
            # Extract attendee emails
            attendees = event.get('attendees', [])
            attendee_emails = [a.get('email', '').lower() for a in attendees if a.get('email')]
            attendee_emails_json = ','.join(attendee_emails)
            
            # Get event links
            hangout_link = event.get('hangoutLink') or event.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri', '')
            html_link = event.get('htmlLink', '')
            
            # Match to client by email
            matched_client = None
            if attendee_emails:
                # Try to find client by email (check both client email and contact emails)
                for email in attendee_emails:
                    # Check client email
                    client = db.query(Client).filter(Client.email.ilike(email)).first()
                    if client:
                        matched_client = client
                        break
                    
                    # Check contact emails
                    contact = db.query(ClientContact).filter(ClientContact.email.ilike(email)).first()
                    if contact:
                        matched_client = contact.client
                        break
            
            if existing_event:
                # Update existing event
                existing_event.start_time = start_dt
                existing_event.end_time = end_dt
                existing_event.timezone = timezone
                existing_event.attendee_emails = attendee_emails_json
                existing_event.hangout_link = hangout_link
                existing_event.html_link = html_link
                existing_event.status = event.get('status', 'confirmed')
                existing_event.last_synced_at = datetime.now()
                
                # Update client match if we found one and it wasn't matched before
                if matched_client and not existing_event.client_id:
                    existing_event.client_id = matched_client.id
                    matched_count += 1
                    print(f"[CALENDAR-SYNC] Matched event {google_event_id} to client {matched_client.id}")
                
                synced_count += 1
            else:
                # Create new event
                new_event = CalendarEvent(
                    google_event_id=google_event_id,
                    calendar_id=calendar_id,
                    event_title=event.get('summary', 'Untitled Event'),
                    event_description=event.get('description', ''),
                    start_time=start_dt,
                    end_time=end_dt,
                    timezone=timezone,
                    attendee_emails=attendee_emails_json,
                    hangout_link=hangout_link,
                    html_link=html_link,
                    status=event.get('status', 'confirmed'),
                    client_id=matched_client.id if matched_client else None,
                    last_synced_at=datetime.now()
                )
                db.add(new_event)
                created_count += 1
                
                if matched_client:
                    matched_count += 1
                    print(f"[CALENDAR-SYNC] Created and matched event {google_event_id} to client {matched_client.id}")
                
                # Create a note for the client if matched
                if matched_client:
                    note_content = f"Calendar booking scheduled:\n"
                    note_content += f"Title: {event.get('summary', 'Untitled Event')}\n"
                    note_content += f"Date: {start_dt.strftime('%Y-%m-%d %H:%M')}\n"
                    if hangout_link:
                        note_content += f"Meet Link: {hangout_link}\n"
                    if event.get('description'):
                        note_content += f"\nDescription:\n{event.get('description')}"
                    
                    meeting_note = ClientNote(
                        client_id=matched_client.id,
                        title="Calendar Booking Scheduled",
                        content=note_content,
                        note_type="Meeting",
                        meeting_date=start_dt,
                        created_by="System"
                    )
                    db.add(meeting_note)
        
        db.commit()
        
        return {
            "message": "Calendar sync completed",
            "events_found": len(events),
            "events_synced": synced_count,
            "events_created": created_count,
            "events_matched": matched_count
        }
        
    except Exception as e:
        db.rollback()
        print(f"[CALENDAR-SYNC] ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to sync calendar: {str(e)}")


@router.get("/calendar-events")
def get_calendar_events(
    client_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get calendar events, optionally filtered by client"""
    query = db.query(CalendarEvent)
    
    if client_id:
        query = query.filter(CalendarEvent.client_id == client_id)
    
    events = query.order_by(CalendarEvent.start_time.desc()).offset(skip).limit(limit).all()
    
    return events


@router.get("/{client_id}/upcoming-bookings")
def get_upcoming_bookings(client_id: int, db: Session = Depends(get_db)):
    """Check if client has any upcoming calendar bookings"""
    from datetime import datetime
    
    # Verify client exists
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get upcoming events for this client
    now = datetime.now()
    upcoming_events = db.query(CalendarEvent).filter(
        CalendarEvent.client_id == client_id,
        CalendarEvent.start_time > now,
        CalendarEvent.status == 'confirmed'
    ).order_by(CalendarEvent.start_time.asc()).all()
    
    return {
        "has_upcoming_bookings": len(upcoming_events) > 0,
        "upcoming_events": [
            {
                "id": event.id,
                "title": event.event_title,
                "start_time": event.start_time.isoformat(),
                "end_time": event.end_time.isoformat(),
                "hangout_link": event.hangout_link
            }
            for event in upcoming_events
        ]
    }

