"""
Database initialization script.
Run this to create the database tables and optionally seed with initial data.
"""
from database import engine, Base
from models import Client, Invoice, InvoiceItem, ScopeOfWork, ScopeSection, UserProfile
from sqlalchemy.orm import sessionmaker

# Create all tables
Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")

# Optional: Seed with initial data
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Check if we already have data
    existing_clients = db.query(Client).count()
    
    if existing_clients == 0:
        print("Seeding database with initial data...")
        
        # Create sample clients
        clients_data = [
            {
                "name": "Acme Corporation",
                "email": "contact@acme.com",
                "phone": "+1 (555) 123-4567",
                "status": "Active",
                "company": "Acme Corporation",
            },
            {
                "name": "TechStart Inc.",
                "email": "hello@techstart.com",
                "phone": "+1 (555) 234-5678",
                "status": "Active",
                "company": "TechStart Inc.",
            },
            {
                "name": "Global Solutions",
                "email": "info@globalsolutions.com",
                "phone": "+1 (555) 345-6789",
                "status": "Inactive",
                "company": "Global Solutions",
            },
        ]
        
        for client_data in clients_data:
            client = Client(**client_data)
            db.add(client)
        
        db.commit()
        print(f"Created {len(clients_data)} sample clients")
    else:
        print(f"Database already contains {existing_clients} clients. Skipping seed.")
        
except Exception as e:
    print(f"Error seeding database: {e}")
    db.rollback()
finally:
    db.close()

print("Database initialization complete!")

