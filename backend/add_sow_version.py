"""
Add version column to scope_of_work table
"""
import sqlite3

def add_version_column():
    """Add version column to scope_of_work table"""
    conn = sqlite3.connect('sls_admin.db')
    cursor = conn.cursor()
    
    try:
        # Add version column
        cursor.execute('''
            ALTER TABLE scope_of_work 
            ADD COLUMN version INTEGER DEFAULT 1
        ''')
        
        # Update existing records to have version 1
        cursor.execute('''
            UPDATE scope_of_work 
            SET version = 1 
            WHERE version IS NULL
        ''')
        
        conn.commit()
        print("✅ Successfully added version column to scope_of_work table!")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("⚠️  Column version already exists")
        else:
            print(f"❌ Error: {e}")
            conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_version_column()
