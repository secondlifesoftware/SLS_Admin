"""
Seed script to populate the database with mock client data
"""
from datetime import datetime, timedelta
from database import SessionLocal
from models import Client, ClientContact, ClientNote, ClientTimeline, Contract, ContractMilestone

def seed_clients():
    db = SessionLocal()
    
    try:
        # Check if clients already exist
        existing_clients = db.query(Client).count()
        if existing_clients > 0:
            print(f"Database already has {existing_clients} clients. Skipping seed.")
            return
        
        # Sample clients data
        clients_data = [
            {
                "first_name": "Sarah",
                "last_name": "Johnson",
                "email": "sarah.johnson@techcorp.com",
                "client_date": datetime.now() - timedelta(days=120),
                "description": "E-commerce platform with AI-powered product recommendations and automated inventory management.",
                "hourly_rate": 150.00,
                "notes_from_last_meeting": "Discussed MVP features. Client wants to launch in Q2 2024. Need to finalize design mockups by next week.",
                "timeline": "6 months",
                "contract_status": "Contract Signed",
                "contract_type": "Milestone Based",
                "status": "Active",
                "company": "TechCorp Solutions",
                "address": "123 Innovation Drive, San Francisco, CA 94105",
                "contacts": [
                    {"name": "Sarah Johnson", "email": "sarah.johnson@techcorp.com", "phone": "415-555-0101", "title": "CEO", "order": 1},
                    {"name": "Michael Chen", "email": "michael.chen@techcorp.com", "phone": "415-555-0102", "title": "CTO", "order": 2},
                    {"name": "Emily Rodriguez", "email": "emily.r@techcorp.com", "phone": "415-555-0103", "title": "Project Manager", "order": 3},
                ]
            },
            {
                "first_name": "David",
                "last_name": "Martinez",
                "email": "david.martinez@startupx.io",
                "client_date": datetime.now() - timedelta(days=90),
                "description": "Mobile app for fitness tracking with social features and personalized workout plans.",
                "hourly_rate": 125.00,
                "notes_from_last_meeting": "Reviewing wireframes. Client is happy with progress. Next milestone due in 2 weeks.",
                "timeline": "4 months",
                "contract_status": "Negotiation",
                "contract_type": "Fixed Price",
                "contract_due_date": datetime.now() + timedelta(days=90),
                "status": "Active",
                "company": "StartupX",
                "address": "456 Startup Blvd, Austin, TX 78701",
                "contacts": [
                    {"name": "David Martinez", "email": "david.martinez@startupx.io", "phone": "512-555-0201", "title": "Founder", "order": 1},
                    {"name": "Jessica Park", "email": "jessica@startupx.io", "phone": "512-555-0202", "title": "Co-Founder", "order": 2},
                ]
            },
            {
                "first_name": "Robert",
                "last_name": "Thompson",
                "email": "r.thompson@enterprise.com",
                "client_date": datetime.now() - timedelta(days=60),
                "description": "Enterprise CRM system with custom integrations and advanced analytics dashboard.",
                "hourly_rate": 200.00,
                "notes_from_last_meeting": "Initial consultation completed. Waiting for budget approval from board.",
                "timeline": "8 months",
                "contract_status": "Not Heard Back",
                "contract_type": None,
                "status": "Prospect",
                "company": "Enterprise Solutions Inc",
                "address": "789 Corporate Plaza, New York, NY 10001",
                "contacts": [
                    {"name": "Robert Thompson", "email": "r.thompson@enterprise.com", "phone": "212-555-0301", "title": "VP of Technology", "order": 1},
                    {"name": "Lisa Anderson", "email": "lisa.anderson@enterprise.com", "phone": "212-555-0302", "title": "Director of Operations", "order": 2},
                    {"name": "James Wilson", "email": "j.wilson@enterprise.com", "phone": "212-555-0303", "title": "IT Manager", "order": 3},
                ]
            },
            {
                "first_name": "Amanda",
                "last_name": "Williams",
                "email": "amanda.w@creativeagency.com",
                "client_date": datetime.now() - timedelta(days=30),
                "description": "Portfolio website redesign with CMS integration and booking system for client consultations.",
                "hourly_rate": 100.00,
                "notes_from_last_meeting": "Client approved design concepts. Starting development phase next week.",
                "timeline": "3 months",
                "contract_status": "Contract Signed",
                "contract_type": "Fixed Price",
                "contract_due_date": datetime.now() + timedelta(days=60),
                "status": "Active",
                "company": "Creative Agency Co",
                "address": "321 Design Street, Los Angeles, CA 90028",
                "contacts": [
                    {"name": "Amanda Williams", "email": "amanda.w@creativeagency.com", "phone": "323-555-0401", "title": "Creative Director", "order": 1},
                ]
            },
            {
                "first_name": "Christopher",
                "last_name": "Brown",
                "email": "chris.brown@healthtech.com",
                "client_date": datetime.now() - timedelta(days=15),
                "description": "Telemedicine platform with video consultation, prescription management, and patient records.",
                "hourly_rate": 175.00,
                "notes_from_last_meeting": "Initial discovery call. Client needs HIPAA compliance. Proposal sent, awaiting response.",
                "timeline": "9 months",
                "contract_status": "Negotiation",
                "contract_type": None,
                "status": "Lead",
                "company": "HealthTech Innovations",
                "address": "654 Medical Center Drive, Boston, MA 02115",
                "contacts": [
                    {"name": "Christopher Brown", "email": "chris.brown@healthtech.com", "phone": "617-555-0501", "title": "CEO", "order": 1},
                    {"name": "Dr. Maria Garcia", "email": "m.garcia@healthtech.com", "phone": "617-555-0502", "title": "Chief Medical Officer", "order": 2},
                ]
            },
        ]
        
        # Create clients with contacts
        for client_data in clients_data:
            contacts_data = client_data.pop("contacts", [])
            
            # Create client
            client = Client(**client_data)
            db.add(client)
            db.flush()  # Get the client ID
            
            # Create contacts
            for contact_data in contacts_data:
                contact = ClientContact(client_id=client.id, **contact_data)
                db.add(contact)
            
            # Add some timeline events
            timeline_events = [
                {
                    "event_type": "Initial Contact",
                    "title": "First Contact",
                    "description": f"Initial contact with {client.first_name} {client.last_name}",
                    "event_date": client.client_date,
                    "next_steps": "Schedule discovery call"
                },
                {
                    "event_type": "Proposal Sent",
                    "title": "Proposal Delivered",
                    "description": "Sent detailed proposal with project scope and pricing",
                    "event_date": client.client_date + timedelta(days=7),
                    "next_steps": "Follow up in 3 days"
                },
            ]
            
            if client.contract_status == "Contract Signed":
                timeline_events.append({
                    "event_type": "Contract Signed",
                    "title": "Contract Executed",
                    "description": "Contract signed and project kickoff scheduled",
                    "event_date": client.client_date + timedelta(days=14),
                    "next_steps": "Begin project development"
                })
            
            for event_data in timeline_events:
                event = ClientTimeline(client_id=client.id, **event_data)
                db.add(event)
            
            # Add some notes
            notes = [
                {
                    "title": "Initial Consultation",
                    "content": f"Had initial consultation with {client.first_name}. Discussed project requirements and timeline.",
                    "note_type": "Meeting",
                    "meeting_date": client.client_date,
                    "created_by": "Darius Smith"
                },
                {
                    "title": "Follow-up Call",
                    "content": client.notes_from_last_meeting or "Follow-up discussion about project details.",
                    "note_type": "Call",
                    "created_by": "Darius Smith"
                }
            ]
            
            for note_data in notes:
                note = ClientNote(client_id=client.id, **note_data)
                db.add(note)
            
            # Add contracts for clients with Contract Signed status
            if client.contract_status == "Contract Signed":
                if client.contract_type == "Milestone Based":
                    contract = Contract(
                        client_id=client.id,
                        contract_type="Milestone Based",
                        title=f"{client.company} - Development Project",
                        total_amount=50000.00,
                        status="Active",
                        start_date=client.client_date + timedelta(days=14),
                        signed_date=client.client_date + timedelta(days=14),
                        description="Multi-phase development project with milestone-based payments",
                        terms="Payment upon completion of each milestone"
                    )
                    db.add(contract)
                    db.flush()
                    
                    # Add milestones
                    milestones = [
                        {"title": "Design & Planning", "description": "Complete design mockups and project planning", "amount": 10000.00, "due_date": client.client_date + timedelta(days=30), "order": 1},
                        {"title": "MVP Development", "description": "Build minimum viable product", "amount": 20000.00, "due_date": client.client_date + timedelta(days=90), "order": 2},
                        {"title": "Feature Completion", "description": "Complete all core features", "amount": 15000.00, "due_date": client.client_date + timedelta(days=150), "order": 3},
                        {"title": "Testing & Launch", "description": "Final testing and production launch", "amount": 5000.00, "due_date": client.client_date + timedelta(days=180), "order": 4},
                    ]
                    
                    for milestone_data in milestones:
                        milestone = ContractMilestone(contract_id=contract.id, **milestone_data)
                        db.add(milestone)
                
                elif client.contract_type == "Fixed Price":
                    contract = Contract(
                        client_id=client.id,
                        contract_type="Fixed Price",
                        title=f"{client.company} - Website Redesign",
                        total_amount=25000.00,
                        status="Active",
                        start_date=client.client_date + timedelta(days=14),
                        due_date=client.contract_due_date,
                        signed_date=client.client_date + timedelta(days=14),
                        description="Complete website redesign with CMS integration",
                        terms="50% upfront, 50% upon completion"
                    )
                    db.add(contract)
        
        db.commit()
        print(f"Successfully seeded {len(clients_data)} clients with contacts, timeline events, notes, and contracts!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding clients: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_clients()

