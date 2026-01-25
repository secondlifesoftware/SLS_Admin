"""
Add is_admin column to user_profiles table
"""
import sqlite3

def add_admin_column():
    """Add is_admin column to user_profiles table"""
    conn = sqlite3.connect('sls_admin.db')
    cursor = conn.cursor()
    
    try:
        # Add is_admin column
        cursor.execute('''
            ALTER TABLE user_profiles 
            ADD COLUMN is_admin INTEGER DEFAULT 0
        ''')
        
        # Mark specific users as admins
        admin_emails = [
            'dks1018@gmail.com',
            'info@secondlifesoftware.com'
        ]
        
        for email in admin_emails:
            cursor.execute('''
                UPDATE user_profiles 
                SET is_admin = 1 
                WHERE email = ?
            ''', (email,))
            if cursor.rowcount > 0:
                print(f"✅ Marked {email} as admin")
            else:
                print(f"⚠️  User not found: {email}")
        
        conn.commit()
        print("\n✅ Successfully added is_admin column and marked admin users!")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("⚠️  Column is_admin already exists")
            # Still try to mark users as admins
            admin_emails = [
                'dks1018@gmail.com',
                'info@secondlifesoftware.com'
            ]
            
            for email in admin_emails:
                cursor.execute('''
                    UPDATE user_profiles 
                    SET is_admin = 1 
                    WHERE email = ?
                ''', (email,))
                if cursor.rowcount > 0:
                    print(f"✅ Marked {email} as admin")
            
            conn.commit()
        else:
            print(f"❌ Error: {e}")
            conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_admin_column()
